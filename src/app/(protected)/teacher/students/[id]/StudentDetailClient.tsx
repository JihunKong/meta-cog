"use client";

import { User } from "next-auth";
import StudentDetail from "@/components/teacher/StudentDetail";

interface StudentDetailClientProps {
  user: User & {
    role: string;
    student_id?: string | null;
  };
  studentId: string;
}

export default function StudentDetailClient({ user, studentId }: StudentDetailClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학생 학습 현황</h1>
      </div>
      <StudentDetail studentId={studentId} />
    </div>
  );
} 