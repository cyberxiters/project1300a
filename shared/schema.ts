import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const discordGuilds = pgTable("discord_guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  memberCount: integer("member_count").notNull(),
  isConnected: boolean("is_connected").notNull().default(false),
});

export const insertDiscordGuildSchema = createInsertSchema(discordGuilds);

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  guildId: text("guild_id").notNull(),
  templateId: integer("template_id").notNull(),
  targetType: text("target_type").notNull(), // "all", "role", "active", "new"
  targetRoleId: text("target_role_id"),
  rateLimit: integer("rate_limit").notNull().default(5), // messages per minute
  respectUserSettings: boolean("respect_user_settings").notNull().default(true),
  status: text("status").notNull().default("draft"), // "draft", "running", "paused", "completed", "stopped"
  totalMembers: integer("total_members"),
  messagesSent: integer("messages_sent").notNull().default(0),
  messagesQueued: integer("messages_queued").notNull().default(0),
  messagesFailed: integer("messages_failed").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  messagesSent: true,
  messagesQueued: true,
  messagesFailed: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
});

export const messageLog = pgTable("message_log", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  status: text("status").notNull(), // "success", "failed", "skipped"
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageLogSchema = createInsertSchema(messageLog).omit({
  id: true,
  timestamp: true,
});

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  messagesPerMinute: integer("messages_per_minute").notNull().default(5),
  cooldownSeconds: integer("cooldown_seconds").notNull().default(15),
  maxQueueSize: integer("max_queue_size").notNull().default(10000),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  updatedAt: true,
});

export const botTokens = pgTable("bot_tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  token: text("token").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBotTokenSchema = createInsertSchema(botTokens).omit({
  id: true,
  createdAt: true,
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  activeTokenId: integer("active_token_id"), // Reference to the currently active token
  status: text("status").notNull().default("offline"), // "online", "offline", "connecting"
  lastConnectedAt: timestamp("last_connected_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDiscordGuild = z.infer<typeof insertDiscordGuildSchema>;
export type DiscordGuild = typeof discordGuilds.$inferSelect;

export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type MessageLog = typeof messageLog.$inferSelect;

export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type RateLimit = typeof rateLimits.$inferSelect;

export type InsertBotToken = z.infer<typeof insertBotTokenSchema>;
export type BotToken = typeof botTokens.$inferSelect;

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;
