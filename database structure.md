# Meta-Cog 데이터베이스 구조

## 테이블 구조

### smart_goals 
- id (uuid)
- user_id (uuid) - auth.users의 id와 연결
- subject (text)
- description (text)
- created_at (timestamptz)

### goal_progress
- id (uuid)
- user_id (uuid) - auth.users의 id와 연결
- smart_goal_id (uuid) - smart_goals의 id와 연결
- percent (int4)
- reflection (text)
- created_at (timestamptz)

### profiles
- id (uuid) - auth.users의 id와 연결
- email (text)
- role (text)
- created_at (timestamptz)

### student_names
- id (uuid) - auth.users의 id와 연결
- email (text)
- display_name (text)
- grade (varchar)
- class (varchar)
- student_number (varchar)
- created_at (timestamptz)
- updated_at (timestamptz)
