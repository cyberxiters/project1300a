import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordClient } from "./discord/client";
import { log } from "./vite";
import { z } from "zod";
import { 
  insertCampaignSchema, 
  insertMessageTemplateSchema, 
  insertRateLimitSchema,
  insertBotSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Discord Bot Status API
  app.get("/api/bot/status", async (_req: Request, res: Response) => {
    const settings = await storage.getBotSettings();
    const isConnected = discordClient.isConnected();
    
    res.json({
      status: isConnected ? 'online' : 'offline',
      lastConnectedAt: settings?.lastConnectedAt
    });
  });
  
  // Discord Bot Connect/Disconnect
  app.post("/api/bot/connect", async (req: Request, res: Response) => {
    try {
      // If we already have a token, use that. Otherwise, use the one provided in the request
      const settings = await storage.getBotSettings();
      
      if (req.body.token) {
        await storage.updateBotSettings({
          token: req.body.token,
          status: 'connecting'
        });
      } else if (!settings?.token) {
        return res.status(400).json({ message: "No token provided and no token found in storage" });
      }
      
      const connected = await discordClient.initialize();
      
      if (connected) {
        res.json({ success: true, status: 'online' });
      } else {
        res.status(500).json({ success: false, message: "Failed to connect to Discord" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.post("/api/bot/disconnect", async (_req: Request, res: Response) => {
    try {
      await discordClient.disconnect();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Bot Settings API
  app.get("/api/bot/settings", async (_req: Request, res: Response) => {
    const settings = await storage.getBotSettings();
    
    // Don't send the token back to the client
    if (settings) {
      const { token, ...rest } = settings;
      res.json(rest);
    } else {
      res.status(404).json({ message: "Bot settings not found" });
    }
  });
  
  app.post("/api/bot/settings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBotSettingsSchema.parse(req.body);
      const settings = await storage.updateBotSettings(validatedData);
      
      if (settings) {
        const { token, ...rest } = settings;
        res.json(rest);
      } else {
        res.status(404).json({ message: "Bot settings not found" });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  // Guild API
  app.get("/api/guilds", async (_req: Request, res: Response) => {
    const guilds = await storage.getGuilds();
    res.json(guilds);
  });
  
  app.get("/api/guilds/:id", async (req: Request, res: Response) => {
    const guild = await storage.getGuild(req.params.id);
    
    if (guild) {
      res.json(guild);
    } else {
      res.status(404).json({ message: "Guild not found" });
    }
  });
  
  app.get("/api/guilds/:id/members", async (req: Request, res: Response) => {
    try {
      if (!discordClient.isConnected()) {
        return res.status(503).json({ message: "Discord bot is not connected" });
      }
      
      const members = await discordClient.getGuildMembers(req.params.id);
      
      // Return only necessary information about members
      const memberData = members.map(member => ({
        id: member.id,
        username: member.user.username,
        displayName: member.displayName,
        roles: member.roles.cache.map(role => ({
          id: role.id,
          name: role.name
        })),
        joinedAt: member.joinedAt
      }));
      
      res.json(memberData);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Template API
  app.get("/api/templates", async (_req: Request, res: Response) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });
  
  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const template = await storage.getTemplate(id);
    
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ message: "Template not found" });
    }
  });
  
  app.post("/api/templates", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.patch("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.updateTemplate(id, validatedData);
      
      if (template) {
        res.json(template);
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.delete("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTemplate(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Template not found" });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  // Campaign API
  app.get("/api/campaigns", async (_req: Request, res: Response) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });
  
  app.get("/api/campaigns/status/:status", async (req: Request, res: Response) => {
    const campaigns = await storage.getCampaignsByStatus(req.params.status);
    res.json(campaigns);
  });
  
  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const campaign = await storage.getCampaign(id);
    
    if (campaign) {
      res.json(campaign);
    } else {
      res.status(404).json({ message: "Campaign not found" });
    }
  });
  
  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      
      // If campaign status is 'running', start it immediately
      if (campaign.status === 'running') {
        await startCampaign(campaign.id);
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.patch("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = z.object({
        name: z.string().optional(),
        status: z.string().optional(),
        rateLimit: z.number().optional(),
        respectUserSettings: z.boolean().optional()
      }).parse(req.body);
      
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Handle status transitions
      if (validatedData.status) {
        if (validatedData.status === 'running' && campaign.status !== 'running') {
          // Campaign is being started
          const updatedCampaign = await storage.updateCampaign(id, validatedData);
          
          if (updatedCampaign) {
            await startCampaign(id);
            return res.json(updatedCampaign);
          }
        } else if (validatedData.status === 'paused' && campaign.status === 'running') {
          // Campaign is being paused - just update the status
          const updatedCampaign = await storage.updateCampaign(id, validatedData);
          return res.json(updatedCampaign || campaign);
        } else if (validatedData.status === 'stopped') {
          // Campaign is being stopped - clear the queue
          const messageQueue = discordClient.getMessageQueue();
          messageQueue.clearQueue();
          
          const updatedCampaign = await storage.updateCampaign(id, {
            ...validatedData,
            completedAt: new Date()
          });
          
          return res.json(updatedCampaign || campaign);
        }
      }
      
      // General update without special handling
      const updatedCampaign = await storage.updateCampaign(id, validatedData);
      
      if (updatedCampaign) {
        res.json(updatedCampaign);
      } else {
        res.status(404).json({ message: "Campaign not found" });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  app.delete("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCampaign(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Campaign not found" });
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  // Logs API
  app.get("/api/logs", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const logs = await storage.getLogs(limit);
    res.json(logs);
  });
  
  app.get("/api/logs/campaign/:id", async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const logs = await storage.getLogsByCampaign(campaignId, limit);
    res.json(logs);
  });
  
  // Rate Limit API
  app.get("/api/ratelimits", async (_req: Request, res: Response) => {
    const rateLimit = await storage.getRateLimit();
    
    if (rateLimit) {
      const rateLimiter = discordClient.getRateLimiter();
      const messageQueue = discordClient.getMessageQueue();
      
      // Add current usage information
      const currentRate = rateLimiter.getMessagesPerMinute();
      const usage = currentRate / rateLimit.messagesPerMinute;
      
      res.json({
        ...rateLimit,
        currentRate,
        usage,
        queueLength: messageQueue.getQueueLength()
      });
    } else {
      res.status(404).json({ message: "Rate limit settings not found" });
    }
  });
  
  app.post("/api/ratelimits", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRateLimitSchema.parse(req.body);
      const rateLimit = await storage.updateRateLimit(validatedData);
      res.json(rateLimit);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
  
  // Dashboard Stats API
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const guilds = await storage.getGuilds();
      const totalMembers = guilds.reduce((sum, guild) => sum + guild.memberCount, 0);
      
      const campaigns = await storage.getCampaigns();
      const messagesSent = campaigns.reduce((sum, campaign) => sum + campaign.messagesSent, 0);
      const messagesFailed = campaigns.reduce((sum, campaign) => sum + campaign.messagesFailed, 0);
      
      let deliveryRate = 0;
      if (messagesSent + messagesFailed > 0) {
        deliveryRate = Math.round((messagesSent / (messagesSent + messagesFailed)) * 100);
      }
      
      const messageQueue = discordClient.getMessageQueue();
      const queueLength = messageQueue.getQueueLength();
      
      const rateLimits = await storage.getRateLimit();
      const rateLimiter = discordClient.getRateLimiter();
      const currentRate = rateLimiter.getMessagesPerMinute();
      
      const activeCampaigns = await storage.getCampaignsByStatus('running');
      
      res.json({
        totalMembers,
        messagesSent,
        messagesFailed,
        deliveryRate,
        queueLength,
        rateLimits: {
          ...rateLimits,
          currentRate,
          usage: rateLimits ? currentRate / rateLimits.messagesPerMinute : 0
        },
        activeCampaignsCount: activeCampaigns.length
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to start a campaign
async function startCampaign(campaignId: number) {
  try {
    if (!discordClient.isConnected()) {
      throw new Error('Discord bot is not connected');
    }
    
    const campaign = await storage.getCampaign(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    const template = await storage.getTemplate(campaign.templateId);
    
    if (!template) {
      throw new Error(`Template with ID ${campaign.templateId} not found`);
    }
    
    const guild = await storage.getGuild(campaign.guildId);
    
    if (!guild) {
      throw new Error(`Guild with ID ${campaign.guildId} not found`);
    }
    
    // Fetch guild members
    const members = await discordClient.getGuildMembers(campaign.guildId);
    
    // Filter members based on target type
    let targetMembers = members;
    
    if (campaign.targetType === 'role' && campaign.targetRoleId) {
      targetMembers = members.filter(member => 
        member.roles.cache.has(campaign.targetRoleId!)
      );
    } else if (campaign.targetType === 'active') {
      // For 'active', we could use presence information, but this requires additional intents
      // For now, we'll just use all members
      targetMembers = members;
    } else if (campaign.targetType === 'new') {
      // For 'new', filter by join date (e.g., joined in last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      targetMembers = members.filter(member => 
        member.joinedAt && member.joinedAt > oneWeekAgo
      );
    }
    
    // Update campaign with total member count
    await storage.updateCampaign(campaignId, {
      totalMembers: targetMembers.length
    });
    
    // Don't include bots
    targetMembers = targetMembers.filter(member => !member.user.bot);
    
    // Queue messages for all target members
    const messageQueue = discordClient.getMessageQueue();
    let queuedCount = 0;
    
    for (const member of targetMembers) {
      // Skip members who have DMs disabled if respectUserSettings is true
      if (campaign.respectUserSettings) {
        // Unfortunately, we can't check this without actually trying to send a message
        // This will be handled in the messageQueue
      }
      
      // Prepare message content with variables
      let personalizedContent = template.content
        .replace(/@username/g, member.user.username)
        .replace(/@servername/g, guild.name);
      
      // Add to queue
      try {
        await messageQueue.addToCampaignQueue(
          campaignId,
          member.id,
          member.user.username,
          personalizedContent
        );
        queuedCount++;
      } catch (error) {
        log(`Failed to queue message for ${member.user.username}: ${(error as Error).message}`, 'discord');
      }
    }
    
    log(`Queued ${queuedCount} messages for campaign ${campaignId}`, 'discord');
    
    // Start processing the queue if not already
    messageQueue.startProcessing();
    
    return true;
  } catch (error) {
    log(`Error starting campaign ${campaignId}: ${(error as Error).message}`, 'discord');
    
    // Update campaign status to reflect error
    await storage.updateCampaign(campaignId, {
      status: 'stopped',
      completedAt: new Date()
    });
    
    throw error;
  }
}
