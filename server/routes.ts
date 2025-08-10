import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import { insertUserSchema, insertProfileSchema, insertMindmapSchema, insertXpTransactionSchema, insertUserUnlockableSchema } from "@shared/schema";
import { z } from "zod";

// Session middleware setup
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword
      });

      // Create profile
      await storage.createProfile({
        user_id: user.id,
        username,
        email,
      });

      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: 'Signup failed' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(400).json({ error: 'Signin failed' });
    }
  });

  app.post('/api/auth/signout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Signout failed' });
      }
      res.json({ message: 'Signed out successfully' });
    });
  });

  app.get('/api/auth/session', async (req, res) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.json({ user: null });
    }

    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  });

  // Profile routes
  app.get('/api/profile', requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.session.userId!);
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  app.post('/api/profile/award-xp', requireAuth, async (req, res) => {
    try {
      const { amount, reason, mindmapId } = req.body;
      const userId = req.session.userId!;

      // Create XP transaction
      await storage.createXpTransaction({
        user_id: userId,
        amount,
        type: 'earned',
        reason,
        mindmap_id: mindmapId || null
      });

      // Update profile XP
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const newXP = profile.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      const updatedProfile = await storage.updateProfile(userId, {
        xp: newXP,
        level: newLevel
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error('Award XP error:', error);
      res.status(500).json({ error: 'Failed to award XP' });
    }
  });

  app.post('/api/profile/spend-xp', requireAuth, async (req, res) => {
    try {
      const { amount, reason } = req.body;
      const userId = req.session.userId!;

      const profile = await storage.getProfile(userId);
      if (!profile || profile.xp < amount) {
        return res.status(400).json({ error: 'Insufficient XP' });
      }

      // Create XP transaction
      await storage.createXpTransaction({
        user_id: userId,
        amount,
        type: 'spent',
        reason
      });

      // Update profile XP
      const newXP = profile.xp - amount;
      const updatedProfile = await storage.updateProfile(userId, { xp: newXP });

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error('Spend XP error:', error);
      res.status(500).json({ error: 'Failed to spend XP' });
    }
  });

  // Mindmap routes
  app.get('/api/mindmaps', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const mindmaps = await storage.getMindmaps(req.session.userId!, limit);
      res.json(mindmaps);
    } catch (error) {
      console.error('Get mindmaps error:', error);
      res.status(500).json({ error: 'Failed to get mindmaps' });
    }
  });

  app.post('/api/mindmaps', requireAuth, async (req, res) => {
    try {
      const mindmapData = insertMindmapSchema.parse({
        ...req.body,
        user_id: req.session.userId!
      });
      
      const mindmap = await storage.createMindmap(mindmapData);
      res.json(mindmap);
    } catch (error) {
      console.error('Create mindmap error:', error);
      res.status(500).json({ error: 'Failed to create mindmap' });
    }
  });

  app.delete('/api/mindmaps/:id', requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteMindmap(req.params.id, req.session.userId!);
      if (!success) {
        return res.status(404).json({ error: 'Mindmap not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete mindmap error:', error);
      res.status(500).json({ error: 'Failed to delete mindmap' });
    }
  });

  // Unlockables routes
  app.get('/api/unlockables', async (req, res) => {
    try {
      const unlockables = await storage.getUnlockables();
      res.json(unlockables);
    } catch (error) {
      console.error('Get unlockables error:', error);
      res.status(500).json({ error: 'Failed to get unlockables' });
    }
  });

  app.get('/api/user-unlockables', requireAuth, async (req, res) => {
    try {
      const userUnlockables = await storage.getUserUnlockables(req.session.userId!);
      res.json(userUnlockables);
    } catch (error) {
      console.error('Get user unlockables error:', error);
      res.status(500).json({ error: 'Failed to get user unlockables' });
    }
  });

  app.post('/api/unlock-item', requireAuth, async (req, res) => {
    try {
      const { unlockableId } = req.body;
      const userId = req.session.userId!;

      // Get unlockable info
      const unlockables = await storage.getUnlockables();
      const unlockable = unlockables.find(u => u.id === unlockableId);
      if (!unlockable) {
        return res.status(404).json({ error: 'Unlockable not found' });
      }

      // Check if already unlocked
      const userUnlockables = await storage.getUserUnlockables(userId);
      if (userUnlockables.some(u => u.unlockable_id === unlockableId)) {
        return res.status(400).json({ error: 'Already unlocked' });
      }

      // Check if user has enough XP
      const profile = await storage.getProfile(userId);
      if (!profile || profile.xp < unlockable.xp_cost) {
        return res.status(400).json({ error: 'Not enough XP' });
      }

      // Spend XP
      await storage.createXpTransaction({
        user_id: userId,
        amount: unlockable.xp_cost,
        type: 'spent',
        reason: unlockable.name
      });

      // Update profile XP
      const newXP = profile.xp - unlockable.xp_cost;
      await storage.updateProfile(userId, { xp: newXP });

      // Unlock item
      const userUnlockable = await storage.createUserUnlockable({
        user_id: userId,
        unlockable_id: unlockableId
      });

      res.json(userUnlockable);
    } catch (error) {
      console.error('Unlock item error:', error);
      res.status(500).json({ error: 'Failed to unlock item' });
    }
  });

  // AI routes (replacing Supabase Edge Functions)
  app.post('/api/generate-mindmap', async (req, res) => {
    try {
      const { text, category } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      const categoryPrompts = {
        'notes for a class': 'Create a mind map for academic notes with main topics, subtopics, key concepts, and detailed explanations. Focus on learning objectives and knowledge hierarchy.',
        'project idea': 'Create a mind map for a project with phases, deliverables, resources needed, timeline, and key stakeholders. Focus on project planning and execution.',
        'full stack app MVP': 'Create a mind map for an app MVP with features, tech stack, user flows, database design, API endpoints, and deployment strategy. Focus on technical architecture.',
        'brainstorming': 'Create a mind map for brainstorming with main themes, creative ideas, connections between concepts, and potential solutions. Focus on idea generation and exploration.',
        'problem solving': 'Create a mind map for problem solving with problem definition, root causes, potential solutions, evaluation criteria, and implementation steps. Focus on systematic analysis.',
        'other': 'Create a comprehensive mind map that organizes the information into logical categories and subcategories.'
      };

      const specificPrompt = categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.other;

      const prompt = `${specificPrompt}

Input text: "${text}"

Create a JSON response with a "nodes" array. Each node should have:
- id: unique identifier (string)
- text: short, clear label (max 25 characters)
- x: x coordinate (number)
- y: y coordinate (number)  
- level: hierarchy level (0 for center, 1 for main branches, 2 for sub-branches)
- children: array of child node IDs

Layout the nodes in a radial pattern around a central node at (400, 200). Main branches should be 150px from center, sub-branches 80px from their parent. Distribute evenly in a circle.

Return only the JSON object with the nodes array. No other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a mind mapping expert. Create well-structured, organized mind maps based on user input and category.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const mindMapData = JSON.parse(content);
        res.json(mindMapData);
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        const fallbackNodes = [
          {
            id: 'central',
            text: text.substring(0, 25),
            x: 400,
            y: 200,
            level: 0,
            children: ['branch-1', 'branch-2']
          },
          {
            id: 'branch-1',
            text: 'Main Idea 1',
            x: 550,
            y: 150,
            level: 1,
            children: []
          },
          {
            id: 'branch-2',
            text: 'Main Idea 2',
            x: 250,
            y: 250,
            level: 1,
            children: []
          }
        ];
        
        res.json({ nodes: fallbackNodes });
      }
    } catch (error) {
      console.error('Generate mindmap error:', error);
      res.status(500).json({ error: 'Failed to generate mindmap' });
    }
  });

  app.post('/api/chat-assistant', async (req, res) => {
    try {
      const { message, mindMapNodes, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'No message provided' });
      }

      const systemPrompt = `You are a helpful mind mapping assistant. You help users modify and improve their mind maps through natural conversation.

Current mind map structure:
${JSON.stringify(mindMapNodes, null, 2)}

Instructions:
- Speak naturally and conversationally, like a friendly assistant
- NEVER use technical terms like "branch-1" or "node-2" 
- When the user asks to modify the mind map, respond with the updated structure
- For mind map changes, include a JSON object at the end of your response with the key "updatedMindMap" containing the new nodes array
- Keep mind map node text short (max 25 characters)
- Maintain the same coordinate layout patterns (central node at 400,200, branches radially distributed)
- Be helpful and encouraging

Remember: You're helping someone organize their thoughts, not teaching them technical concepts.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      // Check if response contains mind map updates
      let updatedMindMap = null;
      try {
        const jsonMatch = assistantResponse.match(/\{[\s\S]*"updatedMindMap"[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          updatedMindMap = jsonData.updatedMindMap;
        }
      } catch (parseError) {
        // No JSON found, that's okay
      }

      res.json({
        response: assistantResponse,
        updatedMindMap
      });
    } catch (error) {
      console.error('Chat assistant error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // Initialize database with seed data
  await storage.seedUnlockables();

  const httpServer = createServer(app);
  return httpServer;
}
