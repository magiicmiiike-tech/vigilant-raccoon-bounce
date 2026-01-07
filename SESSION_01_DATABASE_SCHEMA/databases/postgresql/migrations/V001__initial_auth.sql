-- Create the 'public.profiles' table to store user profile information
-- This table references auth.users(id) from Supabase's built-in authentication.
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- e.g., 'user', 'admin', 'tenant_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'profiles' table:
-- Allow authenticated users to view their own profile
CREATE POLICY "Allow authenticated users to view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to delete their own profile
CREATE POLICY "Allow authenticated users to delete their own profile" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);

-- Create the 'public.app_sessions' table for application-specific sessions
-- This table also references auth.users(id) for user association.
CREATE TABLE public.app_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'app_sessions' table
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'app_sessions' table:
-- Allow authenticated users to view their own app sessions
CREATE POLICY "Allow authenticated users to view their own app sessions" ON public.app_sessions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own app sessions
CREATE POLICY "Allow authenticated users to insert their own app sessions" ON public.app_sessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own app sessions" ON public.app_sessions
CREATE POLICY "Allow authenticated users to delete their own app sessions" ON public.app_sessions
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add index on user_id for app_sessions for faster lookups
CREATE INDEX idx_app_sessions_user_id ON public.app_sessions (user_id);