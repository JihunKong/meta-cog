-- 이전 테이블 삭제 (주의: 데이터가 모두 삭제됩니다!)
DROP TABLE IF EXISTS goal_progress CASCADE;
DROP TABLE IF EXISTS goal_sessions CASCADE;
DROP TABLE IF EXISTS smart_goals CASCADE;

-- 새로운 smart_goals 테이블 생성
-- 학생 학습 목표 정보 저장
CREATE TABLE IF NOT EXISTS smart_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,                   -- 과목명 (국어, 영어, 수학 등)
  description TEXT NOT NULL,               -- 목표 설명
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학습 세션 진행도 테이블 (기존 goal_sessions 대체)
-- 각 목표별 달성률과 반성문을 저장
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smart_goal_id UUID REFERENCES smart_goals(id) ON DELETE CASCADE,
  percent INTEGER DEFAULT 0,               -- 목표 달성률 (0-100)
  reflection TEXT DEFAULT '',              -- 학습 반성문
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 권한 설정 (RLS) - smart_goals 테이블
ALTER TABLE smart_goals ENABLE ROW LEVEL SECURITY;

-- 권한 설정 (RLS) - goal_progress 테이블
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;

-- smart_goals 테이블 정책
-- 관리자는 모든 작업 가능
CREATE POLICY "관리자 전체 권한" ON smart_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 교사는 모든 목표 읽기 가능
CREATE POLICY "교사 읽기 권한" ON smart_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

-- 학생은 자신의 목표만 CRUD 가능
CREATE POLICY "학생 본인 목표 관리 권한" ON smart_goals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- goal_progress 테이블 정책
-- 관리자는 모든 작업 가능
CREATE POLICY "관리자 전체 권한" ON goal_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 교사는 모든 진행도 읽기 가능
CREATE POLICY "교사 읽기 권한" ON goal_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

-- 학생은 자신의 목표에 대한 진행도만 CRUD 가능
CREATE POLICY "학생 본인 진행도 관리 권한" ON goal_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM smart_goals
      WHERE smart_goals.id = goal_progress.smart_goal_id
      AND smart_goals.user_id = auth.uid()
    )
  );

-- 인덱스 생성으로 성능 향상
CREATE INDEX idx_smart_goals_user_id ON smart_goals(user_id);
CREATE INDEX idx_goal_progress_smart_goal_id ON goal_progress(smart_goal_id);
