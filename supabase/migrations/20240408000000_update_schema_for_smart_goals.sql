-- SMART 목표와 학습 세션 관리를 위한 스키마 업데이트

-- SMART 목표 테이블 생성
CREATE TABLE IF NOT EXISTS "smart_goal" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "specific" TEXT NOT NULL, -- 구체적인 목표
  "measurable" TEXT NOT NULL, -- 측정 가능한 지표
  "achievable" TEXT NOT NULL, -- 달성 가능한 목표
  "relevant" TEXT NOT NULL, -- 관련성
  "time_bound" TEXT NOT NULL, -- 시간 제한
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 학습 세션 테이블 생성
CREATE TABLE IF NOT EXISTS "study_session" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "smart_goal_id" UUID NOT NULL REFERENCES "smart_goal"("id") ON DELETE CASCADE,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ,
  "achievement_rate" INTEGER, -- 달성도 (백분율)
  "reflection" TEXT, -- 학습 반성
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI 피드백 테이블 생성
CREATE TABLE IF NOT EXISTS "ai_feedback" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "study_session_id" UUID NOT NULL REFERENCES "study_session"("id") ON DELETE CASCADE,
  "feedback_type" TEXT NOT NULL, -- 'ANALYSIS', 'ENCOURAGEMENT', 'RECOMMENDATION'
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_smart_goal_user_id" ON "smart_goal"("user_id");
CREATE INDEX IF NOT EXISTS "idx_study_session_user_id" ON "study_session"("user_id");
CREATE INDEX IF NOT EXISTS "idx_study_session_smart_goal_id" ON "study_session"("smart_goal_id");
CREATE INDEX IF NOT EXISTS "idx_ai_feedback_user_id" ON "ai_feedback"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_feedback_study_session_id" ON "ai_feedback"("study_session_id");

-- RLS 정책 설정
ALTER TABLE "smart_goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_feedback" ENABLE ROW LEVEL SECURITY;

-- SMART 목표 정책
CREATE POLICY "smart_goal_user_policy" ON "smart_goal"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "smart_goal_teacher_policy" ON "smart_goal"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid() AND role = 'TEACHER'
    )
  );

-- 학습 세션 정책
CREATE POLICY "study_session_user_policy" ON "study_session"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "study_session_teacher_policy" ON "study_session"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid() AND role = 'TEACHER'
    )
  );

-- AI 피드백 정책
CREATE POLICY "ai_feedback_user_policy" ON "ai_feedback"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ai_feedback_teacher_policy" ON "ai_feedback"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid() AND role = 'TEACHER'
    )
  ); 