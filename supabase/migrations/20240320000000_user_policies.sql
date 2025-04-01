-- Enable RLS
alter table "User" enable row level security;

-- Drop existing policies if they exist
drop policy if exists "관리자 전체 권한" on "User";
drop policy if exists "사용자 자신의 데이터 읽기" on "User";
drop policy if exists "서비스 롤 전체 권한" on "User";

-- Service role has full access
create policy "서비스 롤 전체 권한"
on "User"
for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can read their own data
create policy "사용자 자신의 데이터 읽기"
on "User"
for select
using (auth.uid() = id); 