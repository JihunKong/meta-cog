"use client";

import Link from "next/link";
import StudyPlansTable from "@/components/study-plans/StudyPlansTable";
import StudyPlanFilter from "@/components/study-plans/StudyPlanFilter";

export default function StudyPlansClient() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학습 계획 관리</h1>
        <Link
          href="/study-plans/new"
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
        >
          <span>새 학습 계획 추가</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <StudyPlanFilter />
        <StudyPlansTable />
      </div>
    </div>
  );
} 