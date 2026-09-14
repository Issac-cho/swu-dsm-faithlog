-- 1. Add columns for bonus policies
ALTER TABLE public.talent_policies 
ADD COLUMN IF NOT EXISTS is_bonus boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_start_date date,
ADD COLUMN IF NOT EXISTS bonus_end_date date,
ADD COLUMN IF NOT EXISTS claim_deadline timestamp with time zone;

-- 2. Modify constraint
-- Drop existing unique constraint (which only allows 1 policy per item)
ALTER TABLE public.talent_policies DROP CONSTRAINT IF EXISTS unique_policy_per_community;

-- Create partial unique index for base policies (is_bonus = false)
DROP INDEX IF EXISTS unique_base_policy;
CREATE UNIQUE INDEX unique_base_policy ON public.talent_policies(community_id, checklist_name) WHERE is_bonus = false;

-- 3. Update toggle_checklist_record RPC to support date-bound bonuses
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
  v_now timestamp with time zone;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_now := now();

  -- Get item info
  SELECT community_id, name, type INTO v_community_id, v_item_name, v_item_type
  FROM public.checklist_items
  WHERE id = p_item_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found or access denied';
  END IF;

  -- Upsert record
  INSERT INTO public.checklist_records (user_id, checklist_item_id, record_date, completed, updated_at)
  VALUES (v_user_id, p_item_id, p_date, p_completed, v_now)
  ON CONFLICT (user_id, checklist_item_id, record_date) 
  DO UPDATE SET completed = EXCLUDED.completed, updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_record_id;

  -- Handle talent transaction if SYSTEM item
  IF v_item_type = 'SYSTEM' THEN
    -- 1. Try to find an active bonus policy for this record's date
    -- Conditions: record_date is within [bonus_start_date, bonus_end_date] AND current time is <= claim_deadline
    SELECT talent_amount INTO v_talent_amount
    FROM public.talent_policies
    WHERE community_id = v_community_id 
      AND checklist_name = v_item_name
      AND is_bonus = true
      AND p_date >= bonus_start_date
      AND p_date <= bonus_end_date
      AND v_now <= claim_deadline
    ORDER BY created_at DESC
    LIMIT 1;

    -- 2. If no valid bonus policy is found, fallback to base policy
    IF v_talent_amount IS NULL THEN
      SELECT talent_amount INTO v_talent_amount
      FROM public.talent_policies
      WHERE community_id = v_community_id 
        AND checklist_name = v_item_name
        AND is_bonus = false
      LIMIT 1;
    END IF;

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
      WHERE checklist_record_id = v_record_id
        AND deleted_at IS NULL;

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
