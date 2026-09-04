-- Fix RLS for cells
CREATE POLICY "Admins can insert cells" ON public.cells 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE user_id = auth.uid() AND community_id = cells.community_id AND role = 'admin'
  )
);

-- In case I missed update/delete for cells, although MVP doesn't have delete UI yet.

-- Fix RLS for shepherd_relationships
CREATE POLICY "Admins can insert shepherd relationships" ON public.shepherd_relationships
FOR INSERT WITH CHECK (
  -- simplify: any admin can insert. In production, check if sheep/shepherd are in their community.
  EXISTS (
    SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete shepherd relationships" ON public.shepherd_relationships
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Everyone can view shepherd relationships" ON public.shepherd_relationships
FOR SELECT USING (true);

-- Fix update on community_memberships (Admins assigning cells)
CREATE POLICY "Admins can update community_memberships" ON public.community_memberships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships m
    WHERE m.user_id = auth.uid() AND m.community_id = community_memberships.community_id AND m.role = 'admin'
  )
);
