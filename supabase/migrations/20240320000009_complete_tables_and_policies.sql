-- 기존 테이블 삭제 (CASCADE 옵션으로 의존성 함께 삭제)
DROP TABLE IF EXISTS "StudyPlan" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Curriculum" CASCADE;
DROP TABLE IF EXISTS "CurriculumProgress" CASCADE;
DROP TABLE IF EXISTS "AIRecommendation" CASCADE;

-- User 테이블 생성
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT,
  "name" TEXT,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'STUDENT',
  "student_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "user_email_idx" ON "User" ("email");

-- Account 테이블 생성
CREATE TABLE "Account" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" BIGINT,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("provider", "providerAccountId")
);

-- Session 테이블 생성
CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- VerificationToken 테이블 생성
CREATE TABLE "VerificationToken" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL,
  
  UNIQUE("identifier", "token")
);

-- StudyPlan 테이블 생성
CREATE TABLE "StudyPlan" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "target" REAL NOT NULL DEFAULT 100,
  "achievement" REAL NOT NULL DEFAULT 0,
  "date" TIMESTAMPTZ NOT NULL,
  "time_slot" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "study_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Curriculum 테이블 생성
CREATE TABLE "Curriculum" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  "subject" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "order" INT NOT NULL,
  "createdBy" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "curriculum_created_by_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- CurriculumProgress 테이블 생성
CREATE TABLE "CurriculumProgress" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "curriculumId" UUID NOT NULL,
  "progress" INT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "curriculum_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "curriculum_progress_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE,
  UNIQUE("userId", "curriculumId")
);

-- AIRecommendation 테이블 생성
CREATE TABLE "AIRecommendation" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "ai_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX "study_plan_user_id_idx" ON "StudyPlan" ("user_id");
CREATE INDEX "study_plan_date_idx" ON "StudyPlan" ("date");
CREATE INDEX "curriculum_created_by_idx" ON "Curriculum" ("createdBy");
CREATE INDEX "curriculum_progress_user_id_idx" ON "CurriculumProgress" ("userId");
CREATE INDEX "curriculum_progress_curriculum_id_idx" ON "CurriculumProgress" ("curriculumId");
CREATE INDEX "ai_recommendation_user_id_idx" ON "AIRecommendation" ("userId");

-- RLS 활성화
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY; 
ALTER TABLE "StudyPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Curriculum" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurriculumProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIRecommendation" ENABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "관리자 전체 권한" ON "User";
DROP POLICY IF EXISTS "사용자 자신의 데이터 읽기" ON "User";
DROP POLICY IF EXISTS "서비스 롤 전체 권한" ON "User";
DROP POLICY IF EXISTS "서비스 롤 전체 권한" ON "StudyPlan";
DROP POLICY IF EXISTS "학생 자신의 데이터 관리" ON "StudyPlan";
DROP POLICY IF EXISTS "교사 학생 데이터 조회" ON "StudyPlan";
DROP POLICY IF EXISTS "관리자 전체 권한" ON "StudyPlan";

-- User 테이블 정책
-- 1. 서비스 롤 전체 권한
CREATE POLICY "서비스_롤_전체_권한"
ON "User"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. 사용자 자신의 데이터 관리
CREATE POLICY "사용자_자신의_데이터_관리"
ON "User"
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. 익명 사용자 가입 허용
CREATE POLICY "익명_사용자_가입_허용"
ON "User"
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. 관리자 모든 사용자 관리 권한
CREATE POLICY "관리자_전체_권한"
ON "User"
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

-- 5. 교사 학생 조회 권한
CREATE POLICY "교사_학생_조회_권한"
ON "User"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'TEACHER'
  )
);

-- StudyPlan 테이블 정책
-- 1. 서비스 롤 전체 권한
CREATE POLICY "서비스_롤_전체_권한"
ON "StudyPlan"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. 학생 자신의 데이터 관리
CREATE POLICY "학생_자신의_데이터_관리"
ON "StudyPlan"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. 교사 학생 데이터 조회
CREATE POLICY "교사_학생_데이터_조회"
ON "StudyPlan"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'TEACHER'
  )
);

-- 4. 관리자 전체 권한
CREATE POLICY "관리자_전체_권한"
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

-- Account, Session, VerificationToken 테이블 정책
-- 서비스 롤만 접근 가능
CREATE POLICY "서비스_롤_전체_권한" ON "Account" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "Session" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "VerificationToken" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Curriculum 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "Curriculum" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "관리자_교사_전체_권한" ON "Curriculum" FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND (role = 'ADMIN' OR role = 'TEACHER')
  )
);
CREATE POLICY "학생_조회_권한" ON "Curriculum" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND role = 'STUDENT'
  )
);

-- CurriculumProgress 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "CurriculumProgress" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "학생_자신의_진도_관리" ON "CurriculumProgress" FOR ALL USING (auth.uid() = "userId");
CREATE POLICY "관리자_교사_전체_권한" ON "CurriculumProgress" FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND (role = 'ADMIN' OR role = 'TEACHER')
  )
);

-- AIRecommendation 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "AIRecommendation" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "학생_자신의_추천_관리" ON "AIRecommendation" FOR ALL USING (auth.uid() = "userId");
CREATE POLICY "관리자_교사_전체_권한" ON "AIRecommendation" FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()
    AND (role = 'ADMIN' OR role = 'TEACHER')
  )
); 