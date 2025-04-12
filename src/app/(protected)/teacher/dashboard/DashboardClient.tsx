"use client";

import { User } from "next-auth";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

interface DashboardClientProps {
  user: User & {
    role: string;
    student_id?: string | null;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  return <TeacherDashboard user={user} />;
} 