-- 1. checklist_items에서 SYSTEM 타입인 '전도'를 '적용'으로 변경
-- (단, 유니크 제약 조건 충돌 시 기존 '전도' 항목을 안전하게 삭제/무시하여 에러 방지)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT id 
    FROM public.checklist_items 
    WHERE type = 'SYSTEM' AND name = '전도'
  ) LOOP
    BEGIN
      UPDATE public.checklist_items
      SET name = '적용'
      WHERE id = r.id;
    EXCEPTION WHEN unique_violation THEN
      -- 이미 '적용' 항목이 존재할 경우 '전도' 항목은 불필요하므로 삭제
      DELETE FROM public.checklist_items WHERE id = r.id;
    END;
  END LOOP;
  
  -- 2. talent_policies에서 '전도'를 '적용'으로 변경
  FOR r IN (
    SELECT id
    FROM public.talent_policies
    WHERE checklist_name = '전도'
  ) LOOP
    BEGIN
      UPDATE public.talent_policies
      SET checklist_name = '적용'
      WHERE id = r.id;
    EXCEPTION WHEN unique_violation THEN
      -- 이미 '적용' 정책이 존재할 경우 '전도' 정책은 불필요하므로 삭제
      DELETE FROM public.talent_policies WHERE id = r.id;
    END;
  END LOOP;
END $$;
