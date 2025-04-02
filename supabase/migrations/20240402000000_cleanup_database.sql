-- 데이터베이스 테이블 정리 스크립트
-- 중복된 테이블을 제거하고 일관된 명명 규칙 적용

-- PascalCase 버전 테이블 (기존 테이블 사용 안 함)
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "curriculum" CASCADE;
DROP TABLE IF EXISTS "curriculum_progress" CASCADE;
DROP TABLE IF EXISTS "study_plans" CASCADE;
DROP TABLE IF EXISTS "ai_recommendations" CASCADE;

-- snake_case 버전 테이블 사용 (현재 optimized_schema.sql에 정의된 테이블)
-- 이미 존재하는 테이블이 없을 경우를 대비
-- 테이블 존재 확인 (임시 테이블 사용해서 확인)
CREATE OR REPLACE FUNCTION temp_check_tables() RETURNS void AS $$
DECLARE
  user_exists BOOLEAN;
  account_exists BOOLEAN;
  session_exists BOOLEAN;
  verification_token_exists BOOLEAN;
  study_plan_exists BOOLEAN;
  curriculum_exists BOOLEAN;
  curriculum_progress_exists BOOLEAN;
  ai_recommendation_exists BOOLEAN;
BEGIN
  -- 테이블 존재 확인
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') INTO user_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Account') INTO account_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Session') INTO session_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'VerificationToken') INTO verification_token_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'StudyPlan') INTO study_plan_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Curriculum') INTO curriculum_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CurriculumProgress') INTO curriculum_progress_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'AIRecommendation') INTO ai_recommendation_exists;

  -- 디버그 메시지 출력
  RAISE NOTICE '테이블 존재 확인: User %, Account %, Session %, VerificationToken %, StudyPlan %, Curriculum %, CurriculumProgress %, AIRecommendation %',
    user_exists, account_exists, session_exists, verification_token_exists, 
    study_plan_exists, curriculum_exists, curriculum_progress_exists, ai_recommendation_exists;
END;
$$ LANGUAGE plpgsql;

-- 함수 실행 (테이블 확인 용도)
SELECT temp_check_tables();

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS temp_check_tables();

-- 기존 optimized_schema.sql에서 가져온 테이블 스키마 (필요시 재생성)
-- uuid 확장 사용 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 테이블이 없는 경우에만 생성하는 함수 작성
DO $$ 
BEGIN
  -- User 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
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
    RAISE NOTICE 'User 테이블이 생성되었습니다.';
  END IF;

  -- Account 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Account') THEN
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
    RAISE NOTICE 'Account 테이블이 생성되었습니다.';
  END IF;

  -- Session 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Session') THEN
    CREATE TABLE "Session" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "session_token" TEXT UNIQUE NOT NULL,
      "expires" TIMESTAMPTZ NOT NULL
    );
    RAISE NOTICE 'Session 테이블이 생성되었습니다.';
  END IF;

  -- VerificationToken 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'VerificationToken') THEN
    CREATE TABLE "VerificationToken" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" TIMESTAMPTZ NOT NULL,
      UNIQUE("identifier", "token")
    );
    RAISE NOTICE 'VerificationToken 테이블이 생성되었습니다.';
  END IF;

  -- StudyPlan 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'StudyPlan') THEN
    CREATE TABLE "StudyPlan" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, 
      "subject" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "target" INTEGER NOT NULL DEFAULT 100, -- 목표 달성률 (백분율)
      "achievement" INTEGER NOT NULL DEFAULT 0, -- 실제 달성률 (백분율)
      "date" DATE NOT NULL, -- 날짜만 저장 (시간대 제외)
      "time_slot" TEXT NOT NULL, -- 시간대 값 (예: "19-20:15")
      "reflection" TEXT, -- 학습 회고 필드 추가
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'StudyPlan 테이블이 생성되었습니다.';
  ELSE
    -- reflection 컬럼이 없으면 추가 (Prisma 스키마와 일치시키기 위함)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'StudyPlan' AND column_name = 'reflection'
    ) THEN
      ALTER TABLE "StudyPlan" ADD COLUMN "reflection" TEXT;
      RAISE NOTICE 'StudyPlan 테이블에 reflection 컬럼이 추가되었습니다.';
    END IF;
  END IF;

  -- Curriculum 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Curriculum') THEN
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
    RAISE NOTICE 'Curriculum 테이블이 생성되었습니다.';
  END IF;

  -- CurriculumProgress 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CurriculumProgress') THEN
    CREATE TABLE "CurriculumProgress" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "curriculum_id" UUID NOT NULL REFERENCES "Curriculum"("id") ON DELETE CASCADE,
      "progress" INTEGER NOT NULL DEFAULT 0, -- 진도율 (백분율)
      "last_updated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE("user_id", "curriculum_id")
    );
    RAISE NOTICE 'CurriculumProgress 테이블이 생성되었습니다.';
  END IF;

  -- AIRecommendation 테이블 확인 및 생성
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'AIRecommendation') THEN
    CREATE TABLE "AIRecommendation" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subject" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL, -- 'STRATEGY', 'SCHEDULE', 'SUBJECT', 'UNIT'
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'AIRecommendation 테이블이 생성되었습니다.';
  END IF;
END $$;

-- 인덱스 확인 및 생성
DO $$ 
BEGIN
  -- Account 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_account_user_id') THEN
    CREATE INDEX "idx_account_user_id" ON "Account"("user_id");
  END IF;
  
  -- Session 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_user_id') THEN
    CREATE INDEX "idx_session_user_id" ON "Session"("user_id");
  END IF;
  
  -- StudyPlan 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_studyplan_user_id') THEN
    CREATE INDEX "idx_studyplan_user_id" ON "StudyPlan"("user_id");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_studyplan_date') THEN
    CREATE INDEX "idx_studyplan_date" ON "StudyPlan"("date");
  END IF;
  
  -- Curriculum 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_curriculum_created_by') THEN
    CREATE INDEX "idx_curriculum_created_by" ON "Curriculum"("created_by");
  END IF;
  
  -- CurriculumProgress 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_curriculum_progress_user_id') THEN
    CREATE INDEX "idx_curriculum_progress_user_id" ON "CurriculumProgress"("user_id");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_curriculum_progress_curriculum_id') THEN
    CREATE INDEX "idx_curriculum_progress_curriculum_id" ON "CurriculumProgress"("curriculum_id");
  END IF;
  
  -- AIRecommendation 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_airecommendation_user_id') THEN
    CREATE INDEX "idx_airecommendation_user_id" ON "AIRecommendation"("user_id");
  END IF;
END $$;

-- RLS 활성화 확인
DO $$ 
BEGIN
  -- 모든 테이블에 RLS 활성화 (이미 활성화되어 있더라도 에러가 발생하지 않음)
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "StudyPlan" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "Curriculum" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "CurriculumProgress" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "AIRecommendation" ENABLE ROW LEVEL SECURITY;
END $$;

-- 기존 정책 정리 및 재생성
-- User 테이블 정책
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "User";
DROP POLICY IF EXISTS "사용자_본인_데이터_권한" ON "User";
DROP POLICY IF EXISTS "관리자_전체_권한" ON "User";
DROP POLICY IF EXISTS "교사_조회_권한" ON "User";

CREATE POLICY "서비스_롤_전체_권한" ON "User" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_데이터_권한" ON "User" FOR ALL USING (auth.uid() = id);
CREATE POLICY "관리자_전체_권한" ON "User" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "교사_조회_권한" ON "User" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'TEACHER')
);

-- Account/Session/VerificationToken 테이블 정책 (서비스 롤만 접근)
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Account";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Session";
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "VerificationToken";

CREATE POLICY "서비스_롤_전체_권한" ON "Account" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "Session" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "서비스_롤_전체_권한" ON "VerificationToken" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- StudyPlan 테이블 정책
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "StudyPlan";
DROP POLICY IF EXISTS "사용자_본인_학습계획_권한" ON "StudyPlan";
DROP POLICY IF EXISTS "관리자_전체_권한" ON "StudyPlan";
DROP POLICY IF EXISTS "교사_조회_권한" ON "StudyPlan";

CREATE POLICY "서비스_롤_전체_권한" ON "StudyPlan" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_학습계획_권한" ON "StudyPlan" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_전체_권한" ON "StudyPlan" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "교사_조회_권한" ON "StudyPlan" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'TEACHER')
);

-- Curriculum 테이블 정책
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "Curriculum";
DROP POLICY IF EXISTS "관리자_교사_권한" ON "Curriculum";
DROP POLICY IF EXISTS "학생_조회_권한" ON "Curriculum";

CREATE POLICY "서비스_롤_전체_권한" ON "Curriculum" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "관리자_교사_권한" ON "Curriculum" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
);
CREATE POLICY "학생_조회_권한" ON "Curriculum" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role = 'STUDENT')
);

-- CurriculumProgress 테이블 정책
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "CurriculumProgress";
DROP POLICY IF EXISTS "사용자_본인_진도_권한" ON "CurriculumProgress";
DROP POLICY IF EXISTS "관리자_교사_권한" ON "CurriculumProgress";

CREATE POLICY "서비스_롤_전체_권한" ON "CurriculumProgress" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_진도_권한" ON "CurriculumProgress" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_교사_권한" ON "CurriculumProgress" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
);

-- AIRecommendation 테이블 정책
DROP POLICY IF EXISTS "서비스_롤_전체_권한" ON "AIRecommendation";
DROP POLICY IF EXISTS "사용자_본인_추천_권한" ON "AIRecommendation";
DROP POLICY IF EXISTS "관리자_교사_권한" ON "AIRecommendation";

CREATE POLICY "서비스_롤_전체_권한" ON "AIRecommendation" FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "사용자_본인_추천_권한" ON "AIRecommendation" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "관리자_교사_권한" ON "AIRecommendation" FOR ALL USING (
  EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid() AND role IN ('ADMIN', 'TEACHER'))
);
