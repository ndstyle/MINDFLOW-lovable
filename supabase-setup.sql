-- Mindflow Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mindmaps table
CREATE TABLE IF NOT EXISTS mindmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    intent VARCHAR(20) CHECK (intent IN ('study', 'teach', 'project', 'brainstorm', 'presentation')) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unlockables table
CREATE TABLE IF NOT EXISTS unlockables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('theme', 'feature')) NOT NULL,
    cost INTEGER NOT NULL
);

-- Create user_unlockables table
CREATE TABLE IF NOT EXISTS user_unlockables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unlockable_id UUID NOT NULL REFERENCES unlockables(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, unlockable_id)
);

-- Create xp_transactions table
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
    questions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
    cards JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collab_sessions table
CREATE TABLE IF NOT EXISTS collab_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mindmaps_updated_at BEFORE UPDATE ON mindmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Mindmaps policies
CREATE POLICY "Users can view own mindmaps" ON mindmaps FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own mindmaps" ON mindmaps FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own mindmaps" ON mindmaps FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own mindmaps" ON mindmaps FOR DELETE USING (auth.uid() = owner_id);

-- User unlockables policies
CREATE POLICY "Users can view own unlockables" ON user_unlockables FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own unlockables" ON user_unlockables FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- XP transactions policies
CREATE POLICY "Users can view own xp transactions" ON xp_transactions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own xp transactions" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Quizzes policies
CREATE POLICY "Users can view quizzes for own mindmaps" ON quizzes FOR SELECT USING (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = quizzes.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert quizzes for own mindmaps" ON quizzes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = quizzes.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Flashcards policies
CREATE POLICY "Users can view flashcards for own mindmaps" ON flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = flashcards.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert flashcards for own mindmaps" ON flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = flashcards.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Collaboration sessions policies
CREATE POLICY "Users can view collab sessions for own mindmaps" ON collab_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = collab_sessions.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert collab sessions for own mindmaps" ON collab_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM mindmaps WHERE mindmaps.id = collab_sessions.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Unlockables table should be publicly readable
ALTER TABLE unlockables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view unlockables" ON unlockables FOR SELECT TO authenticated USING (true);

-- Insert some default unlockables
INSERT INTO unlockables (name, type, cost) VALUES
    ('Dark Theme', 'theme', 50),
    ('Neon Theme', 'theme', 100),
    ('Ocean Theme', 'theme', 75),
    ('Advanced Export', 'feature', 200),
    ('Voice Commands', 'feature', 150),
    ('Collaboration Mode', 'feature', 300)
ON CONFLICT DO NOTHING;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, xp, level)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        0,
        1
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;