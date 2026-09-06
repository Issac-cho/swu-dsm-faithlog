-- Fix checklist_items RLS policy to allow shepherds, cell members, and admins to view them
DROP POLICY IF EXISTS "Users can view own items." ON public.checklist_items;

CREATE POLICY "Checklist items viewable based on rules" ON public.checklist_items
FOR SELECT USING (
  auth.uid() = user_id
  OR public.in_same_cell(auth.uid(), user_id)
  OR public.is_admin_of_community_for_user(auth.uid(), user_id)
  OR public.is_shepherd_or_sheep(auth.uid(), user_id)
);
