-- Drop all existing policies on weekly_reflections to be absolutely sure
DROP POLICY IF EXISTS "Reflections viewable based on rules" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can insert their own reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can update their own reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Enable update for everyone" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can manage their own reflections" ON public.weekly_reflections;

-- Create an ALL policy that allows the user to do everything with their own row
CREATE POLICY "Users can manage their own reflections" ON public.weekly_reflections
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Also add the community viewing rules for SELECT only
CREATE POLICY "Reflections viewable by community" ON public.weekly_reflections
FOR SELECT USING (
  public.in_same_cell(auth.uid(), user_id)
  OR public.is_admin_of_community_for_user(auth.uid(), user_id)
  OR public.is_shepherd_or_sheep(auth.uid(), user_id)
);
