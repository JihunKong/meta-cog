import { Metadata } from "next";
import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import StudentDetail from "@/components/teacher/StudentDetail";

export const metadata: Metadata = {
  title: "학생 학습 현황 - 청해FLAME",
  description: "학생의 학습 계획과 달성률을 확인하고 관리합니다.",
};

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