-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mindmaps table
CREATE TABLE public.mindmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  category TEXT,
  xp_earned INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create xp_transactions table for tracking XP gains/usage
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent')),
  reason TEXT NOT NULL,
  mindmap_id UUID REFERENCES public.mindmaps(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unlockables table for color themes and features
CREATE TABLE public.unlockables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('color_theme', 'feature')),
  xp_cost INTEGER NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_unlockables for tracking what users have unlocked
CREATE TABLE public.user_unlockables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlockable_id UUID NOT NULL REFERENCES public.unlockables(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, unlockable_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlockables ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mindmaps policies
CREATE POLICY "Users can view their own mindmaps"
  ON public.mindmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mindmaps"
  ON public.mindmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mindmaps"
  ON public.mindmaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mindmaps"
  ON public.mindmaps FOR DELETE
  USING (auth.uid() = user_id);

-- XP transactions policies
CREATE POLICY "Users can view their own xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own xp transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Unlockables policies (everyone can view)
CREATE POLICY "Anyone can view unlockables"
  ON public.unlockables FOR SELECT
  USING (true);

-- User unlockables policies
CREATE POLICY "Users can view their own unlockables"
  ON public.user_unlockables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock items"
  ON public.user_unlockables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mindmaps_updated_at
  BEFORE UPDATE ON public.mindmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default unlockables
INSERT INTO public.unlockables (name, type, xp_cost, description, config) VALUES
('AI Chat Assistant', 'feature', 20, 'Unlock the ability to chat with AI to edit your mindmaps', '{"feature": "ai_chat"}'),
('Ocean Theme', 'color_theme', 15, 'Blue ocean color theme for your mindmaps', '{"primary": "hsl(200, 100%, 50%)", "secondary": "hsl(210, 100%, 90%)"}'),
('Forest Theme', 'color_theme', 15, 'Green forest color theme for your mindmaps', '{"primary": "hsl(120, 60%, 40%)", "secondary": "hsl(120, 40%, 90%)"}'),
('Sunset Theme', 'color_theme', 15, 'Orange sunset color theme for your mindmaps', '{"primary": "hsl(25, 100%, 50%)", "secondary": "hsl(25, 100%, 90%)"}'),
('Purple Galaxy', 'color_theme', 25, 'Premium purple galaxy theme', '{"primary": "hsl(270, 80%, 50%)", "secondary": "hsl(270, 60%, 90%)"}');