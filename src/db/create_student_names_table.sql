-- student_names 테이블 생성
-- 학생 이메일과 이름을 매핑하는 테이블입니다.
CREATE TABLE IF NOT EXISTS student_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  grade VARCHAR(10),  -- 학년 (예: '1학년', '2학년' 등)
  class VARCHAR(10),  -- 반 (예: '1반', '2반' 등)
  student_number VARCHAR(10),  -- 학번
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 학생 데이터 초기 삽입
INSERT INTO student_names (email, display_name, grade, class, student_number)
VALUES 
  ('2201@pof.com', '김서윤', '2학년', '2반', '01'),
  ('2202@pof.com', '이민준', '2학년', '2반', '02'),
  ('2203@pof.com', '박지은', '2학년', '2반', '03'),
  ('2204@pof.com', '정현우', '2학년', '2반', '04'),
  ('2205@pof.com', '최수아', '2학년', '2반', '05')
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    grade = EXCLUDED.grade,
    class = EXCLUDED.class,
    student_number = EXCLUDED.student_number,
    updated_at = NOW();

-- 권한 설정 (RLS)
ALTER TABLE student_names ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 작업 가능
CREATE POLICY "관리자 전체 권한" ON student_names
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 교사는 읽기 가능
CREATE POLICY "교사 읽기 권한" ON student_names
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

-- 학생은 자신의 정보만 읽기 가능
CREATE POLICY "학생 본인 정보 읽기 권한" ON student_names
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'student' AND profiles.email = student_names.email
    )
  );
