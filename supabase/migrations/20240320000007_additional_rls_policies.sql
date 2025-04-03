-- 관리자는 모든 작업 허용
create policy "관리자 전체 권한"
on "User"
for all
to authenticated
using (auth.jwt() ->> 'role' = 'service_role' or (auth.jwt() ->> 'role' = 'authenticated' and exists (
  select 1 from "User" where id = auth.uid() and role = 'ADMIN'
)));

-- 사용자는 자신의 데이터만 읽기 가능
create policy "사용자 자신의 데이터 읽기"
on "User"
for select
to authenticated
using (auth.uid() = id); 