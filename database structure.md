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

## RLS 정책 권장

### smart_goals 테이블
```sql
CREATE POLICY "Users can only access their own goals"
ON "public"."smart_goals"
FOR ALL
USING (auth.uid()::text = user_id::text);
```

### goal_progress 테이블
```sql
CREATE POLICY "Users can only access their own progress"
ON "public"."goal_progress"
FOR ALL
USING (EXISTS (
  SELECT 1 FROM smart_goals sg
  WHERE sg.id = goal_progress.smart_goal_id
  AND sg.user_id::text = auth.uid()::text
));
```

### profiles 테이블
```sql
CREATE POLICY "Users can only access their own profile"
ON "public"."profiles"
FOR ALL
USING (auth.uid()::text = id::text);
```

### student_names 테이블
```sql
CREATE POLICY "Users can only access their own student info"
ON "public"."student_names"
FOR ALL
USING (auth.uid()::text = id::text);
```