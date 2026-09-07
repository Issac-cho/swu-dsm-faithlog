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
