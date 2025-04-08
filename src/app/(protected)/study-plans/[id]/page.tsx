import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StudyPlanDetail from "@/components/study-plans/StudyPlanDetail";

export const metadata: Metadata = {
  title: "학습 계획 상세 - 청해FLAME",
  description: "학습 계획의 상세 정보를 확인하세요.",
};

interface StudyPlanDetailPageProps {
  params: {
    id: string;
  };
}

export default function StudyPlanDetailPage({ params }: StudyPlanDetailPageProps) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

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

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [
    { id: "fallback" },
  ];
} 