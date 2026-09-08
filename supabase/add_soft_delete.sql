-- 1. Add deleted_at columns
ALTER TABLE public.checklist_items ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.checklist_records ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.talent_transactions ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE public.weekly_reflections ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. Update RPC function to ignore deleted talent_transactions
CREATE OR REPLACE FUNCTION public.get_cell_talent_totals(p_community_id uuid)
RETURNS TABLE (cell_id uuid, cell_name text, total_talent bigint) AS $$
BEGIN
  -- Verify the caller is in the community
  IF NOT EXISTS (
    SELECT 1 FROM public.community_memberships 
    WHERE user_id = auth.uid() AND community_id = p_community_id
  ) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY
  SELECT 
    c.id as cell_id,
    c.name as cell_name,
    COALESCE(SUM(t.amount), 0) as total_talent
  FROM public.cells c
  LEFT JOIN public.community_memberships m ON c.id = m.cell_id
  LEFT JOIN public.talent_transactions t ON m.user_id = t.user_id AND t.community_id = p_community_id AND t.deleted_at IS NULL
  WHERE c.community_id = p_community_id
  GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
