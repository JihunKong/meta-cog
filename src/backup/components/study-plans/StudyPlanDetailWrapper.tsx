"use client";

import Link from "next/link";
import StudyPlanDetail from "./StudyPlanDetail";

interface StudyPlanDetailWrapperProps {
  id: string;
}

export default function StudyPlanDetailWrapper({ id }: StudyPlanDetailWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학습 계획 상세</h1>
        <div className="flex gap-2">
          <Link
            href={`/study-plans/${id}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            수정
          </Link>
          <Link
            href="/study-plans"
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <StudyPlanDetail id={id} />
      </div>
    </div>
  );
} 