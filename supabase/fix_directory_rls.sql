-- 1. 멤버십 목록 누구나 조회 가능하도록 설정
DROP POLICY IF EXISTS "Memberships viewable by everyone" ON public.community_memberships;
DROP POLICY IF EXISTS "Memberships viewable by community members." ON public.community_memberships;
CREATE POLICY "Memberships viewable by everyone" ON public.community_memberships FOR SELECT USING (true);

-- 2. 프로필 누구나 조회 가능하도록 설정
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

-- 3. 셀 정보 누구나 조회 가능하도록 설정
DROP POLICY IF EXISTS "Cells are viewable by community members." ON public.cells;
CREATE POLICY "Cells are viewable by everyone" ON public.cells FOR SELECT USING (true);
