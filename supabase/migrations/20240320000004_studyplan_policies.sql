-- Enable RLS for StudyPlan table
alter table "StudyPlan" enable row level security;

-- Drop existing policies if they exist (안전을 위해)
drop policy if exists "서비스 롤 전체 권한" on "StudyPlan";
drop policy if exists "학생 자신의 데이터 관리" on "StudyPlan";
drop policy if exists "교사 학생 데이터 조회" on "StudyPlan";
drop policy if exists "관리자 전체 권한" on "StudyPlan";

-- 1. Service role has full access (for admin operations and API)
create policy "서비스 롤 전체 권한"
on "StudyPlan"
for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- 2. Students can manage (CRUD) their own study plans
create policy "학생 자신의 데이터 관리"
on "StudyPlan"
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. Teachers can read students' study plans
create policy "교사 학생 데이터 조회"
on "StudyPlan"
for select
using (
  -- 교사는 모든 학생의 학습 계획을 조회할 수 있음
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'TEACHER'
  )
);

-- 4. Admin has full access to all study plans
create policy "관리자 전체 권한"
on "StudyPlan"
for all
using (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
)
with check (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
); 