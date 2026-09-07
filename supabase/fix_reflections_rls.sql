DROP POLICY IF EXISTS "Users can insert their own reflections" ON public.weekly_reflections;
DROP POLICY IF EXISTS "Users can update their own reflections" ON public.weekly_reflections;

CREATE POLICY "Users can insert their own reflections" ON public.weekly_reflections
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" ON public.weekly_reflections
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
