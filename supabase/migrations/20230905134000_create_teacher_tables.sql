-- 교사 정보 테이블
CREATE TABLE teacher_details (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT NOT NULL,
    subject TEXT,
    grade_level TEXT,
    class_assigned TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교사 피드백 테이블 (학생의 목표에 대한 피드백)
CREATE TABLE teacher_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES auth.users(id),
    student_id UUID REFERENCES auth.users(id),
    smart_goal_id UUID REFERENCES smart_goals(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교사 공지사항 테이블
CREATE TABLE teacher_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_classes TEXT[], -- 특정 반을 대상으로 한 공지
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- teacher_details 테이블 RLS
ALTER TABLE teacher_details ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 정보만 수정 가능
CREATE POLICY "교사가 자신의 정보를 관리할 수 있음" 
ON teacher_details 
FOR ALL 
TO authenticated
USING (user_id = auth.uid());

-- teacher_feedback 테이블 RLS
ALTER TABLE teacher_feedback ENABLE ROW LEVEL SECURITY;

-- 교사는 자신이 작성한 피드백만 수정/삭제 가능
CREATE POLICY "교사가 자신의 피드백을 관리할 수 있음" 
ON teacher_feedback 
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid());

-- 학생은 자신에 대한 피드백만 볼 수 있음
CREATE POLICY "학생이 자신에 대한 피드백을 볼 수 있음" 
ON teacher_feedback 
FOR SELECT 
TO authenticated
USING (student_id = auth.uid());

-- teacher_announcements 테이블 RLS
ALTER TABLE teacher_announcements ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 공지사항만 관리 가능
CREATE POLICY "교사가 자신의 공지사항을 관리할 수 있음" 
ON teacher_announcements 
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid());

-- 모든 인증된 사용자는 공지사항을 볼 수 있음
CREATE POLICY "모든 사용자가 공지사항을 볼 수 있음" 
ON teacher_announcements 
FOR SELECT 
TO authenticated
USING (true);

-- 교사가 모든 학생 목표를 볼 수 있음
CREATE POLICY "교사가 모든 학생 목표를 볼 수 있음" 
ON smart_goals 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- 교사가 모든 학생 진행 상황을 볼 수 있음
CREATE POLICY "교사가 모든 학생 진행 상황을 볼 수 있음" 
ON goal_progress 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- 교사가 모든 학생 정보를 볼 수 있음
CREATE POLICY "교사가 모든 학생 정보를 볼 수 있음" 
ON student_names 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- updated_at 자동 업데이트 트리거 함수 (신규 테이블용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER set_timestamp_teacher_details
BEFORE UPDATE ON teacher_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp_teacher_feedback
BEFORE UPDATE ON teacher_feedback
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp_teacher_announcements
BEFORE UPDATE ON teacher_announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 교사 테이블에 대한 기본 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_announcements TO authenticated; 