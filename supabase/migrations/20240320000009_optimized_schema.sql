-- 모든 기존 테이블 삭제 (의존성 포함)
DROP TABLE IF EXISTS "StudyPlan" CASCADE;
DROP TABLE IF EXISTS "AIRecommendation" CASCADE;
DROP TABLE IF EXISTS "CurriculumProgress" CASCADE;
DROP TABLE IF EXISTS "Curriculum" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- uuid 확장 사용 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 정보 테이블
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'TEACHER', 'ADMIN'
  "student_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 계정 연결 정보 테이블 (OAuth)
CREATE TABLE "Account" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" BIGINT,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("provider", "provider_id")
);

-- 세션 정보 테이블
CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "session_token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL
);

-- 토큰 검증 테이블
CREATE TABLE "VerificationToken" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL,
  UNIQUE("identifier", "token")
);

-- 학습 계획 테이블 (최적화)
CREATE TABLE "StudyPlan" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, 
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "target" INTEGER NOT NULL DEFAULT 100, -- 목표 달성률 (백분율)
  "achievement" INTEGER NOT NULL DEFAULT 0, -- 실제 달성률 (백분율)
  "date" DATE NOT NULL, -- 날짜만 저장 (시간대 제외)
  "time_slot" TEXT NOT NULL, -- 시간대 값 (예: "19-20:15")
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커리큘럼 테이블
CREATE TABLE "Curriculum" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "subject" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "order" INTEGER NOT NULL, -- 순서 (정수)
  "created_by" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커리큘럼 진도 테이블
CREATE TABLE "CurriculumProgress" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "curriculum_id" UUID NOT NULL REFERENCES "Curriculum"("id") ON DELETE CASCADE,
  "progress" INTEGER NOT NULL DEFAULT 0, -- 진도율 (백분율)
  "last_updated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "curriculum_id")
);

-- AI 추천 테이블
CREATE TABLE "AIRecommendation" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'STRATEGY', 'SCHEDULE', 'SUBJECT', 'UNIT'
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX "idx_account_user_id" ON "Account"("user_id");
CREATE INDEX "idx_session_user_id" ON "Session"("user_id");
CREATE INDEX "idx_studyplan_user_id" ON "StudyPlan"("user_id");
CREATE INDEX "idx_studyplan_date" ON "StudyPlan"("date");
CREATE INDEX "idx_curriculum_created_by" ON "Curriculum"("created_by");
CREATE INDEX "idx_curriculum_progress_user_id" ON "CurriculumProgress"("user_id");
CREATE INDEX "idx_curriculum_progress_curriculum_id" ON "CurriculumProgress"("curriculum_id");
CREATE INDEX "idx_airecommendation_user_id" ON "AIRecommendation"("user_id");

-- RLS 활성화
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Curriculum" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurriculumProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIRecommendation" ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "User";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Account";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Session";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "VerificationToken";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "StudyPlan";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Curriculum";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "CurriculumProgress";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "AIRecommendation";

-- User 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "User" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_데이터_권한" ON "User" FOR ALL USING (auth.uid() = id);
CREATE POLICY "관리자_전체_권한" ON "User" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "교사_조회_권한" ON "User" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'TEACHER')
);

-- Account/Session/VerificationToken 테이블 정책 (서비스 롤만 접근)
CREATE POLICY "서비스_롤_전체_권한" ON "Account" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "Session" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "VerificationToken" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- StudyPlan 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "StudyPlan" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_학습계획_권한" ON "StudyPlan" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_전체_권한" ON "StudyPlan" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "교사_조회_권한" ON "StudyPlan" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'TEACHER')
);

-- Curriculum 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "Curriculum" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "관리자_교사_권한" ON "Curriculum" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
);
CREATE POLICY "학생_조회_권한" ON "Curriculum" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'STUDENT')
);

-- CurriculumProgress 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "CurriculumProgress" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_진도_권한" ON "CurriculumProgress" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_교사_권한" ON "CurriculumProgress" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
);

-- AIRecommendation 테이블 정책
CREATE POLICY "서비스_롤_전체_권한" ON "AIRecommendation" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_추천_권한" ON "AIRecommendation" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_교사_권한" ON "AIRecommendation" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
); 