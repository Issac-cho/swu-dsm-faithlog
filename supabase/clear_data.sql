-- 초기화 스크립트: 모든 테스트 데이터를 삭제합니다.
-- 이 스크립트를 실행하면 생성된 모든 공동체, 셀, 체크리스트, 달란트, 가입 정보가 삭제됩니다.
-- (주의: auth.users 의 계정 정보 자체는 Supabase Authentication 탭에서 수동으로 삭제해야 완벽하게 지워집니다.)

-- 외래키(Foreign Key) 제약 조건으로 인해 자식 테이블부터 삭제하거나 CASCADE를 사용해야 하지만,
-- TRUNCATE CASCADE를 사용하면 연관된 모든 데이터를 한 번에 비울 수 있습니다.

TRUNCATE TABLE public.communities CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- (선택) 만약 위 방법 대신 하나씩 깔끔하게 비우고 싶다면 아래 주석을 풀고 실행하세요.
-- DELETE FROM public.talent_transactions;
-- DELETE FROM public.checklist_records;
-- DELETE FROM public.weekly_reflections;
-- DELETE FROM public.checklist_items;
-- DELETE FROM public.shepherd_relationships;
-- DELETE FROM public.community_memberships;
-- DELETE FROM public.cells;
-- DELETE FROM public.communities;
-- DELETE FROM public.profiles;
