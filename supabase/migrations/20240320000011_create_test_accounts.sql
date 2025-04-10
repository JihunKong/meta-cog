-- 테스트용 교사 계정 생성
INSERT INTO "User" (
  "id", 
  "email", 
  "name", 
  "role", 
  "created_at", 
  "updated_at"
)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  'teacher@metacog.kr', 
  '테스트 교사', 
  'TEACHER', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 테스트용 학생 계정 생성
INSERT INTO "User" (
  "id", 
  "email", 
  "name", 
  "role", 
  "student_id",
  "created_at", 
  "updated_at"
)
VALUES
(
  '22222222-2222-2222-2222-222222222222', 
  'student1@metacog.kr', 
  '테스트 학생1', 
  'STUDENT',
  'S12345',
  NOW(), 
  NOW()
),
(
  '33333333-3333-3333-3333-333333333333', 
  'student2@metacog.kr', 
  '테스트 학생2',
  'STUDENT',
  'S12346',
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 참고: Auth 계정도 생성 필요
-- SELECT supabase_admin.create_auth_user('11111111-1111-1111-1111-111111111111', 'teacher@metacog.kr', 'teacher123', 'teacher@metacog.kr', '테스트 교사');
-- SELECT supabase_admin.create_auth_user('22222222-2222-2222-2222-222222222222', 'student1@metacog.kr', 'student123', 'student1@metacog.kr', '테스트 학생1');
-- SELECT supabase_admin.create_auth_user('33333333-3333-3333-3333-333333333333', 'student2@metacog.kr', 'student123', 'student2@metacog.kr', '테스트 학생2'); 