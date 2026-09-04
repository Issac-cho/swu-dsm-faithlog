-- Fix communities insert policy
DROP POLICY IF EXISTS "Only admins can insert communities." ON public.communities;

-- Allow any authenticated user to create a community
CREATE POLICY "Authenticated users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow users to insert memberships for themselves
DROP POLICY IF EXISTS "Memberships viewable by community members." ON public.community_memberships;
CREATE POLICY "Memberships viewable by everyone" ON public.community_memberships FOR SELECT USING (true);
CREATE POLICY "Users can insert their own membership" ON public.community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
