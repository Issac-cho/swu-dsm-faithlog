CREATE OR REPLACE FUNCTION public.handle_community_leave()
RETURNS trigger AS $$
BEGIN
  -- 사용자가 공동체를 떠날 때(멤버십 삭제), 해당 유저와 연결된 모든 목자/양 관계도 함께 삭제합니다.
  DELETE FROM public.shepherd_relationships
  WHERE shepherd_id = OLD.user_id OR sheep_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만약 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_membership_deleted ON public.community_memberships;

-- 삭제 이벤트 발생 시 자동으로 트리거 실행
CREATE TRIGGER on_membership_deleted
  AFTER DELETE ON public.community_memberships
  FOR EACH ROW EXECUTE PROCEDURE public.handle_community_leave();
