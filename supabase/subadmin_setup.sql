-- 1. Modify the role constraint
ALTER TABLE public.community_memberships DROP CONSTRAINT IF EXISTS community_memberships_role_check;
DO $$
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_name = 'community_memberships' AND constraint_type = 'CHECK' AND constraint_name LIKE '%role%';
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.community_memberships DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

ALTER TABLE public.community_memberships ADD CONSTRAINT community_memberships_role_check CHECK (role IN ('admin', 'sub_admin', 'member'));

-- 2. Update RLS for `cells` (Admins and Sub-admins can insert)
DROP POLICY IF EXISTS "Admins can insert cells" ON public.cells;
CREATE POLICY "Admins can insert cells" ON public.cells 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = cells.community_id AND role IN ('admin', 'sub_admin')
  )
);

-- 3. Update RLS for `shepherd_relationships`
DROP POLICY IF EXISTS "Admins can insert shepherd relationships" ON public.shepherd_relationships;
CREATE POLICY "Admins can insert shepherd relationships" ON public.shepherd_relationships
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND role IN ('admin', 'sub_admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete shepherd relationships" ON public.shepherd_relationships;
CREATE POLICY "Admins can delete shepherd relationships" ON public.shepherd_relationships
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND role IN ('admin', 'sub_admin')
  )
);

-- 4. Update RLS for `community_memberships` (Assigning cells, changing roles, kicking members)
DROP POLICY IF EXISTS "Admins can update community_memberships" ON public.community_memberships;
CREATE POLICY "Admins can update community_memberships" ON public.community_memberships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships m
    WHERE m.user_id = auth.uid() AND m.community_id = community_memberships.community_id AND m.role IN ('admin', 'sub_admin')
  )
);

DROP POLICY IF EXISTS "Admins can remove members" ON public.community_memberships;
CREATE POLICY "Admins can remove members" ON public.community_memberships
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships m
    WHERE m.user_id = auth.uid() 
      AND m.community_id = community_memberships.community_id 
      AND (
        m.role = 'admin' 
        OR 
        (m.role = 'sub_admin' AND community_memberships.role = 'member')
      )
  )
);

-- 5. Update RLS for `talent_policies`
DROP POLICY IF EXISTS "Admins can insert talent policies" ON public.talent_policies;
CREATE POLICY "Admins can insert talent policies" ON public.talent_policies
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = talent_policies.community_id AND role IN ('admin', 'sub_admin')
  )
);

DROP POLICY IF EXISTS "Admins can update talent policies" ON public.talent_policies;
CREATE POLICY "Admins can update talent policies" ON public.talent_policies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = talent_policies.community_id AND role IN ('admin', 'sub_admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete talent policies" ON public.talent_policies;
CREATE POLICY "Admins can delete talent policies" ON public.talent_policies
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = talent_policies.community_id AND role IN ('admin', 'sub_admin')
  )
);

-- 6. Update RLS for `communities` update (Sub-admins can update community info)
DROP POLICY IF EXISTS "Admins can update their community" ON public.communities;
CREATE POLICY "Admins can update their community" ON public.communities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = id AND role IN ('admin', 'sub_admin')
  )
);
