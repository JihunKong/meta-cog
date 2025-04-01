export type UserRole = "STUDENT" | "ADMIN" | "TEACHER";

export type RecommendationType = "STRATEGY" | "SCHEDULE" | "SUBJECT" | "UNIT";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  student_id?: string | null;
}

export interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  content: string;
  target: number;
  achievement: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Curriculum {
  id: string;
  subject: string;
  unit: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  subject: string;
  content: string;
  type: RecommendationType;
  createdAt: Date;
}

export interface StudyPlanFormData {
  subject: string;
  content: string;
  target: number;
  date: Date;
}

export interface CurriculumFormData {
  subject: string;
  unit: string;
  content: string;
  order: number;
} 