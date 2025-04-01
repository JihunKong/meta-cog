-- Reset everything first
drop policy if exists "서비스 롤 전체 권한" on "User";
drop policy if exists "사용자 자신의 데이터 읽기" on "User";
drop policy if exists "회원가입 허용" on "User";
drop policy if exists "사용자 자신의 데이터 읽기 및 수정" on "User";
drop policy if exists "사용자 데이터 관리" on "User";

-- Enable RLS
alter table "User" enable row level security;

-- Create comprehensive policies
-- 1. Service role has full access (for admin operations)
create policy "서비스 롤 전체 권한"
on "User"
for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- 2. Allow self-registration
create policy "회원가입 허용"
on "User"
for insert
with check (
  -- Only allow STUDENT role for self-registration
  role = 'STUDENT'::text
);

-- 3. Users can read and update their own data
create policy "사용자 데이터 관리"
on "User"
for all
using (auth.uid() = id)
with check (auth.uid() = id); 