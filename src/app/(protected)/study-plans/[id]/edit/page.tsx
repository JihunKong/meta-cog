import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StudyPlanEditForm from "@/components/study-plans/StudyPlanEditForm";

export const metadata: Metadata = {
  title: "학습 계획 수정 - 청해FLAME",
  description: "학습 계획을 수정하세요.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [
    { id: "fallback" },
  ];
}

interface StudyPlanEditPageProps {
  params: {
    id: string;
  };
}

export default function StudyPlanEditPage({ params }: StudyPlanEditPageProps) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학습 계획 수정</h1>
        <Link
          href={`/study-plans/${id}`}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <span>상세 페이지로 돌아가기</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <StudyPlanEditForm id={id} />
      </div>
    </div>
  );
} 