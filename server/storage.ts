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
  InsertBotSettings
} from "@shared/schema";

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
  currentUserId: number;
  currentTemplateId: number;
  currentCampaignId: number;
  currentLogId: number;

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

export const storage = new MemStorage();
