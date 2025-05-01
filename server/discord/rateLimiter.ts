import { storage } from '../storage';

export class RateLimiter {
  private messagesSentTimestamps: number[] = [];
  
  constructor() {
    // Clean up old timestamps every minute
    setInterval(() => this.cleanupOldTimestamps(), 60000);
  }
  
  private cleanupOldTimestamps() {
    const now = Date.now();
    // Keep only timestamps from the last minute
    this.messagesSentTimestamps = this.messagesSentTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
  }
  
  async canSendMessage(): Promise<boolean> {
    const rateLimits = await storage.getRateLimit();
    
    if (!rateLimits) {
      // Default to conservative limits if not configured
      return this.messagesSentTimestamps.length < 2;
    }
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Count messages sent in the last minute
    const recentMessages = this.messagesSentTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    // Check if we're under the rate limit
    return recentMessages.length < rateLimits.messagesPerMinute;
  }
  
  recordMessageSent() {
    this.messagesSentTimestamps.push(Date.now());
  }
  
  async getCurrentRateUsage(): Promise<number> {
    const rateLimits = await storage.getRateLimit();
    
    if (!rateLimits) {
      return 0;
    }
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Count messages sent in the last minute
    const recentMessages = this.messagesSentTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    return recentMessages.length / rateLimits.messagesPerMinute;
  }
  
  getMessagesPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Count messages sent in the last minute
    const recentMessages = this.messagesSentTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    return recentMessages.length;
  }
}
