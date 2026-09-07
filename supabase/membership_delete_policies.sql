-- Allow users to delete their own membership (Leave Community)
CREATE POLICY "Users can leave their community" ON public.community_memberships
FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to delete other users' memberships (Remove Member)
CREATE POLICY "Admins can remove members" ON public.community_memberships
FOR DELETE USING (
  public.is_admin_of_community_for_user(auth.uid(), user_id)
);
