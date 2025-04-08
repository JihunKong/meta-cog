"use client";

import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

export default function StudentsClient() {
  return (
    <TeacherCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">학생 목록</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <TeacherDashboard />
        </div>
      </div>
    </TeacherCheck>
  );
} 