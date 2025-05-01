import { storage } from '../storage';
import { log } from '../vite';
import { RateLimiter } from './rateLimiter';
import { discordClient } from './client';

interface QueuedMessage {
  campaignId: number;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;
  private rateLimiter: RateLimiter;
  
  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }
  
  async addToCampaignQueue(
    campaignId: number, 
    userId: string, 
    username: string, 
    content: string
  ) {
    const campaign = await storage.getCampaign(campaignId);
    
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    if (campaign.status !== 'running') {
      throw new Error(`Campaign ${campaignId} is not running`);
    }
    
    const rateLimits = await storage.getRateLimit();
    
    if (!rateLimits) {
      throw new Error('Rate limits not configured');
    }
    
    // Check if queue is already at max capacity
    if (this.queue.length >= rateLimits.maxQueueSize) {
      throw new Error('Message queue is at maximum capacity');
    }
    
    // Add message to queue
    this.queue.push({
      campaignId,
      userId,
      username,
      content,
      timestamp: new Date()
    });
    
    // Update campaign stats
    await storage.updateCampaign(campaignId, {
      messagesQueued: (campaign.messagesQueued || 0) + 1
    });
    
    log(`Added message to queue for user ${username} in campaign ${campaignId}`, 'discord');
    
    return true;
  }
  
  startProcessing() {
    if (this.processing) return;
    
    this.processing = true;
    this.processQueue();
    
    log('Message queue processing started', 'discord');
  }
  
  stopProcessing() {
    if (!this.processing) return;
    
    this.processing = false;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    log('Message queue processing stopped', 'discord');
  }
  
  private async processQueue() {
    if (!this.processing) return;
    
    if (this.queue.length === 0) {
      // If queue is empty, check again in 5 seconds
      this.timer = setTimeout(() => this.processQueue(), 5000);
      return;
    }
    
    // Get the next message from the queue
    const message = this.queue.shift();
    
    if (!message) {
      this.timer = setTimeout(() => this.processQueue(), 1000);
      return;
    }
    
    try {
      // Check if we can send a message right now based on rate limits
      const canSend = await this.rateLimiter.canSendMessage();
      
      if (!canSend) {
        // Put the message back at the front of the queue
        this.queue.unshift(message);
        
        // Wait for cooldown period before trying again
        const rateLimits = await storage.getRateLimit();
        const cooldownMs = (rateLimits?.cooldownSeconds || 15) * 1000;
        
        this.timer = setTimeout(() => this.processQueue(), cooldownMs);
        return;
      }
      
      // Get the campaign
      const campaign = await storage.getCampaign(message.campaignId);
      
      if (!campaign || campaign.status !== 'running') {
        // Campaign is no longer running, log and skip this message
        await storage.createLog({
          campaignId: message.campaignId,
          userId: message.userId,
          username: message.username,
          status: 'skipped',
          errorMessage: 'Campaign is no longer running'
        });
        
        this.timer = setTimeout(() => this.processQueue(), 100);
        return;
      }
      
      // Send the direct message
      const success = await discordClient.sendDirectMessage(message.userId, message.content);
      
      // Record the result
      if (success) {
        await storage.createLog({
          campaignId: message.campaignId,
          userId: message.userId,
          username: message.username,
          status: 'success',
          errorMessage: null
        });
        
        // Update campaign stats
        await storage.updateCampaign(message.campaignId, {
          messagesSent: (campaign.messagesSent || 0) + 1,
          messagesQueued: Math.max(0, (campaign.messagesQueued || 0) - 1)
        });
        
        log(`Successfully sent message to ${message.username}`, 'discord');
      } else {
        await storage.createLog({
          campaignId: message.campaignId,
          userId: message.userId,
          username: message.username,
          status: 'failed',
          errorMessage: 'Failed to send direct message'
        });
        
        // Update campaign stats
        await storage.updateCampaign(message.campaignId, {
          messagesFailed: (campaign.messagesFailed || 0) + 1,
          messagesQueued: Math.max(0, (campaign.messagesQueued || 0) - 1)
        });
        
        log(`Failed to send message to ${message.username}`, 'discord');
      }
      
      // Mark that we sent a message for rate limiting
      this.rateLimiter.recordMessageSent();
      
      // Check if campaign is completed
      if (
        campaign.totalMembers && 
        (campaign.messagesSent + campaign.messagesFailed) >= campaign.totalMembers
      ) {
        await storage.updateCampaign(message.campaignId, {
          status: 'completed',
          completedAt: new Date()
        });
        
        log(`Campaign ${message.campaignId} completed`, 'discord');
      }
      
      // Get the delay based on rate limits
      const rateLimits = await storage.getRateLimit();
      const messagesPerMinute = rateLimits?.messagesPerMinute || 5;
      const delayMs = Math.ceil(60000 / messagesPerMinute);
      
      // Process next message after delay
      this.timer = setTimeout(() => this.processQueue(), delayMs);
    } catch (error) {
      log(`Error processing message: ${(error as Error).message}`, 'discord');
      
      // Put the message back at the front of the queue unless it's a permanent error
      if ((error as Error).message !== 'Discord client is not ready') {
        this.queue.unshift(message);
      }
      
      // Try again in 5 seconds
      this.timer = setTimeout(() => this.processQueue(), 5000);
    }
  }
  
  getQueueLength(): number {
    return this.queue.length;
  }
  
  clearQueue(): number {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }
}
