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

-- 관리자 계정에 대응하는 Auth 계정도 생성 (만약 Supabase Auth에서도 생성해야 한다면)
-- 아래 명령은 SQL에서 직접 실행 불가능하므로 서비스 계정을 통해 API로 수행해야 함
-- Admin 계정 생성 후 Supabase Studio에서 수동으로 비밀번호 설정 필요 