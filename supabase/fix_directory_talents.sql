-- 1. Function to aggregate talent totals per community member for admins/sub_admins
CREATE OR REPLACE FUNCTION public.get_community_member_talent_totals(p_community_id uuid)
RETURNS TABLE (user_id uuid, total_talent bigint) AS $$
BEGIN
  -- Verify the caller is an admin, sub_admin, or system operator (use explicit table aliases to avoid ambiguity)
  IF NOT EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.user_id = auth.uid() 
      AND cm.community_id = p_community_id 
      AND cm.role IN ('admin', 'sub_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.system_operators so WHERE so.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY
  SELECT 
    m.user_id,
    COALESCE(SUM(t.amount), 0)::bigint as total_talent
  FROM public.community_memberships m
  LEFT JOIN public.talent_transactions t 
    ON m.user_id = t.user_id 
   AND t.community_id = p_community_id 
   AND t.deleted_at IS NULL
  WHERE m.community_id = p_community_id
  GROUP BY m.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure sub_admins also have permission to view members' data in RLS
CREATE OR REPLACE FUNCTION public.is_admin_of_community_for_user(viewer_id uuid, target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.community_memberships target_m
    JOIN public.community_memberships viewer_m ON target_m.community_id = viewer_m.community_id
    WHERE target_m.user_id = target_user_id 
      AND viewer_m.user_id = viewer_id
      AND viewer_m.role IN ('admin', 'sub_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
