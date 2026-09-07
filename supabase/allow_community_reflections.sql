DROP POLICY IF EXISTS "Reflections viewable by community" ON public.weekly_reflections;

-- Allow viewing reflections if the viewer is in the same community as the reflection's community_id
CREATE POLICY "Reflections viewable by community" ON public.weekly_reflections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_memberships.community_id = weekly_reflections.community_id
    AND community_memberships.user_id = auth.uid()
  )
);
