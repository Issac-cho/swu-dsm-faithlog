-- 1. talent_policies의 is_bonus가 NULL인 기존 정책들을 false로 정상화
UPDATE public.talent_policies 
SET is_bonus = false 
WHERE is_bonus IS NULL;

-- 2. toggle_checklist_record 함수에서 is_bonus가 NULL인 경우도 기본 정책으로 정상 매칭되도록 보완
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

    -- 2. If no valid bonus policy is found, fallback to base policy (safely check NULL)
    IF v_talent_amount IS NULL THEN
      SELECT talent_amount INTO v_talent_amount
      FROM public.talent_policies
      WHERE community_id = v_community_id 
        AND checklist_name = v_item_name
        AND (is_bonus = false OR is_bonus IS NULL)
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

-- 3. 과거에 체크되었으나 달란트 트랜잭션이 누락된 기록들에 대해 달란트 소급 지급(동기화)
INSERT INTO public.talent_transactions (user_id, community_id, checklist_record_id, amount, reason)
SELECT 
  r.user_id,
  i.community_id,
  r.id as checklist_record_id,
  COALESCE(p.talent_amount, 10) as amount,
  'CHECKLIST_COMPLETED' as reason
FROM public.checklist_records r
JOIN public.checklist_items i ON r.checklist_item_id = i.id
LEFT JOIN public.talent_policies p 
  ON p.community_id = i.community_id 
 AND p.checklist_name = i.name 
 AND (p.is_bonus = false OR p.is_bonus IS NULL)
LEFT JOIN (
  SELECT checklist_record_id, SUM(amount) as current_sum
  FROM public.talent_transactions
  WHERE deleted_at IS NULL
  GROUP BY checklist_record_id
) t ON r.id = t.checklist_record_id
WHERE r.completed = true 
  AND i.type = 'SYSTEM'
  AND r.deleted_at IS NULL
  AND COALESCE(t.current_sum, 0) = 0;
