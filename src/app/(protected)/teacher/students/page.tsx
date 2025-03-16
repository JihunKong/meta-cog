import { Metadata } from "next";
import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

export const metadata: Metadata = {
  title: "학생 목록 - 청해FLAME",
  description: "학생들의 학습 현황을 관리하고 조언을 제공합니다.",
};

export default function StudentsPage() {
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