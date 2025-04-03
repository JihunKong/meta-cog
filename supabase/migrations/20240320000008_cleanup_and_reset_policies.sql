-- 테이블에 있는 모든 정책 확인 후 삭제
DROP POLICY IF EXISTS "service_role_all" ON public."User";
DROP POLICY IF EXISTS "anon_insert" ON public."User";
DROP POLICY IF EXISTS "users_select_own" ON public."User";
DROP POLICY IF EXISTS "service_role_can_manage_all_users" ON public."User";
DROP POLICY IF EXISTS "Users can view their own data" ON public."User";
DROP POLICY IF EXISTS "Service role can manage all users" ON public."User";
DROP POLICY IF EXISTS "Admins can view all users" ON public."User";
DROP POLICY IF EXISTS "Admins can update all users" ON public."User";
DROP POLICY IF EXISTS "Teachers can view student data" ON public."User";

-- 필요한 정책만 다시 추가
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 서비스 역할에 모든 권한 부여
CREATE POLICY "service_role_can_do_all" ON public."User" 
FOR ALL 
TO service_role 
USING (true);

-- 익명 사용자도 User 테이블에 INSERT 가능하도록 설정
CREATE POLICY "anon_can_insert" ON public."User" 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 인증된 사용자도 INSERT 가능하도록 (관리자 기능)
CREATE POLICY "auth_can_insert" ON public."User" 
FOR INSERT 
TO authenticated 
WITH CHECK (true); 