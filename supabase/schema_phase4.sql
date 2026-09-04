-- PHASE 4: Checklist

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('SYSTEM', 'CUSTOM')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT checklist_items_pkey PRIMARY KEY (id)
);
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
-- Basic RLS for now (will be refined in Phase 6 for same-cell viewing)
CREATE POLICY "Users can view own items." ON public.checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items." ON public.checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items." ON public.checklist_items FOR UPDATE USING (auth.uid() = user_id);

-- Create checklist_records table
CREATE TABLE public.checklist_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT checklist_records_pkey PRIMARY KEY (id),
  CONSTRAINT unique_record_per_day UNIQUE(user_id, checklist_item_id, record_date)
);
ALTER TABLE public.checklist_records ENABLE ROW LEVEL SECURITY;
-- Basic RLS (refined in Phase 6)
CREATE POLICY "Users can view own records." ON public.checklist_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records." ON public.checklist_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records." ON public.checklist_records FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create SYSTEM checklist items when a user joins a community
CREATE OR REPLACE FUNCTION public.handle_new_community_member()
RETURNS trigger AS $$
BEGIN
  -- Insert the 4 basic SYSTEM items
  INSERT INTO public.checklist_items (user_id, community_id, name, type, sort_order)
  VALUES 
    (new.user_id, new.community_id, '통독', 'SYSTEM', 1),
    (new.user_id, new.community_id, '기도', 'SYSTEM', 2),
    (new.user_id, new.community_id, '큐티', 'SYSTEM', 3),
    (new.user_id, new.community_id, '적용', 'SYSTEM', 4);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_member_created
  AFTER INSERT ON public.community_memberships
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_community_member();
