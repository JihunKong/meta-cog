// 공통 타입 정의
export interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  school?: string;
  grade?: string;
  classNum?: string;
  studentNum?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  created_at: any;
  status: string;
}

export interface Session {
  id: string;
  user_id: string;
  duration: number;
  percent: number;
  date: any;
  notes: string;
  reflection: string;
  created_at: any;
  subject?: string;
  teacher_feedback?: string;
}

export interface Reflection {
  id: string;
  content: string;
  created_at: any;
  teacher_feedback?: string;
}
