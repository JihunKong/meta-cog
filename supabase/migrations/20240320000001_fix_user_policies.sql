-- Drop existing policies
drop policy if exists "서비스 롤 전체 권한" on "User";
drop policy if exists "사용자 자신의 데이터 읽기" on "User";
drop policy if exists "회원가입 허용" on "User";

-- Service role has full access
create policy "서비스 롤 전체 권한"
on "User"
for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- Allow new user registration
create policy "회원가입 허용"
on "User"
for insert
with check (true);

-- Authenticated users can read and update their own data
create policy "사용자 자신의 데이터 읽기 및 수정"
on "User"
for all
using (auth.uid() = id)
with check (auth.uid() = id); 