--아래는 meta-cog의 데이터베이스 구조입니다.
smart goals 
    - id(uuid)
    - user_id(uuid)
    - subject(text)
    - description(text)
    - created_at(timestamptz)
goal_progress
    - id(uuid)
    - smart_goal_id(uuid)
    - percent(int4)
    - reflection(text)
    - created_at(timestamptz)
profiles
    - id(uuid)
    - email(text)
    - role(text)
    - created_at(timestamptz)
students_names
    - id(uuid)
    - email(text)
    - display_name(text)
    - grade(varchar)
    - class(varchar)
    - student_number(varchar)
    - created_at(timestamptz) 
    - updated_at(timestamptz)