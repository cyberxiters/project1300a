import { Client, GatewayIntentBits, Events, Guild, GuildMember, ActivityType } from 'discord.js';
import { storage } from '../storage';
import { MessageQueue } from './messageQueue';
import { log } from '../vite';
import { RateLimiter } from './rateLimiter';

export class DiscordClient {
  private static instance: DiscordClient;
  private client: Client;
  private isReady = false;
  private messageQueue: MessageQueue;
  private rateLimiter: RateLimiter;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private activityInterval: NodeJS.Timeout | null = null;
  private sessionDuration = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  private sessionStartTime: number = 0;
  
  private constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
      ]
    });
    
    this.rateLimiter = new RateLimiter();
    this.messageQueue = new MessageQueue(this.rateLimiter);
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on(Events.ClientReady, async () => {
      log(`Discord bot logged in as ${this.client.user?.tag}`, 'discord');
      this.isReady = true;
      this.sessionStartTime = Date.now();
      
      // Set bot activity to "Playing Cyber Artist X"
      this.setBotActivity();
      
      // Start keep-alive mechanism
      this.startKeepAlive();
      
      // Update bot status in storage
      await storage.updateBotSettings({
        status: 'online',
        lastConnectedAt: new Date()
      });
      
      // Register guilds
      await this.registerGuilds();
      
      // Start processing the message queue
      this.messageQueue.startProcessing();
    });
    
    this.client.on(Events.GuildCreate, async (guild) => {
      log(`Bot joined a new guild: ${guild.name}`, 'discord');
      await this.registerGuild(guild);
    });
    
    this.client.on(Events.GuildDelete, async (guild) => {
      log(`Bot removed from guild: ${guild.name}`, 'discord');
      await storage.updateGuild(guild.id, { isConnected: false });
    });
    
    this.client.on(Events.Error, (error) => {
      log(`Discord client error: ${error.message}`, 'discord');
    });
  }
  
  private async registerGuilds() {
    const guilds = this.client.guilds.cache;
    
    // Using Array.from to avoid iterator issues
    const guildArray = Array.from(guilds.values());
    for (const guild of guildArray) {
      await this.registerGuild(guild);
    }
  }
  
  private async registerGuild(guild: Guild) {
    const existingGuild = await storage.getGuild(guild.id);
    
    if (existingGuild) {
      await storage.updateGuild(guild.id, {
        name: guild.name,
        iconUrl: guild.iconURL() || undefined,
        memberCount: guild.memberCount,
        isConnected: true
      });
    } else {
      await storage.createGuild({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL() || undefined,
        memberCount: guild.memberCount,
        isConnected: true
      });
    }
  }
  
  static getInstance(): DiscordClient {
    if (!DiscordClient.instance) {
      DiscordClient.instance = new DiscordClient();
    }
    return DiscordClient.instance;
  }
  
  async initialize() {
    try {
      // Get active bot token from storage
      const activeToken = await storage.getActiveBotToken();
      
      if (!activeToken) {
        log('No active Discord bot token found. Please add and activate a bot token.', 'discord');
        return false;
      }
      
      await this.client.login(activeToken.token);
      return true;
    } catch (error) {
      log(`Failed to initialize Discord client: ${(error as Error).message}`, 'discord');
      
      // Update bot status in storage
      await storage.updateBotSettings({
        status: 'offline'
      });
      
      return false;
    }
  }
  
  // Set the bot's activity status
  private setBotActivity() {
    if (!this.isReady || !this.client.user) return;
    
    // Set the initial activity
    this.client.user.setActivity({
      name: 'Cyber Artist X',
      type: ActivityType.Playing
    });
    
    // Refresh activity every 30 minutes to ensure it stays set
    this.activityInterval = setInterval(() => {
      if (this.client.user) {
        this.client.user.setActivity({
          name: 'Cyber Artist X',
          type: ActivityType.Playing
        });
        log('Refreshed bot activity status', 'discord');
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
  
  // Set up a keep-alive mechanism
  private startKeepAlive() {
    // Check every minute if bot should still be active
    this.keepAliveInterval = setInterval(() => {
      const currentTime = Date.now();
      const sessionElapsed = currentTime - this.sessionStartTime;
      
      // Log periodic status to keep connection active
      if (this.isReady) {
        log(`Bot active for ${Math.floor(sessionElapsed / 60000)} minutes`, 'discord');
        
        // If session duration (3 hours) has elapsed, consider disconnecting
        if (sessionElapsed >= this.sessionDuration) {
          log('Bot has been active for 3 hours - ready to disconnect if needed', 'discord');
          // We don't automatically disconnect here, just log that the time has elapsed
        }
      }
    }, 60 * 1000); // Check every minute
  }
  
  // Clear intervals when disconnecting
  private clearIntervals() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }
  
  async disconnect() {
    this.messageQueue.stopProcessing();
    this.clearIntervals();
    this.client.destroy();
    this.isReady = false;
    
    // Update bot status in storage
    await storage.updateBotSettings({
      status: 'offline'
    });
    
    log('Discord bot disconnected', 'discord');
  }
  
  isConnected(): boolean {
    return this.isReady;
  }
  
  getClient(): Client {
    return this.client;
  }
  
  getMessageQueue(): MessageQueue {
    return this.messageQueue;
  }
  
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }
  
  async getGuildMembers(guildId: string): Promise<GuildMember[]> {
    if (!this.isReady) {
      throw new Error('Discord client is not ready');
    }
    
    try {
      const guild = this.client.guilds.cache.get(guildId);
      
      if (!guild) {
        throw new Error(`Guild with ID ${guildId} not found`);
      }
      
      // Fetch all members (this might be rate limited by Discord for large servers)
      const members = await guild.members.fetch();
      return Array.from(members.values());
    } catch (error) {
      log(`Error fetching guild members: ${(error as Error).message}`, 'discord');
      throw error;
    }
  }
  
  async sendDirectMessage(userId: string, content: string): Promise<boolean> {
    if (!this.isReady) {
      throw new Error('Discord client is not ready');
    }
    
    try {
      const user = await this.client.users.fetch(userId);
      await user.send(content);
      return true;
    } catch (error) {
      log(`Error sending DM to user ${userId}: ${(error as Error).message}`, 'discord');
      return false;
    }
  }
}

export const discordClient = DiscordClient.getInstance();
