-- PHASE 6: Authorization (RLS)

-- 1. Helper function to check if users share a cell
CREATE OR REPLACE FUNCTION public.in_same_cell(user_a uuid, user_b uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.community_memberships m1
    JOIN public.community_memberships m2 ON m1.cell_id = m2.cell_id
    WHERE m1.user_id = user_a AND m2.user_id = user_b AND m1.cell_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_of_community_for_user(viewer_id uuid, target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.community_memberships target_m
    JOIN public.community_memberships viewer_m ON target_m.community_id = viewer_m.community_id
    WHERE target_m.user_id = target_user_id 
      AND viewer_m.user_id = viewer_id
      AND viewer_m.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Helper function for shepherd relationship (Will be fully used in Phase 8)
-- Assuming shepherd_relationships table exists or will exist. Let's create it here if not.
CREATE TABLE IF NOT EXISTS public.shepherd_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shepherd_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sheep_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT shepherd_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT unique_shepherd_sheep UNIQUE(shepherd_id, sheep_id),
  CONSTRAINT no_self_shepherding CHECK (shepherd_id != sheep_id)
);
ALTER TABLE public.shepherd_relationships ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_shepherd_or_sheep(user_a uuid, user_b uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shepherd_relationships
    WHERE (shepherd_id = user_a AND sheep_id = user_b)
       OR (shepherd_id = user_b AND sheep_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Checklist Records RLS
DROP POLICY IF EXISTS "Users can view own records." ON public.checklist_records;
CREATE POLICY "Checklist records viewable based on rules" ON public.checklist_records
FOR SELECT USING (
  auth.uid() = user_id
  OR public.in_same_cell(auth.uid(), user_id)
  OR public.is_admin_of_community_for_user(auth.uid(), user_id)
  OR public.is_shepherd_or_sheep(auth.uid(), user_id)
);

-- 5. Update Talent Transactions RLS
DROP POLICY IF EXISTS "Users can view own transactions." ON public.talent_transactions;
CREATE POLICY "Talent transactions viewable based on rules" ON public.talent_transactions
FOR SELECT USING (
  auth.uid() = user_id
  OR public.in_same_cell(auth.uid(), user_id)
  OR public.is_admin_of_community_for_user(auth.uid(), user_id)
);

-- 6. Cell Total Talents (All community members can view)
-- Any member can query talent_transactions of their community, BUT only aggregated?
-- RLS doesn't allow aggregating rows you can't SELECT.
-- So we need a SECURITY DEFINER function to get cell totals.
CREATE OR REPLACE FUNCTION public.get_cell_talent_totals(p_community_id uuid)
RETURNS TABLE (cell_id uuid, cell_name text, total_talent bigint) AS $$
BEGIN
  -- Verify the caller is in the community
  IF NOT EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = p_community_id
  ) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY
  SELECT 
    c.id as cell_id,
    c.name as cell_name,
    COALESCE(SUM(t.amount), 0) as total_talent
  FROM public.cells c
  LEFT JOIN public.community_memberships m ON c.id = m.cell_id
  LEFT JOIN public.talent_transactions t ON m.user_id = t.user_id AND t.community_id = p_community_id
  WHERE c.community_id = p_community_id
  GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
