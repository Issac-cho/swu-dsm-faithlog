-- ROLLBACK: 10가지 피드백 이전 상태로 되돌리는 스크립트

-- 1. 피드백 작업 중 생성했던 RLS 함수들 삭제
DROP FUNCTION IF EXISTS public.can_view_user_data(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_community_ids() CASCADE;

-- 2. 새롭게 추가되었던 보안 정책(RLS) 삭제 (기존 정책들은 남아있으므로 새로 추가한 것들만 지웁니다)
DROP POLICY IF EXISTS "Records viewable based on rules" ON public.checklist_records;
DROP POLICY IF EXISTS "Items viewable based on rules" ON public.checklist_items;
DROP POLICY IF EXISTS "Reflections viewable based on rules" ON public.weekly_reflections;

-- community_memberships 테이블의 피드백용 정책 삭제
DROP POLICY IF EXISTS "Users can view members of their community" ON public.community_memberships;
DROP POLICY IF EXISTS "Active members can update memberships" ON public.community_memberships;

-- 3. 이전에 실수로 지웠을 수도 있는 기본 정책 복구 (이미 존재하면 무시되도록 처리 불가하므로, 삭제 후 다시 생성)
DROP POLICY IF EXISTS "Memberships viewable by everyone" ON public.community_memberships;
CREATE POLICY "Memberships viewable by everyone" ON public.community_memberships
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update community_memberships" ON public.community_memberships;
CREATE POLICY "Admins can update community_memberships" ON public.community_memberships
FOR UPDATE USING (
  community_id IN (
    SELECT community_id FROM public.community_memberships WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. 새로 추가했던 컬럼들 삭제 (주의: 데이터 소실)
ALTER TABLE public.communities 
DROP COLUMN IF EXISTS join_code,
DROP COLUMN IF EXISTS privacy_policy;

ALTER TABLE public.community_memberships
DROP COLUMN IF EXISTS status;
