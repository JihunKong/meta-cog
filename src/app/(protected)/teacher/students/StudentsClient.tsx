"use client";

import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import { User } from "next-auth";

interface StudentsClientProps {
  user: User & {
    role: string;
    student_id?: string | null;
  };
}

export default function StudentsClient({ user }: StudentsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학생 목록</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <TeacherDashboard user={user} />
      </div>
    </div>
  );
} 