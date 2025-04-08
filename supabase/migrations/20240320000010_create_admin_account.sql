-- 기본 관리자 계정 생성
INSERT INTO "User" (
  "id", 
  "email", 
  "name", 
  "role", 
  "created_at", 
  "updated_at"
)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'admin@metacog.kr', 
  '관리자', 
  'ADMIN', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 참고: 실제 로그인을 위해서는 Supabase Auth에도 동일한 계정이 필요합니다.
-- Supabase Studio의 Authentication 섹션에서 관리자 계정 생성 또는
-- 아래 SQL을 실행하여 관리자 계정의 비밀번호를 설정해야 합니다:
-- 
-- SELECT supabase_admin.create_auth_user(
--  '00000000-0000-0000-0000-000000000000',
--  'admin@pof.com', 
--  'admin1234',
--  'admin@metacog.kr',
--  '관리자'
-- ); 