-- 1. Add metadata column to talent_transactions to track week_start for PERFECT_WEEK_BONUS
ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Update trigger to include PERFECT_WEEK_BONUS for new communities
CREATE OR REPLACE FUNCTION public.handle_new_community_policies()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.talent_policies (community_id, checklist_name, talent_amount)
  VALUES 
    (new.id, '통독', 10),
    (new.id, '기도', 10),
    (new.id, '큐티', 10),
    (new.id, '적용', 10),
    (new.id, 'PERFECT_WEEK_BONUS', 50); -- Default perfect week bonus
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add PERFECT_WEEK_BONUS policy to existing communities
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT id FROM public.communities) LOOP
    BEGIN
      INSERT INTO public.talent_policies (community_id, checklist_name, talent_amount)
      VALUES (r.id, 'PERFECT_WEEK_BONUS', 50);
    EXCEPTION WHEN unique_violation THEN
      -- Policy already exists, do nothing
    END;
  END LOOP;
END $$;
