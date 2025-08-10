
-- Create profiles table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  email TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mindmaps table
CREATE TABLE IF NOT EXISTS mindmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  category TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create xp_transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent')),
  reason TEXT NOT NULL,
  mindmap_id UUID REFERENCES mindmaps(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unlockables table
CREATE TABLE IF NOT EXISTS unlockables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'theme')),
  xp_cost INTEGER NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_unlockables table
CREATE TABLE IF NOT EXISTS user_unlockables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unlockable_id UUID REFERENCES unlockables(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, unlockable_id)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cards JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collab_sessions table
CREATE TABLE IF NOT EXISTS collab_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  permissions TEXT DEFAULT 'view' CHECK (permissions IN ('view', 'edit')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mindmaps policies
CREATE POLICY "Users can view own mindmaps" ON mindmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mindmaps" ON mindmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mindmaps" ON mindmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mindmaps" ON mindmaps FOR DELETE USING (auth.uid() = user_id);

-- XP transactions policies
CREATE POLICY "Users can view own transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Unlockables policies (everyone can read)
CREATE POLICY "Anyone can view unlockables" ON unlockables FOR SELECT USING (true);

-- User unlockables policies
CREATE POLICY "Users can view own unlockables" ON user_unlockables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlockables" ON user_unlockables FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Users can view own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Users can view own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Collab sessions policies
CREATE POLICY "Users can view sessions they created" ON collab_sessions FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert own sessions" ON collab_sessions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own sessions" ON collab_sessions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own sessions" ON collab_sessions FOR DELETE USING (auth.uid() = created_by);

-- Insert some default unlockables
INSERT INTO unlockables (name, type, xp_cost, description, config) VALUES
('AI Chat Assistant', 'feature', 50, 'Unlock the AI chat assistant to help modify your mind maps', '{"feature": "chat"}'),
('Dark Theme', 'theme', 30, 'Unlock the dark theme for a sleek look', '{"theme": "dark"}'),
('Export to PDF', 'feature', 75, 'Export your mind maps as PDF files', '{"feature": "pdf_export"}'),
('Advanced Templates', 'feature', 100, 'Access to premium mind map templates', '{"feature": "templates"}'),
('Collaboration Mode', 'feature', 150, 'Share and collaborate on mind maps with others', '{"feature": "collaboration"}')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mindmaps_user_id ON mindmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_unlockables_user_id ON user_unlockables(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_token ON collab_sessions(session_token);
