import { Metadata } from "next";
import Link from "next/link";
import StudyPlansTable from "@/components/study-plans/StudyPlansTable";
import StudyPlanFilter from "@/components/study-plans/StudyPlanFilter";

export const metadata: Metadata = {
  title: "학습 계획 관리 - 청해FLAME",
  description: "학습 계획을 관리하고 달성률을 추적하세요.",
};

export default function StudyPlansPage() {
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