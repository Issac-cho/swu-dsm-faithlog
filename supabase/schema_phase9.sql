-- PHASE 9: Reflection (주간 다짐 및 평가)

CREATE TABLE public.weekly_reflections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  week_start_date date NOT NULL, -- The Monday of the week
  commitment text,
  review text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT weekly_reflections_pkey PRIMARY KEY (id),
  CONSTRAINT unique_reflection_per_week UNIQUE(user_id, community_id, week_start_date)
);

ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Users can view their own reflections, or reflections of people in their cell, or their sheep, or if they are admin.
-- For simplicity in MVP, let's allow: 
-- 1. Own reflections
-- 2. Shepherd can view Sheep
-- 3. Cell members can view each other (optional, but good for community)
-- 4. Admins can view all

CREATE POLICY "Reflections viewable based on rules" ON public.weekly_reflections
FOR SELECT USING (
  auth.uid() = user_id
  OR public.in_same_cell(auth.uid(), user_id)
  OR public.is_admin_of_community_for_user(auth.uid(), user_id)
  OR public.is_shepherd_or_sheep(auth.uid(), user_id)
);

CREATE POLICY "Users can insert their own reflections" ON public.weekly_reflections
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" ON public.weekly_reflections
FOR UPDATE USING (auth.uid() = user_id);
