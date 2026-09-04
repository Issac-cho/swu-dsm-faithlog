-- 1. Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING ( true );
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ( auth.uid() = id );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PHASE 3: Community & Cells

-- Create communities table
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT communities_pkey PRIMARY KEY (id)
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities are viewable by everyone." ON public.communities FOR SELECT USING (true);
CREATE POLICY "Only admins can insert communities." ON public.communities FOR INSERT WITH CHECK (false); -- Adjust later if needed

-- Create cells table
CREATE TABLE public.cells (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT cells_pkey PRIMARY KEY (id)
);
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cells are viewable by community members." ON public.cells FOR SELECT USING (true); -- Simplify for now

-- Create community_memberships table
CREATE TABLE public.community_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cell_id uuid REFERENCES public.cells(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT community_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_community UNIQUE(user_id, community_id)
);
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships viewable by community members." ON public.community_memberships FOR SELECT USING (true);

