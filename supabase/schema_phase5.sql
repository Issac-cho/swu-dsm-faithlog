-- PHASE 5: Talent System

-- Create talent_policies table
CREATE TABLE public.talent_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  checklist_name text NOT NULL, -- e.g., '통독', '기도', '큐티', '적용'
  talent_amount integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT talent_policies_pkey PRIMARY KEY (id),
  CONSTRAINT unique_policy_per_community UNIQUE(community_id, checklist_name)
);
ALTER TABLE public.talent_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Policies viewable by community." ON public.talent_policies FOR SELECT USING (true);
CREATE POLICY "Only admins can modify policies." ON public.talent_policies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_memberships.user_id = auth.uid()
      AND community_memberships.community_id = talent_policies.community_id
      AND community_memberships.role = 'admin'
  )
);

-- Default policies trigger when a community is created
CREATE OR REPLACE FUNCTION public.handle_new_community_policies()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.talent_policies (community_id, checklist_name, talent_amount)
  VALUES 
    (new.id, '통독', 10),
    (new.id, '기도', 10),
    (new.id, '큐티', 10),
    (new.id, '적용', 10);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_community_policies();


-- Create talent_transactions table
CREATE TABLE public.talent_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  checklist_record_id uuid REFERENCES public.checklist_records(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL, -- 'CHECKLIST_COMPLETED', 'CHECKLIST_UNCOMPLETED', 'MANUAL_ADJUSTMENT'
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT talent_transactions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.talent_transactions ENABLE ROW LEVEL SECURITY;
-- RLS (Will refine in Phase 6)
CREATE POLICY "Users can view own transactions." ON public.talent_transactions FOR SELECT USING (auth.uid() = user_id);

-- Atomic function to toggle record and process talent
CREATE OR REPLACE FUNCTION public.toggle_checklist_record(
  p_item_id uuid,
  p_date date,
  p_completed boolean
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_community_id uuid;
  v_item_name text;
  v_item_type text;
  v_record_id uuid;
  v_talent_amount integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get item info
  SELECT community_id, name, type INTO v_community_id, v_item_name, v_item_type
  FROM public.checklist_items
  WHERE id = p_item_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or access denied';
  END IF;

  -- Upsert record
  INSERT INTO public.checklist_records (user_id, checklist_item_id, record_date, completed, updated_at)
  VALUES (v_user_id, p_item_id, p_date, p_completed, now())
  ON CONFLICT (user_id, checklist_item_id, record_date) 
  DO UPDATE SET completed = EXCLUDED.completed, updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_record_id;

  -- Handle talent transaction if SYSTEM item
  IF v_item_type = 'SYSTEM' THEN
    -- Get policy amount
    SELECT talent_amount INTO v_talent_amount
    FROM public.talent_policies
    WHERE community_id = v_community_id AND checklist_name = v_item_name;

    IF v_talent_amount IS NULL THEN
      v_talent_amount := 0;
    END IF;

    DECLARE
      v_current_sum integer;
      v_expected_sum integer;
      v_diff integer;
    BEGIN
      -- Get current sum of transactions for this record
      SELECT COALESCE(SUM(amount), 0) INTO v_current_sum
      FROM public.talent_transactions
      WHERE checklist_record_id = v_record_id;

      IF p_completed THEN
        v_expected_sum := v_talent_amount;
      ELSE
        v_expected_sum := 0;
      END IF;

      v_diff := v_expected_sum - v_current_sum;

      IF v_diff > 0 THEN
        INSERT INTO public.talent_transactions (user_id, community_id, checklist_record_id, amount, reason)
        VALUES (v_user_id, v_community_id, v_record_id, v_diff, 'CHECKLIST_COMPLETED');
      ELSIF v_diff < 0 THEN
        INSERT INTO public.talent_transactions (user_id, community_id, checklist_record_id, amount, reason)
        VALUES (v_user_id, v_community_id, v_record_id, v_diff, 'CHECKLIST_UNCOMPLETED');
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
