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
  ('2101@pof.com', '강지민', '2학년', '1반', '01'),
  ('2104@pof.com', '김소윤', '2학년', '1반', '04'),
  ('2106@pof.com', '김시온', '2학년', '1반', '06'),
  ('2201@pof.com', '김서윤', '2학년', '2반', '01'),
  ('2209@pof.com', '이시원', '2학년', '2반', '09'),
  ('2214@pof.com', '최성진', '2학년', '2반', '14'),
  ('2217@pof.com', '허나경', '2학년', '2반', '17'),
  ('2405@pof.com', '김유빈', '2학년', '4반', '05'),
  ('2602@pof.com', '김경훈', '2학년', '6반', '02'),
  ('2604@pof.com', '김서후', '2학년', '6반', '04'),
  ('2607@pof.com', '박수민', '2학년', '4반', '05')
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
