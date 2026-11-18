BEGIN;

CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN (
    'page_view', 'check_complete', 'check_uncomplete', 'reading_memo_save',
    'application_memo_save', 'commitment_save', 'review_save', 'history_tab',
    'other_history_open', 'save_failed', 'delete_failed'
  )),
  page text NOT NULL CHECK (length(page) <= 160 AND page ~ '^/app(/[a-zA-Z0-9_:-]+)*$'),
  detail text NOT NULL DEFAULT '' CHECK (
    (name IN ('save_failed', 'delete_failed') AND detail IN (
      'toggleRecord', 'updateRecordMemo', 'deleteCustomItem', 'addCustomItem',
      'saveReflection', 'updateProfile', 'renameCell', 'deleteCell', 'createCell',
      'assignUserToCell', 'assignShepherd', 'removeShepherd', 'updateTalentPolicy',
      'updateCommunityPassword', 'removeMember', 'changeMemberRole',
      'resetCommunityTalents', 'createBonusPolicy', 'deleteBonusPolicy',
      'leaveCommunity', 'claimPerfectWeekBonus'
    )) OR
    (name = 'history_tab' AND detail IN ('weekly', 'monthly', 'yearly')) OR
    (name = 'other_history_open' AND detail IN ('cell', 'shepherd', 'directory')) OR
    (name NOT IN ('save_failed', 'delete_failed', 'history_tab', 'other_history_open') AND detail = '')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON public.usage_events(created_at);
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.usage_events FROM anon, authenticated;
GRANT INSERT (id, user_id, name, page, detail) ON public.usage_events TO authenticated;
GRANT SELECT ON public.usage_events TO authenticated;

CREATE POLICY "Users insert own usage events" ON public.usage_events
FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Only operators read usage events" ON public.usage_events
FOR SELECT TO authenticated USING (public.is_operator((SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.get_usage_summary(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_start timestamptz;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_operator(auth.uid()) THEN
    RAISE EXCEPTION '시스템 운영자 권한이 없습니다.';
  END IF;
  IF p_days NOT IN (7, 30, 90) THEN
    RAISE EXCEPTION 'Invalid period';
  END IF;
  v_start := (((now() AT TIME ZONE 'Asia/Seoul')::date - (p_days - 1))::timestamp AT TIME ZONE 'Asia/Seoul');

  WITH events AS MATERIALIZED (
    SELECT * FROM public.usage_events WHERE created_at >= v_start
  )
  SELECT jsonb_build_object(
    'visitors', (SELECT count(DISTINCT user_id) FROM events WHERE name = 'page_view'),
    'views', (SELECT count(*) FROM events WHERE name = 'page_view'),
    'failures', (SELECT count(*) FROM events WHERE name IN ('save_failed', 'delete_failed')),
    'pages', COALESCE((
      SELECT jsonb_agg(to_jsonb(p) ORDER BY p.visitors DESC, p.count DESC)
      FROM (
        SELECT page, count(*) AS count, count(DISTINCT user_id) AS visitors
        FROM events WHERE name = 'page_view' GROUP BY page
      ) p
    ), '[]'::jsonb),
    'actions', COALESCE((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.count DESC)
      FROM (
        SELECT name, detail, count(*) AS count, count(DISTINCT user_id) AS users
        FROM events WHERE name <> 'page_view' GROUP BY name, detail
      ) a
    ), '[]'::jsonb),
    'daily', COALESCE((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.day DESC)
      FROM (
        SELECT (created_at AT TIME ZONE 'Asia/Seoul')::date AS day,
          count(DISTINCT user_id) FILTER (WHERE name = 'page_view') AS visitors,
          count(*) FILTER (WHERE name = 'page_view') AS views,
          count(*) FILTER (WHERE name IN ('save_failed', 'delete_failed')) AS failures
        FROM events GROUP BY 1
      ) d
    ), '[]'::jsonb),
    'recent_failures', COALESCE((
      SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC)
      FROM (
        SELECT name, detail, page, created_at FROM events
        WHERE name IN ('save_failed', 'delete_failed')
        ORDER BY created_at DESC LIMIT 30
      ) f
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_usage_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_usage_summary(integer) TO authenticated;

COMMIT;
