import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  profiles, 
  mindmaps, 
  xpTransactions, 
  unlockables, 
  userUnlockables,
  type User, 
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Mindmap,
  type InsertMindmap,
  type XpTransaction,
  type InsertXpTransaction,
  type Unlockable,
  type UserUnlockable,
  type InsertUserUnlockable
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;
  
  // Mindmap operations
  getMindmaps(userId: string, limit?: number): Promise<Mindmap[]>;
  createMindmap(mindmap: InsertMindmap): Promise<Mindmap>;
  deleteMindmap(id: string, userId: string): Promise<boolean>;
  
  // XP operations
  createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction>;
  getXpTransactions(userId: string): Promise<XpTransaction[]>;
  
  // Unlockables operations
  getUnlockables(): Promise<Unlockable[]>;
  getUserUnlockables(userId: string): Promise<UserUnlockable[]>;
  createUserUnlockable(userUnlockable: InsertUserUnlockable): Promise<UserUnlockable>;
  
  // Seed data
  seedUnlockables(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.user_id, userId)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const result = await db.update(profiles)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(profiles.user_id, userId))
      .returning();
    return result[0];
  }

  // Mindmap operations
  async getMindmaps(userId: string, limit?: number): Promise<Mindmap[]> {
    let query = db.select().from(mindmaps)
      .where(eq(mindmaps.user_id, userId))
      .orderBy(desc(mindmaps.created_at));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createMindmap(mindmap: InsertMindmap): Promise<Mindmap> {
    const result = await db.insert(mindmaps).values(mindmap).returning();
    return result[0];
  }

  async deleteMindmap(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(mindmaps)
      .where(and(eq(mindmaps.id, id), eq(mindmaps.user_id, userId)))
      .returning();
    return result.length > 0;
  }

  // XP operations
  async createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction> {
    const result = await db.insert(xpTransactions).values(transaction).returning();
    return result[0];
  }

  async getXpTransactions(userId: string): Promise<XpTransaction[]> {
    return await db.select().from(xpTransactions)
      .where(eq(xpTransactions.user_id, userId))
      .orderBy(desc(xpTransactions.created_at));
  }

  // Unlockables operations
  async getUnlockables(): Promise<Unlockable[]> {
    return await db.select().from(unlockables).orderBy(unlockables.xp_cost);
  }

  async getUserUnlockables(userId: string): Promise<UserUnlockable[]> {
    return await db.select({
      id: userUnlockables.id,
      user_id: userUnlockables.user_id,
      unlockable_id: userUnlockables.unlockable_id,
      unlocked_at: userUnlockables.unlocked_at,
    }).from(userUnlockables)
      .where(eq(userUnlockables.user_id, userId));
  }

  async createUserUnlockable(userUnlockable: InsertUserUnlockable): Promise<UserUnlockable> {
    const result = await db.insert(userUnlockables).values(userUnlockable).returning();
    return result[0];
  }

  // Seed data
  async seedUnlockables(): Promise<void> {
    const existingUnlockables = await this.getUnlockables();
    if (existingUnlockables.length > 0) return;

    const seedData = [
      {
        name: 'AI Chat Assistant',
        type: 'feature',
        xp_cost: 20,
        description: 'Unlock the ability to chat with AI to edit your mindmaps',
        config: { feature: 'ai_chat' }
      },
      {
        name: 'Ocean Theme',
        type: 'color_theme',
        xp_cost: 15,
        description: 'Blue ocean color theme for your mindmaps',
        config: { primary: 'hsl(200, 100%, 50%)', secondary: 'hsl(210, 100%, 90%)' }
      },
      {
        name: 'Forest Theme',
        type: 'color_theme',
        xp_cost: 15,
        description: 'Green forest color theme for your mindmaps',
        config: { primary: 'hsl(120, 60%, 40%)', secondary: 'hsl(120, 40%, 90%)' }
      },
      {
        name: 'Sunset Theme',
        type: 'color_theme',
        xp_cost: 15,
        description: 'Orange sunset color theme for your mindmaps',
        config: { primary: 'hsl(25, 100%, 50%)', secondary: 'hsl(25, 100%, 90%)' }
      },
      {
        name: 'Purple Galaxy',
        type: 'color_theme',
        xp_cost: 25,
        description: 'Premium purple galaxy theme',
        config: { primary: 'hsl(270, 80%, 50%)', secondary: 'hsl(270, 60%, 90%)' }
      }
    ];

    await db.insert(unlockables).values(seedData);
  }
}

export const storage = new DatabaseStorage();
