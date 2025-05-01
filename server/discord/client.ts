import { Client, GatewayIntentBits, Events, Guild, GuildMember } from 'discord.js';
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
    
    for (const guild of guilds.values()) {
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
      const settings = await storage.getBotSettings();
      
      if (!settings || !settings.token) {
        log('No Discord bot token found. Please configure the bot.', 'discord');
        return false;
      }
      
      await this.client.login(settings.token);
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
  
  async disconnect() {
    this.messageQueue.stopProcessing();
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
