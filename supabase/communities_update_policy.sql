-- Allow community admins to update their communities
CREATE POLICY "Admins can update their community" ON public.communities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_memberships.community_id = communities.id
    AND community_memberships.user_id = auth.uid()
    AND community_memberships.role = 'admin'
  )
);
