export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "STUDENT" | "TEACHER";
  student_id?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  created_at: Date;
  updated_at: Date;
} 