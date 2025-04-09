import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecommendationDetailWrapper from "./RecommendationDetailWrapper";

export const metadata: Metadata = {
  title: "AI 추천 상세 - 청해FLAME",
  description: "AI가 추천하는 맞춤형 학습 전략 상세 내용을 확인하세요.",
};

interface RecommendationDetailPageProps {
  params: {
    id: string;
  };
}

export default function RecommendationDetailPage({ params }: RecommendationDetailPageProps) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI 추천 상세</h1>
        <Link
          href="/recommendations"
          className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          목록으로 돌아가기
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <RecommendationDetailWrapper id={id} />
      </div>
    </div>
  );
} 