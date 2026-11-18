BEGIN;

ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS talent_start_date date;

-- Save the Korean calendar date and clear the ledger in the same transaction.
CREATE OR REPLACE FUNCTION public.reset_community_talents(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.is_operator(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.community_memberships AS m
      WHERE m.community_id = p_community_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'sub_admin')
    )
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.';
  END IF;

  UPDATE public.communities
  SET talent_start_date = (clock_timestamp() AT TIME ZONE 'Asia/Seoul')::date
  WHERE id = p_community_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '공동체를 찾을 수 없습니다.';
  END IF;

  DELETE FROM public.talent_transactions WHERE community_id = p_community_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_community_talents(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_community_talents(uuid) TO authenticated;

DROP POLICY IF EXISTS "Community admins can delete cells" ON public.cells;
CREATE POLICY "Community admins can delete cells"
ON public.cells FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships AS m
    WHERE m.community_id = cells.community_id
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('admin', 'sub_admin')
  )
);

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
  v_talent_start_date date;
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

  SELECT talent_start_date INTO v_talent_start_date
  FROM public.communities WHERE id = v_community_id FOR SHARE;

  -- Upsert record
  INSERT INTO public.checklist_records (user_id, checklist_item_id, record_date, completed, updated_at)
  VALUES (v_user_id, p_item_id, p_date, p_completed, v_now)
  ON CONFLICT (user_id, checklist_item_id, record_date)
  DO UPDATE SET completed = EXCLUDED.completed, updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_record_id;

  -- Handle talent transaction if SYSTEM item
  IF v_item_type = 'SYSTEM' AND (v_talent_start_date IS NULL OR p_date >= v_talent_start_date) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
