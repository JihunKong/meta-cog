-- StudyPlan 테이블 초기화 및 재생성
DROP TABLE IF EXISTS "StudyPlan";

-- StudyPlan 테이블 생성
CREATE TABLE "StudyPlan" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "target" REAL NOT NULL DEFAULT 100,
  "achievement" REAL NOT NULL DEFAULT 0,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "time_slot" TEXT NOT NULL,
  "reflection" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY ("id"),
  CONSTRAINT "StudyPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX "StudyPlan_user_id_idx" ON "StudyPlan" ("user_id");
CREATE INDEX "StudyPlan_date_idx" ON "StudyPlan" ("date");

-- RLS 정책 설정
ALTER TABLE "StudyPlan" ENABLE ROW LEVEL SECURITY;

-- 정책 초기화 (기존 정책이 있다면)
DROP POLICY IF EXISTS "서비스 롤 전체 권한" ON "StudyPlan";
DROP POLICY IF EXISTS "학생 자신의 데이터 관리" ON "StudyPlan";
DROP POLICY IF EXISTS "교사 학생 데이터 조회" ON "StudyPlan";
DROP POLICY IF EXISTS "관리자 전체 권한" ON "StudyPlan";

-- 정책 생성
-- 1. 서비스 롤(관리자 API)은 전체 접근 권한
CREATE POLICY "서비스 롤 전체 권한"
ON "StudyPlan"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. 학생은 자신의 데이터만 관리 가능
CREATE POLICY "학생 자신의 데이터 관리"
ON "StudyPlan"
FOR ALL
USING (auth.uid() = "user_id")
WITH CHECK (auth.uid() = "user_id");

-- 3. 교사는 모든 학생 데이터 조회 가능
CREATE POLICY "교사 학생 데이터 조회"
ON "StudyPlan"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'TEACHER'
  )
);

-- 4. 관리자는 모든 데이터에 접근 가능
CREATE POLICY "관리자 전체 권한"
ON "StudyPlan"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
); 