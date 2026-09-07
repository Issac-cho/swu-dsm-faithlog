-- profiles 테이블에 이모지 프로필 아이콘 저장용 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_icon text;
