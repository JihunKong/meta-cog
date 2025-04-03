-- User 테이블에 대한 RLS 정책 재설정
drop policy if exists "관리자 전체 권한" on "User";
drop policy if exists "사용자 자신의 데이터 읽기" on "User";
drop policy if exists "서비스 롤 전체 권한" on "User";

-- 서비스 롤은 모든 작업 허용
create policy "서비스 롤 전체 권한"
on "User"
for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- 인증된 사용자는 자신의 데이터만 읽기 가능
create policy "사용자 자신의 데이터 읽기"
on "User"
for select
using (auth.uid() = id);

-- Enable RLS
alter table "User" enable row level security; 