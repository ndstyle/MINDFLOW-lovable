import { pgTable, text, serial, integer, boolean, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Profiles table for user data
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: text("username"),
  email: text("email"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Mindmaps table
export const mindmaps = pgTable("mindmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  category: text("category"),
  xp_earned: integer("xp_earned").notNull().default(10),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// XP transactions table
export const xpTransactions = pgTable("xp_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'earned' or 'spent'
  reason: text("reason").notNull(),
  mindmap_id: uuid("mindmap_id").references(() => mindmaps.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Unlockables table
export const unlockables = pgTable("unlockables", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'color_theme' or 'feature'
  xp_cost: integer("xp_cost").notNull(),
  description: text("description"),
  config: jsonb("config"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User unlockables table
export const userUnlockables = pgTable("user_unlockables", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  unlockable_id: uuid("unlockable_id").notNull().references(() => unlockables.id, { onDelete: "cascade" }),
  unlocked_at: timestamp("unlocked_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.user_id],
  }),
  mindmaps: many(mindmaps),
  xpTransactions: many(xpTransactions),
  userUnlockables: many(userUnlockables),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.user_id],
    references: [users.id],
  }),
}));

export const mindmapsRelations = relations(mindmaps, ({ one, many }) => ({
  user: one(users, {
    fields: [mindmaps.user_id],
    references: [users.id],
  }),
  xpTransactions: many(xpTransactions),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.user_id],
    references: [users.id],
  }),
  mindmap: one(mindmaps, {
    fields: [xpTransactions.mindmap_id],
    references: [mindmaps.id],
  }),
}));

export const unlockablesRelations = relations(unlockables, ({ many }) => ({
  userUnlockables: many(userUnlockables),
}));

export const userUnlockablesRelations = relations(userUnlockables, ({ one }) => ({
  user: one(users, {
    fields: [userUnlockables.user_id],
    references: [users.id],
  }),
  unlockable: one(unlockables, {
    fields: [userUnlockables.unlockable_id],
    references: [unlockables.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMindmapSchema = createInsertSchema(mindmaps).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({
  id: true,
  created_at: true,
});

export const insertUnlockableSchema = createInsertSchema(unlockables).omit({
  id: true,
  created_at: true,
});

export const insertUserUnlockableSchema = createInsertSchema(userUnlockables).omit({
  id: true,
  unlocked_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Mindmap = typeof mindmaps.$inferSelect;
export type InsertMindmap = z.infer<typeof insertMindmapSchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
export type Unlockable = typeof unlockables.$inferSelect;
export type InsertUnlockable = z.infer<typeof insertUnlockableSchema>;
export type UserUnlockable = typeof userUnlockables.$inferSelect;
export type InsertUserUnlockable = z.infer<typeof insertUserUnlockableSchema>;
