-- Mindflow Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor to create all required tables
-- Based on the exact schema provided

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Create mindmaps table
CREATE TABLE public.mindmaps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text NOT NULL,
  intent text CHECK (intent = ANY (ARRAY['study'::text, 'teach'::text, 'project'::text, 'brainstorm'::text, 'presentation'::text])),
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mindmaps_pkey PRIMARY KEY (id),
  CONSTRAINT mindmaps_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

-- Create unlockables table
CREATE TABLE public.unlockables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text CHECK (type = ANY (ARRAY['theme'::text, 'feature'::text])),
  cost integer NOT NULL,
  CONSTRAINT unlockables_pkey PRIMARY KEY (id)
);

-- Create user_unlockables table
CREATE TABLE public.user_unlockables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  unlockable_id uuid,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_unlockables_pkey PRIMARY KEY (id),
  CONSTRAINT user_unlockables_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT user_unlockables_unlockable_id_fkey FOREIGN KEY (unlockable_id) REFERENCES public.unlockables(id)
);

-- Create xp_transactions table
CREATE TABLE public.xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT xp_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT xp_transactions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mindmap_id uuid,
  questions jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_mindmap_id_fkey FOREIGN KEY (mindmap_id) REFERENCES public.mindmaps(id)
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mindmap_id uuid,
  cards jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_mindmap_id_fkey FOREIGN KEY (mindmap_id) REFERENCES public.mindmaps(id)
);

-- Create collab_sessions table
CREATE TABLE public.collab_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mindmap_id uuid,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collab_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT collab_sessions_mindmap_id_fkey FOREIGN KEY (mindmap_id) REFERENCES public.mindmaps(id)
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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mindmaps_updated_at BEFORE UPDATE ON public.mindmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Mindmaps policies
CREATE POLICY "Users can view own mindmaps" ON public.mindmaps FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own mindmaps" ON public.mindmaps FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own mindmaps" ON public.mindmaps FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own mindmaps" ON public.mindmaps FOR DELETE USING (auth.uid() = owner_id);

-- User unlockables policies
CREATE POLICY "Users can view own unlockables" ON public.user_unlockables FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own unlockables" ON public.user_unlockables FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- XP transactions policies
CREATE POLICY "Users can view own xp transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own xp transactions" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Quizzes policies
CREATE POLICY "Users can view quizzes for own mindmaps" ON public.quizzes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = quizzes.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert quizzes for own mindmaps" ON public.quizzes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = quizzes.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Flashcards policies
CREATE POLICY "Users can view flashcards for own mindmaps" ON public.flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = flashcards.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert flashcards for own mindmaps" ON public.flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = flashcards.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Collaboration sessions policies
CREATE POLICY "Users can view collab sessions for own mindmaps" ON public.collab_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = collab_sessions.mindmap_id AND mindmaps.owner_id = auth.uid())
);
CREATE POLICY "Users can insert collab sessions for own mindmaps" ON public.collab_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.mindmaps WHERE mindmaps.id = collab_sessions.mindmap_id AND mindmaps.owner_id = auth.uid())
);

-- Unlockables table should be publicly readable
ALTER TABLE public.unlockables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view unlockables" ON public.unlockables FOR SELECT TO authenticated USING (true);

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