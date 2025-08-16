import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";
import { DocumentProcessor } from "./services/document-processor";
import { quizGenerator } from "./services/quiz-generator";
import { mindMapGenerator } from "./services/mindmap-generator";
import multer from 'multer';

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
  const documentProcessor = new DocumentProcessor();
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

  // Authentication middleware
  const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);

      // Verify the JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Fetch user profile with error handling
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            xp: 0,
            level: 1,
          }, { 
            onConflict: 'id',
            ignoreDuplicates: true 
          })
          .select()
          .single();

        if (createError && createError.code !== '23505') {
          console.error('Profile creation error:', createError);
          return res.status(500).json({ error: 'Failed to create profile' });
        }

        req.profile = newProfile || {
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
          xp: 0,
          level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        req.profile = profile;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
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

  app.delete('/api/mindmaps/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: mindmap, error } = await supabase
        .from('mindmaps')
        .delete()
        .eq('id', id)
        .eq('owner_id', req.user!.id) // Ensure user can only delete their own mindmaps
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ message: 'Mindmap deleted successfully' });
    } catch (error) {
      console.error('Delete mindmap error:', error);
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

      // Clean up the response if it contains markdown code blocks
      let cleanContent = content;
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```/g, '');
      }

      const mindmapData = JSON.parse(cleanContent);
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

  // Document upload and processing routes
  app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { user } = req;
      const file = req.file;

      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 10MB limit' });
      }

      // Process the document
      const result = await documentProcessor.processDocument(file, user.id);

      res.json({
        success: true,
        documentId: result.documentId,
        message: 'Document uploaded and processing started',
        document: result.document
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  });

  app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ documents: documents || [] });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/documents/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/documents/:id/nodes', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify document ownership
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (docError) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Get nodes for this document
      const { data: nodes, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('document_id', id)
        .order('level', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ nodes: nodes || [] });
    } catch (error) {
      console.error('Get nodes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/documents/:id/quiz', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify document ownership
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (docError) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Get quiz for this document
      const quiz = await quizGenerator.getQuizForDocument(id);
      res.json(quiz);
      
    } catch (error) {
      console.error('Get quiz error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/quiz/:questionId/answer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ error: 'Answer is required' });
      }

      const result = await quizGenerator.submitQuizAnswer(questionId, answer, req.user!.id);
      res.json(result);
      
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Setup multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, TXT, and DOCX files are allowed.'));
      }
    }
  });

  // MVP Document upload and processing routes
  app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!req.profile) {
        return res.status(401).json({ error: 'User profile not found' });
      }

      const document = await documentProcessor.processDocument(
        req.file.buffer,
        req.file.originalname,
        req.profile.id
      );

      res.json(document);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Upload failed' });
    }
  });

  app.get('/api/documents/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('status')
        .eq('id', req.params.id)
        .eq('user_id', req.profile!.id)
        .single();

      if (error || !document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ status: document.status });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Failed to check status' });
    }
  });

  app.get('/api/documents/:id/mindmap', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: nodes, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('document_id', req.params.id)
        .order('level', { ascending: true });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch mind map' });
      }

      res.json({ nodes: nodes || [] });
    } catch (error) {
      console.error('Mind map fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch mind map' });
    }
  });

  // Quiz routes
  app.post('/api/quiz/generate/:nodeId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questions = await quizGenerator.generateQuestionsForNode(req.params.nodeId);
      res.json({ questions });
    } catch (error) {
      console.error('Question generation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate questions' });
    }
  });

  app.get('/api/quiz/node/:nodeId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const questions = await quizGenerator.getQuestionsForNode(req.params.nodeId);
      res.json({ questions });
    } catch (error) {
      console.error('Question fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  });

  app.post('/api/quiz/answer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { questionId, answer, timeSpent, sessionId } = req.body;
      
      if (!questionId || !answer) {
        return res.status(400).json({ error: 'Question ID and answer are required' });
      }

      const result = await quizGenerator.submitAnswer(
        questionId,
        req.profile!.id,
        answer,
        timeSpent,
        sessionId
      );

      res.json(result);
    } catch (error) {
      console.error('Answer submission error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to submit answer' });
    }
  });

  // Export and share routes
  app.post('/api/export/:documentId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { format } = req.body; // 'markdown', 'png', 'pdf'
      
      if (format === 'markdown') {
        const markdown = await exportService.exportMarkdown(req.params.documentId, req.profile!.id);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="mindmap.md"');
        res.send(markdown);
      } else {
        res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Export failed' });
    }
  });

  app.post('/api/share/:documentId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shareToken = await exportService.generateShareLink(req.params.documentId, req.profile!.id);
      res.json({ shareToken, shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareToken}` });
    } catch (error) {
      console.error('Share link error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create share link' });
    }
  });

  app.get('/api/shared/:token', async (req: Request, res: Response) => {
    try {
      const sharedContent = await exportService.getSharedDocument(req.params.token);
      
      if (!sharedContent) {
        return res.status(404).json({ error: 'Shared content not found or expired' });
      }

      res.json(sharedContent);
    } catch (error) {
      console.error('Shared content error:', error);
      res.status(500).json({ error: 'Failed to fetch shared content' });
    }
  });

  // User library route
  app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, title, type, status, created_at, updated_at')
        .eq('user_id', req.profile!.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch documents' });
      }

      res.json({ documents: documents || [] });
    } catch (error) {
      console.error('Documents fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}