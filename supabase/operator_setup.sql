-- 1. Create system_operators table
CREATE TABLE IF NOT EXISTS public.system_operators (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT system_operators_pkey PRIMARY KEY (user_id)
);

-- Enable RLS on system_operators (Only operators can read it, no one can write via API)
ALTER TABLE public.system_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators viewable by operators" ON public.system_operators
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.system_operators WHERE user_id = auth.uid())
);

-- 2. Create is_operator helper function
CREATE OR REPLACE FUNCTION public.is_operator(uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_operators WHERE user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add PERMISSIVE full access policies for operators to ALL major tables
-- Profiles
CREATE POLICY "Operators have full access to profiles" ON public.profiles 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Communities
CREATE POLICY "Operators have full access to communities" ON public.communities 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Community Memberships
CREATE POLICY "Operators have full access to community_memberships" ON public.community_memberships 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Cells
CREATE POLICY "Operators have full access to cells" ON public.cells 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Checklist Items
CREATE POLICY "Operators have full access to checklist_items" ON public.checklist_items 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Checklist Records
CREATE POLICY "Operators have full access to checklist_records" ON public.checklist_records 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Weekly Reflections
CREATE POLICY "Operators have full access to weekly_reflections" ON public.weekly_reflections 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Talent Transactions
CREATE POLICY "Operators have full access to talent_transactions" ON public.talent_transactions 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Talent Policies
CREATE POLICY "Operators have full access to talent_policies" ON public.talent_policies 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));

-- Shepherd Relationships
CREATE POLICY "Operators have full access to shepherd_relationships" ON public.shepherd_relationships 
FOR ALL USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
