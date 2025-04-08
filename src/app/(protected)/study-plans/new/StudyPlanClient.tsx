"use client";

import Link from "next/link";
import StudyPlanForm from "@/components/study-plans/StudyPlanForm";

export default function StudyPlanClient() {
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