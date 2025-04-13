"use client";

import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import StudentDetail from "@/components/teacher/StudentDetail";

interface StudentDetailPageProps {
  params: {
    id: string;
  };
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  return (
    <TeacherCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">학생 학습 현황</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <StudentDetail studentId={params.id} />
        </div>
      </div>
    </TeacherCheck>
  );
}

 