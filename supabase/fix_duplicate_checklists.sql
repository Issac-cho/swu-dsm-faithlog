-- 1. 중복된 SYSTEM 체크리스트 항목들의 기록을 병합하고 중복 항목 삭제
DO $$
DECLARE
    r RECORD;
    primary_id uuid;
    dup_id uuid;
BEGIN
    FOR r IN (
        SELECT user_id, community_id, name, array_agg(id ORDER BY created_at ASC) as item_ids
        FROM public.checklist_items
        WHERE type = 'SYSTEM'
        GROUP BY user_id, community_id, name
        HAVING COUNT(*) > 1
    ) LOOP
        -- 첫 번째(가장 오래된) 아이템을 원본으로 유지
        primary_id := r.item_ids[1];
        
        FOR i IN 2..array_length(r.item_ids, 1) LOOP
            dup_id := r.item_ids[i];
            
            -- 만약 중복 항목에 '체크 완료'된 기록이 있다면, 원본 항목의 기록도 '체크 완료'로 업데이트
            UPDATE public.checklist_records cr1
            SET completed = true
            WHERE checklist_item_id = primary_id
              AND completed = false
              AND EXISTS (
                  SELECT 1 FROM public.checklist_records cr2
                  WHERE cr2.checklist_item_id = dup_id
                    AND cr2.record_date = cr1.record_date
                    AND cr2.completed = true
              );
              
            -- 원본 항목에 없는 날짜의 기록들은 전부 원본 항목으로 복사
            INSERT INTO public.checklist_records (user_id, checklist_item_id, record_date, completed, created_at, updated_at)
            SELECT user_id, primary_id, record_date, completed, created_at, updated_at
            FROM public.checklist_records
            WHERE checklist_item_id = dup_id
            ON CONFLICT (user_id, checklist_item_id, record_date) DO NOTHING;
            
            -- 중복 항목 삭제 (연결된 불필요한 기록들도 CASCADE로 삭제됨)
            DELETE FROM public.checklist_items WHERE id = dup_id;
        END LOOP;
    END LOOP;
END $$;

-- 2. 앞으로 같은 유저, 공동체, 이름의 SYSTEM 체크리스트가 중복 생성되지 않도록 DB 레벨 제약 조건(부분 인덱스) 추가
DROP INDEX IF EXISTS unique_system_checklist_items;
CREATE UNIQUE INDEX unique_system_checklist_items ON public.checklist_items (user_id, community_id, name) WHERE type = 'SYSTEM';

-- 3. 유저 가입 시 실행되는 트리거 함수 수정 (중복 생성 시도 시 무시 - ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.handle_new_community_member()
RETURNS trigger AS $$
BEGIN
  -- Insert the 4 basic SYSTEM items
  INSERT INTO public.checklist_items (user_id, community_id, name, type, sort_order)
  VALUES 
    (new.user_id, new.community_id, '통독', 'SYSTEM', 1),
    (new.user_id, new.community_id, '기도', 'SYSTEM', 2),
    (new.user_id, new.community_id, '큐티', 'SYSTEM', 3),
    (new.user_id, new.community_id, '적용', 'SYSTEM', 4)
  ON CONFLICT (user_id, community_id, name) WHERE type = 'SYSTEM' DO NOTHING;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
