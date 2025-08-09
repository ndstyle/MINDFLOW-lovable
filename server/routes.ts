import express from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { supabaseAdmin } from './supabase';
import type { InsertProfile, InsertMindmap, InsertXpTransaction, InsertUserUnlockable } from '@shared/supabase-types';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

const router = express.Router();

// Middleware to authenticate requests using simple tokens
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    
    // Decode our simple session token
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (!decoded.userId || !decoded.exp || Date.now() > decoded.exp) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Verify user exists
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = { id: user.id, email: user.email };
      next();
    } catch (decodeError) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional auth middleware for routes that work with or without auth
const optionalAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        req.user = { id: user.id, email: user.email! };
      }
    }
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Auth routes
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // Create profile
    const profileData: InsertProfile = {
      user_id: user.id,
      username: username || email.split('@')[0],
      email,
      xp: 0,
      level: 1
    };

    const profile = await storage.createProfile(profileData);

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })).toString('base64');
    
    res.status(201).json({ 
      user: { id: user.id, email: user.email },
      profile,
      session: { access_token: sessionToken },
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile
    const profile = await storage.getProfile(user.id);

    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })).toString('base64');

    res.json({
      user: { id: user.id, email: user.email },
      profile,
      session: { access_token: sessionToken },
      message: 'Signed in successfully'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

router.post('/auth/signout', (req, res) => {
  // Since we're using stateless tokens, signout is handled client-side
  res.json({ message: 'Signed out successfully' });
});

router.get('/auth/session', requireAuth, async (req, res) => {
  try {
    const profile = await storage.getProfile(req.user!.id);
    res.json({
      user: req.user,
      profile
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Profile routes
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await storage.getProfile(req.user!.id);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    const profile = await storage.updateProfile(req.user!.id, updates);
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Mindmap routes
router.get('/mindmaps', requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const mindmaps = await storage.getMindmaps(req.user!.id, limit);
    res.json(mindmaps);
  } catch (error) {
    console.error('Get mindmaps error:', error);
    res.status(500).json({ error: 'Failed to fetch mindmaps' });
  }
});

router.get('/mindmaps/:id', requireAuth, async (req, res) => {
  try {
    const mindmap = await storage.getMindmap(req.params.id, req.user!.id);
    
    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }
    
    res.json(mindmap);
  } catch (error) {
    console.error('Get mindmap error:', error);
    res.status(500).json({ error: 'Failed to fetch mindmap' });
  }
});

router.post('/mindmaps', requireAuth, async (req, res) => {
  try {
    const mindmapData: InsertMindmap = {
      ...req.body,
      user_id: req.user!.id
    };
    
    const mindmap = await storage.createMindmap(mindmapData);
    
    // Award XP for creating mindmap
    await storage.createXpTransaction({
      user_id: req.user!.id,
      amount: mindmap.xp_earned,
      type: 'earned',
      reason: 'Created mindmap',
      mindmap_id: mindmap.id
    });
    
    // Update profile XP
    const profile = await storage.getProfile(req.user!.id);
    if (profile) {
      const newXp = profile.xp + mindmap.xp_earned;
      const newLevel = Math.floor(newXp / 100) + 1;
      await storage.updateProfile(req.user!.id, { 
        xp: newXp, 
        level: newLevel 
      });
    }
    
    res.status(201).json(mindmap);
  } catch (error) {
    console.error('Create mindmap error:', error);
    res.status(500).json({ error: 'Failed to create mindmap' });
  }
});

router.patch('/mindmaps/:id', requireAuth, async (req, res) => {
  try {
    const mindmap = await storage.updateMindmap(req.params.id, req.user!.id, req.body);
    
    if (!mindmap) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }
    
    res.json(mindmap);
  } catch (error) {
    console.error('Update mindmap error:', error);
    res.status(500).json({ error: 'Failed to update mindmap' });
  }
});

router.delete('/mindmaps/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteMindmap(req.params.id, req.user!.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }
    
    res.json({ message: 'Mindmap deleted successfully' });
  } catch (error) {
    console.error('Delete mindmap error:', error);
    res.status(500).json({ error: 'Failed to delete mindmap' });
  }
});

// XP routes
router.get('/xp-transactions', requireAuth, async (req, res) => {
  try {
    const transactions = await storage.getXpTransactions(req.user!.id);
    res.json(transactions);
  } catch (error) {
    console.error('Get XP transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch XP transactions' });
  }
});

router.post('/xp-transactions', requireAuth, async (req, res) => {
  try {
    const transactionData: InsertXpTransaction = {
      ...req.body,
      user_id: req.user!.id
    };
    
    const transaction = await storage.createXpTransaction(transactionData);
    
    // Update profile XP
    const profile = await storage.getProfile(req.user!.id);
    if (profile) {
      const newXp = Math.max(0, profile.xp + transaction.amount);
      const newLevel = Math.floor(newXp / 100) + 1;
      await storage.updateProfile(req.user!.id, { 
        xp: newXp, 
        level: newLevel 
      });
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create XP transaction error:', error);
    res.status(500).json({ error: 'Failed to create XP transaction' });
  }
});

// Unlockables routes
router.get('/unlockables', optionalAuth, async (req, res) => {
  try {
    const unlockables = await storage.getUnlockables();
    res.json(unlockables);
  } catch (error) {
    console.error('Get unlockables error:', error);
    res.status(500).json({ error: 'Failed to fetch unlockables' });
  }
});

router.get('/user-unlockables', requireAuth, async (req, res) => {
  try {
    const userUnlockables = await storage.getUserUnlockables(req.user!.id);
    res.json(userUnlockables);
  } catch (error) {
    console.error('Get user unlockables error:', error);
    res.status(500).json({ error: 'Failed to fetch user unlockables' });
  }
});

router.post('/user-unlockables', requireAuth, async (req, res) => {
  try {
    const userUnlockableData: InsertUserUnlockable = {
      ...req.body,
      user_id: req.user!.id
    };
    
    const userUnlockable = await storage.createUserUnlockable(userUnlockableData);
    res.status(201).json(userUnlockable);
  } catch (error) {
    console.error('Create user unlockable error:', error);
    res.status(500).json({ error: 'Failed to unlock item' });
  }
});

// AI-powered routes
router.post('/generate-mindmap', requireAuth, async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text || !category) {
      return res.status(400).json({ error: 'Text and category are required' });
    }

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
            content: `You are an expert mind map generator. Create a structured mind map from the given text with the category context: ${category}.
            
Return a JSON object with a "nodes" array. Each node should have:
- id: unique identifier
- text: the text content  
- x: x position (use logical spacing)
- y: y position (use logical spacing)
- level: hierarchy level (0 for central, 1+ for branches)
- children: array of child node IDs

Create a well-structured, visually logical mind map that captures the key concepts and relationships.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const mindMapData = JSON.parse(content);
    res.json(mindMapData);
    
  } catch (error) {
    console.error('Generate mindmap error:', error);
    res.status(500).json({ error: 'Failed to generate mindmap' });
  }
});

router.post('/chat-assistant', requireAuth, async (req, res) => {
  try {
    const { message, mindMapNodes, conversationHistory } = req.body;

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
            content: `You are a helpful AI assistant specialized in mind map editing. You can help users modify their mind maps by adding, removing, or restructuring nodes based on natural language requests.

Current mind map structure: ${JSON.stringify(mindMapNodes)}

When the user asks to modify the mind map, respond with:
1. A natural language response explaining what you're doing
2. If changes are needed, include an "updatedMindMap" field with the modified nodes array

Keep responses conversational and helpful.`
          },
          ...conversationHistory,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Try to parse if it contains JSON for updated mind map
    let responseData = { response: content };
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.updatedMindMap) {
          responseData = { 
            response: content.replace(jsonMatch[0], '').trim(),
            updatedMindMap: parsed.updatedMindMap 
          };
        }
      }
    } catch (e) {
      // Keep original response if JSON parsing fails
    }

    res.json(responseData);
    
  } catch (error) {
    console.error('Chat assistant error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Import sub-routers
import quizRouter from './routes/quiz';
import flashcardRouter from './routes/flashcards';

// Mount sub-routers
router.use('/quiz', quizRouter);
router.use('/flashcards', flashcardRouter);

export default router;