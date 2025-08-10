import express from 'express';
import { supabaseAdmin } from './supabase';
import { storage } from './storage';
import type { InsertProfile, InsertMindmap, InsertXpTransaction, InsertUserUnlockable } from '@shared/supabase-types';

const router = express.Router();

// Middleware to require authentication
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    // Use Supabase to verify the JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = { id: user.id, email: user.email! };
    next();
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

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const user = authData.user;
    if (!user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create profile
    const profileData: InsertProfile = {
      user_id: user.id,
      email: user.email!,
      username: username || null,
      xp: 0,
      level: 1
    };

    const profile = await storage.createProfile(profileData);

    // Generate session token
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!
    });

    if (sessionError) {
      return res.status(400).json({ error: 'Failed to create session' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      token: session?.access_token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;
    if (!user) {
      return res.status(400).json({ error: 'Authentication failed' });
    }

    // Get profile
    const profile = await storage.getProfile(user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/signout', requireAuth, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await supabaseAdmin.auth.admin.signOut(token);
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const profile = await storage.updateProfile(req.user!.id, { username });
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
    const { title, content, category } = req.body;

    const xpEarned = 10; // Base XP for creating a mindmap

    const mindmapData: InsertMindmap = {
      user_id: req.user!.id,
      title,
      content,
      category: category || null,
      xp_earned: xpEarned
    };

    const mindmap = await storage.createMindmap(mindmapData);

    // Award XP
    const xpTransaction: InsertXpTransaction = {
      user_id: req.user!.id,
      amount: xpEarned,
      type: 'earned',
      reason: 'Created mindmap',
      mindmap_id: mindmap.id
    };

    await storage.createXpTransaction(xpTransaction);

    // Update profile XP and level
    const profile = await storage.getProfile(req.user!.id);
    if (profile) {
      const newXp = profile.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1; // Level up every 100 XP

      await storage.updateProfile(req.user!.id, {
        xp: newXp,
        level: newLevel
      });
    }

    res.json(mindmap);
  } catch (error) {
    console.error('Create mindmap error:', error);
    res.status(500).json({ error: 'Failed to create mindmap' });
  }
});

router.delete('/mindmaps/:id', requireAuth, async (req, res) => {
  try {
    const success = await storage.deleteMindmap(req.params.id, req.user!.id);
    if (!success) {
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

// Unlockables routes
router.get('/unlockables', async (req, res) => {
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

router.post('/unlock', requireAuth, async (req, res) => {
  try {
    const { unlockableId } = req.body;

    // Get unlockable details
    const unlockables = await storage.getUnlockables();
    const unlockable = unlockables.find(u => u.id === unlockableId);

    if (!unlockable) {
      return res.status(404).json({ error: 'Unlockable not found' });
    }

    // Check if user has enough XP
    const profile = await storage.getProfile(req.user!.id);
    if (!profile || profile.xp < unlockable.xp_cost) {
      return res.status(400).json({ error: 'Insufficient XP' });
    }

    // Check if already unlocked
    const userUnlockables = await storage.getUserUnlockables(req.user!.id);
    const alreadyUnlocked = userUnlockables.some(u => u.unlockable_id === unlockableId);

    if (alreadyUnlocked) {
      return res.status(400).json({ error: 'Already unlocked' });
    }

    // Create unlock record
    const userUnlockableData: InsertUserUnlockable = {
      user_id: req.user!.id,
      unlockable_id: unlockableId
    };

    const userUnlockable = await storage.createUserUnlockable(userUnlockableData);

    // Deduct XP
    const xpTransaction: InsertXpTransaction = {
      user_id: req.user!.id,
      amount: -unlockable.xp_cost,
      type: 'spent',
      reason: `Unlocked ${unlockable.name}`
    };

    await storage.createXpTransaction(xpTransaction);

    // Update profile XP
    const newXp = profile.xp - unlockable.xp_cost;
    const newLevel = Math.floor(newXp / 100) + 1;

    await storage.updateProfile(req.user!.id, {
      xp: newXp,
      level: newLevel
    });

    res.json({ userUnlockable, newXp, newLevel });
  } catch (error) {
    console.error('Unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock feature' });
  }
});

// AI routes
router.post('/generate-mindmap', optionalAuth, async (req, res) => {
  try {
    const { input, category } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    // Import OpenAI here to avoid loading it unless needed
    const { OpenAI } = await import('openai');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const categoryPrompts = {
      notes: "Convert these notes into a clear, hierarchical mind map structure",
      project: "Organize this project idea into a structured mind map with phases and tasks",
      app: "Structure this app concept into a development-focused mind map",
      brainstorming: "Expand and organize these brainstorming ideas into a creative mind map",
      learning: "Create a learning-focused mind map that breaks down this topic",
      default: "Convert this input into a well-organized mind map structure"
    };

    const prompt = `${categoryPrompts[category as keyof typeof categoryPrompts] || categoryPrompts.default}:

"${input}"

Return a JSON object with this exact structure:
{
  "title": "Main topic title",
  "children": [
    {
      "title": "Subtopic 1",
      "children": [
        {
          "title": "Detail 1.1",
          "children": []
        },
        {
          "title": "Detail 1.2", 
          "children": []
        }
      ]
    },
    {
      "title": "Subtopic 2",
      "children": [
        {
          "title": "Detail 2.1",
          "children": []
        }
      ]
    }
  ]
}

Keep it focused and not too deep (max 3 levels). Return only valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a mind map generation expert. Always return valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const mindMapData = JSON.parse(content);
      res.json(mindMapData);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Return a fallback mind map
      res.json({
        title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
        children: [
          {
            title: "Key Points",
            children: [
              { title: "Point 1", children: [] },
              { title: "Point 2", children: [] }
            ]
          },
          {
            title: "Next Steps",
            children: [
              { title: "Action 1", children: [] },
              { title: "Action 2", children: [] }
            ]
          }
        ]
      });
    }
  } catch (error) {
    console.error('Generate mindmap error:', error);
    res.status(500).json({ error: 'Failed to generate mindmap' });
  }
});

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, mindmapData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Import OpenAI here to avoid loading it unless needed
    const { OpenAI } = await import('openai');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an AI assistant helping to modify mind maps. 
Current mind map: ${JSON.stringify(mindmapData, null, 2)}

User request: "${message}"

Please provide a modified version of the mind map based on the user's request. Return only valid JSON in this exact format:
{
  "title": "Main topic title",
  "children": [...]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a mind map modification expert. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const modifiedMindMap = JSON.parse(content);
      res.json({ mindmap: modifiedMindMap });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;