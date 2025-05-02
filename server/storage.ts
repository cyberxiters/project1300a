import {
  User,
  InsertUser,
  DiscordGuild,
  InsertDiscordGuild,
  MessageTemplate,
  InsertMessageTemplate,
  Campaign,
  InsertCampaign,
  MessageLog,
  InsertMessageLog,
  RateLimit,
  InsertRateLimit,
  BotSettings,
  InsertBotSettings,
  BotToken,
  InsertBotToken,
  users,
  discordGuilds,
  messageTemplates,
  campaigns,
  messageLog,
  rateLimits,
  botSettings,
  botTokens
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Discord Guild operations
  getGuilds(): Promise<DiscordGuild[]>;
  getGuild(id: string): Promise<DiscordGuild | undefined>;
  createGuild(guild: InsertDiscordGuild): Promise<DiscordGuild>;
  updateGuild(id: string, guild: Partial<DiscordGuild>): Promise<DiscordGuild | undefined>;
  deleteGuild(id: string): Promise<boolean>;

  // Message Template operations
  getTemplates(): Promise<MessageTemplate[]>;
  getTemplate(id: number): Promise<MessageTemplate | undefined>;
  createTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateTemplate(id: number, template: Partial<MessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteTemplate(id: number): Promise<boolean>;

  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByStatus(status: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Message Log operations
  getLogs(limit?: number): Promise<MessageLog[]>;
  getLogsByCampaign(campaignId: number, limit?: number): Promise<MessageLog[]>;
  createLog(log: InsertMessageLog): Promise<MessageLog>;

  // Rate Limit operations
  getRateLimit(): Promise<RateLimit | undefined>;
  updateRateLimit(rateLimit: InsertRateLimit): Promise<RateLimit>;

  // Bot Token operations
  getBotTokens(): Promise<BotToken[]>;
  getBotToken(id: number): Promise<BotToken | undefined>;
  getActiveBotToken(): Promise<BotToken | undefined>;
  createBotToken(token: InsertBotToken): Promise<BotToken>;
  updateBotToken(id: number, token: Partial<BotToken>): Promise<BotToken | undefined>;
  deleteBotToken(id: number): Promise<boolean>;
  activateBotToken(id: number): Promise<BotToken | undefined>;

  // Bot Settings operations
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private discordGuilds: Map<string, DiscordGuild>;
  private messageTemplates: Map<number, MessageTemplate>;
  private campaigns: Map<number, Campaign>;
  private messageLogs: MessageLog[];
  private rateLimits: RateLimit | undefined;
  private botSettings: BotSettings | undefined;
  private botTokens: Map<number, BotToken>;
  currentUserId: number;
  currentTemplateId: number;
  currentCampaignId: number;
  currentLogId: number;
  currentTokenId: number;

  constructor() {
    this.users = new Map();
    this.discordGuilds = new Map();
    this.messageTemplates = new Map();
    this.campaigns = new Map();
    this.messageLogs = [];
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentCampaignId = 1;
    this.currentLogId = 1;

    // Initialize with default rate limits
    this.rateLimits = {
      id: 1,
      messagesPerMinute: 5,
      cooldownSeconds: 15,
      maxQueueSize: 10000,
      updatedAt: new Date()
    };

    // Initialize with default bot settings
    this.botSettings = {
      id: 1,
      token: undefined,
      status: 'offline',
      lastConnectedAt: undefined,
      updatedAt: new Date()
    };

    // Add some sample templates
    this.createTemplate({
      name: 'Welcome Message',
      content: 'Hey @username, welcome to our Discord server! 👋 We\'re glad to have you join our community. Check out our #rules and #announcements channels to get started. If you have any questions, feel free to ask in #help.'
    });

    this.createTemplate({
      name: 'Event Announcement',
      content: 'Hello @username! We\'re hosting an event this weekend in our Discord server. Don\'t miss out! Check the #events channel for more details.'
    });

    this.createTemplate({
      name: 'Giveaway Notification',
      content: 'Hey @username! We\'re running a giveaway in our server. Head over to the #giveaways channel to enter!'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Discord Guild operations
  async getGuilds(): Promise<DiscordGuild[]> {
    return Array.from(this.discordGuilds.values());
  }

  async getGuild(id: string): Promise<DiscordGuild | undefined> {
    return this.discordGuilds.get(id);
  }

  async createGuild(guild: InsertDiscordGuild): Promise<DiscordGuild> {
    const newGuild: DiscordGuild = { ...guild };
    this.discordGuilds.set(guild.id, newGuild);
    return newGuild;
  }

  async updateGuild(id: string, guild: Partial<DiscordGuild>): Promise<DiscordGuild | undefined> {
    const existingGuild = this.discordGuilds.get(id);
    if (!existingGuild) return undefined;

    const updatedGuild = { ...existingGuild, ...guild };
    this.discordGuilds.set(id, updatedGuild);
    return updatedGuild;
  }

  async deleteGuild(id: string): Promise<boolean> {
    return this.discordGuilds.delete(id);
  }

  // Message Template operations
  async getTemplates(): Promise<MessageTemplate[]> {
    return Array.from(this.messageTemplates.values());
  }

  async getTemplate(id: number): Promise<MessageTemplate | undefined> {
    return this.messageTemplates.get(id);
  }

  async createTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const id = this.currentTemplateId++;
    const newTemplate: MessageTemplate = {
      ...template,
      id,
      createdAt: new Date()
    };
    this.messageTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const existingTemplate = this.messageTemplates.get(id);
    if (!existingTemplate) return undefined;

    const updatedTemplate = { ...existingTemplate, ...template };
    this.messageTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.messageTemplates.delete(id);
  }

  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByStatus(status: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.status === status
    );
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const newCampaign: Campaign = {
      ...campaign,
      id,
      messagesSent: 0,
      messagesQueued: 0,
      messagesFailed: 0,
      startedAt: campaign.status === 'running' ? new Date() : undefined,
      completedAt: undefined,
      createdAt: new Date()
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined> {
    const existingCampaign = this.campaigns.get(id);
    if (!existingCampaign) return undefined;

    // Handle status transitions
    if (campaign.status === 'running' && existingCampaign.status !== 'running') {
      campaign.startedAt = new Date();
    } else if (campaign.status === 'completed' && existingCampaign.status !== 'completed') {
      campaign.completedAt = new Date();
    }

    const updatedCampaign = { ...existingCampaign, ...campaign };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Message Log operations
  async getLogs(limit?: number): Promise<MessageLog[]> {
    const sortedLogs = this.messageLogs.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    return limit ? sortedLogs.slice(0, limit) : sortedLogs;
  }

  async getLogsByCampaign(campaignId: number, limit?: number): Promise<MessageLog[]> {
    const campaignLogs = this.messageLogs
      .filter(log => log.campaignId === campaignId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? campaignLogs.slice(0, limit) : campaignLogs;
  }

  async createLog(log: InsertMessageLog): Promise<MessageLog> {
    const id = this.currentLogId++;
    const newLog: MessageLog = {
      ...log,
      id,
      timestamp: new Date()
    };
    this.messageLogs.push(newLog);
    return newLog;
  }

  // Rate Limit operations
  async getRateLimit(): Promise<RateLimit | undefined> {
    return this.rateLimits;
  }

  async updateRateLimit(rateLimit: InsertRateLimit): Promise<RateLimit> {
    this.rateLimits = {
      ...this.rateLimits!,
      ...rateLimit,
      updatedAt: new Date()
    };
    return this.rateLimits;
  }

  // Bot Settings operations
  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }

  async updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings | undefined> {
    if (!this.botSettings) return undefined;
    
    this.botSettings = {
      ...this.botSettings,
      ...settings,
      updatedAt: new Date()
    };
    
    return this.botSettings;
  }
}

// DatabaseStorage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Discord Guild operations
  async getGuilds(): Promise<DiscordGuild[]> {
    return await db.select().from(discordGuilds);
  }

  async getGuild(id: string): Promise<DiscordGuild | undefined> {
    const [guild] = await db.select().from(discordGuilds).where(eq(discordGuilds.id, id));
    return guild || undefined;
  }

  async createGuild(guild: InsertDiscordGuild): Promise<DiscordGuild> {
    const [newGuild] = await db.insert(discordGuilds).values(guild).returning();
    return newGuild;
  }

  async updateGuild(id: string, guild: Partial<DiscordGuild>): Promise<DiscordGuild | undefined> {
    const [updatedGuild] = await db
      .update(discordGuilds)
      .set(guild)
      .where(eq(discordGuilds.id, id))
      .returning();
    return updatedGuild || undefined;
  }

  async deleteGuild(id: string): Promise<boolean> {
    const result = await db.delete(discordGuilds).where(eq(discordGuilds.id, id));
    return result.rowCount > 0;
  }

  // Message Template operations
  async getTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates);
  }

  async getTemplate(id: number): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const now = new Date();
    const [newTemplate] = await db
      .insert(messageTemplates)
      .values({
        ...template,
        createdAt: now
      })
      .returning();
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(messageTemplates)
      .set(template)
      .where(eq(messageTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
    return result.rowCount > 0;
  }

  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaignsByStatus(status: string): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.status, status));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const now = new Date();
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        ...campaign,
        messagesSent: 0,
        messagesQueued: 0,
        messagesFailed: 0,
        startedAt: campaign.status === 'running' ? now : null,
        completedAt: null,
        createdAt: now
      })
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined> {
    // Handle status transitions
    if (campaign.status) {
      const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id));
      
      if (existing) {
        if (campaign.status === 'running' && existing.status !== 'running') {
          campaign.startedAt = new Date();
        } else if (campaign.status === 'completed' && existing.status !== 'completed') {
          campaign.completedAt = new Date();
        }
      }
    }

    const [updatedCampaign] = await db
      .update(campaigns)
      .set(campaign)
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign || undefined;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return result.rowCount > 0;
  }

  // Message Log operations
  async getLogs(limit?: number): Promise<MessageLog[]> {
    const query = db.select().from(messageLog).orderBy(desc(messageLog.timestamp));
    if (limit) {
      query.limit(limit);
    }
    return await query;
  }

  async getLogsByCampaign(campaignId: number, limit?: number): Promise<MessageLog[]> {
    const query = db
      .select()
      .from(messageLog)
      .where(eq(messageLog.campaignId, campaignId))
      .orderBy(desc(messageLog.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async createLog(log: InsertMessageLog): Promise<MessageLog> {
    const now = new Date();
    const [newLog] = await db
      .insert(messageLog)
      .values({
        ...log,
        timestamp: now
      })
      .returning();
    return newLog;
  }

  // Rate Limit operations
  async getRateLimit(): Promise<RateLimit | undefined> {
    const [rateLimit] = await db.select().from(rateLimits);
    return rateLimit || undefined;
  }

  async updateRateLimit(rateLimit: InsertRateLimit): Promise<RateLimit> {
    // Check if any rate limits exist
    const existingRateLimits = await db.select().from(rateLimits);
    const now = new Date();
    
    if (existingRateLimits.length === 0) {
      // Create new rate limit
      const [newRateLimit] = await db
        .insert(rateLimits)
        .values({
          ...rateLimit,
          updatedAt: now
        })
        .returning();
      return newRateLimit;
    } else {
      // Update existing rate limit
      const [updatedRateLimit] = await db
        .update(rateLimits)
        .set({
          ...rateLimit,
          updatedAt: now
        })
        .where(eq(rateLimits.id, existingRateLimits[0].id))
        .returning();
      return updatedRateLimit;
    }
  }

  // Bot Settings operations
  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings);
    return settings || undefined;
  }

  async updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings | undefined> {
    // Check if bot settings exist
    const existingSettings = await db.select().from(botSettings);
    const now = new Date();
    
    if (existingSettings.length === 0) {
      // Create new bot settings
      const [newSettings] = await db
        .insert(botSettings)
        .values({
          id: 1,
          status: settings.status || 'offline',
          token: settings.token || null,
          lastConnectedAt: settings.lastConnectedAt || null,
          updatedAt: now
        })
        .returning();
      return newSettings;
    } else {
      // Update existing bot settings
      const [updatedSettings] = await db
        .update(botSettings)
        .set({
          ...settings,
          updatedAt: now
        })
        .where(eq(botSettings.id, existingSettings[0].id))
        .returning();
      return updatedSettings;
    }
  }

  // Initialize default data
  async initializeDefaults() {
    // Check if templates exist
    const templates = await db.select().from(messageTemplates);
    if (templates.length === 0) {
      // Add sample templates
      await db.insert(messageTemplates).values([
        {
          name: 'Welcome Message',
          content: 'Hey @username, welcome to our Discord server! 👋 We\'re glad to have you join our community. Check out our #rules and #announcements channels to get started. If you have any questions, feel free to ask in #help.',
          createdAt: new Date()
        },
        {
          name: 'Event Announcement',
          content: 'Hello @username! We\'re hosting an event this weekend in our Discord server. Don\'t miss out! Check the #events channel for more details.',
          createdAt: new Date()
        },
        {
          name: 'Giveaway Notification',
          content: 'Hey @username! We\'re running a giveaway in our server. Head over to the #giveaways channel to enter!',
          createdAt: new Date()
        }
      ]);
    }

    // Check if rate limits exist
    const rateLimitsExist = await db.select().from(rateLimits);
    if (rateLimitsExist.length === 0) {
      // Add default rate limits
      await db.insert(rateLimits).values({
        messagesPerMinute: 5,
        cooldownSeconds: 15,
        maxQueueSize: 10000,
        updatedAt: new Date()
      });
    }

    // Check if bot settings exist
    const botSettingsExist = await db.select().from(botSettings);
    if (botSettingsExist.length === 0) {
      // Add default bot settings
      await db.insert(botSettings).values({
        status: 'offline',
        token: null,
        lastConnectedAt: null,
        updatedAt: new Date()
      });
    }
  }
}

// Using the DatabaseStorage to persist data
export const storage = new DatabaseStorage();

// Initialize default data
(async () => {
  try {
    await storage.initializeDefaults();
    console.log("Database initialized with default data");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();
