import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";

// Extend Request interface
interface AuthenticatedRequest extends Request {
  user?: any;
  profile?: Database['public']['Tables']['profiles']['Row'];
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type Mindmap = Database['public']['Tables']['mindmaps']['Row'];
type Unlockable = Database['public']['Tables']['unlockables']['Row'];
type UserUnlockable = Database['public']['Tables']['user_unlockables']['Row'];

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to extract user from Supabase auth header
  const getAuthenticatedUser = async (req: any): Promise<{ user: any; profile: Profile | null }> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization header');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile };
  };

  // Middleware to require authentication
  const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { user, profile } = await getAuthenticatedUser(req);
      req.user = user;
      req.profile = profile || undefined;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Authentication required' });
    }
  };

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required' });
      }

      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      if (!authData.user) {
        return res.status(400).json({ error: 'Failed to create user' });
      }

      // Create profile with the SAME UUID from auth.users
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id, // Critical: must match auth.users.id
          username,
          xp: 0,
          level: 1,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({ error: `Database error creating new user: ${profileError.message}` });
      }

      res.json({ 
        user: authData.user,
        profile,
        session: authData.session 
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      res.json({ 
        user: data.user,
        profile,
        session: data.session 
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/signout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const { user } = await getAuthenticatedUser(req);
      res.json({ user });
    } catch (error) {
      res.json({ user: null });
    }
  });

  // Profile routes
  app.get('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user!.id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mindmap routes
  app.get('/api/mindmaps', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: mindmaps, error } = await supabase
        .from('mindmaps')
        .select('*')
        .eq('owner_id', req.user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(mindmaps);
    } catch (error) {
      console.error('Get mindmaps error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mindmaps', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, intent, content } = req.body;

      // Validate intent against schema constraints
      const validIntents = ['study', 'teach', 'project', 'brainstorm', 'presentation'];
      if (!validIntents.includes(intent)) {
        return res.status(400).json({ error: 'Invalid intent value' });
      }

      const { data: mindmap, error } = await supabase
        .from('mindmaps')
        .insert({
          owner_id: req.user!.id,
          title,
          intent,
          content,
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(mindmap);
    } catch (error) {
      console.error('Create mindmap error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // XP and unlockables routes
  app.get('/api/unlockables', async (req, res) => {
    try {
      const { data: unlockables, error } = await supabase
        .from('unlockables')
        .select('*')
        .order('cost', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(unlockables);
    } catch (error) {
      console.error('Get unlockables error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/user-unlockables', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: userUnlockables, error } = await supabase
        .from('user_unlockables')
        .select('*')
        .eq('profile_id', req.user!.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(userUnlockables);
    } catch (error) {
      console.error('Get user unlockables error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI routes (OpenAI integration)
  app.post('/api/generate-mindmap', async (req, res) => {
    try {
      const { text, category } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
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
              content: `You are an AI that creates mind maps for ${category} purposes. Create a structured mind map from the user's input. Return a JSON object with a "nodes" array. Each node should have: id, text, x, y, level (0=center, 1=main branches, 2=sub-branches), and children (array of child node IDs).`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated');
      }

      const mindmapData = JSON.parse(content);
      res.json(mindmapData);
    } catch (error) {
      console.error('Generate mindmap error:', error);
      res.status(500).json({ error: 'Failed to generate mindmap' });
    }
  });

  app.post('/api/chat-assistant', async (req, res) => {
    try {
      const { message, mindMapNodes, conversationHistory } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
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
              content: 'You are an AI assistant that helps users edit and improve their mind maps. You can add, remove, or modify nodes based on user requests. Always respond naturally and provide updated mind map data when making changes.'
            },
            ...conversationHistory,
            {
              role: 'user',
              content: `Current mind map: ${JSON.stringify(mindMapNodes)}. User request: ${message}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const assistantMessage = aiResponse.choices[0]?.message?.content;

      res.json({ response: assistantMessage });
    } catch (error) {
      console.error('Chat assistant error:', error);
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}