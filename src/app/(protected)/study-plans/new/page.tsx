import { Metadata } from "next";
import Link from "next/link";
import StudyPlanForm from "@/components/study-plans/StudyPlanForm";

export const metadata: Metadata = {
  title: "새 학습 계획 - 청해FLAME",
  description: "새로운 학습 계획을 생성하세요.",
};

export default function NewStudyPlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">새 학습 계획</h1>
        <Link
          href="/study-plans"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <span>목록으로 돌아가기</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <StudyPlanForm />
      </div>
    </div>
  );
} 