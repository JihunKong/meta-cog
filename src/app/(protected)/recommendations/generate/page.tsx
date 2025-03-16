import { Metadata } from "next";
import Link from "next/link";
import GenerateRecommendation from "@/components/recommendations/GenerateRecommendation";

export const metadata: Metadata = {
  title: "AI 학습 추천 생성 - 청해FLAME",
  description: "Claude 3.7 AI를 사용하여 맞춤형 학습 추천을 생성합니다.",
};

export default function GenerateRecommendationPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">새 AI 학습 추천 생성</h1>
        <Link
          href="/recommendations"
          className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          모든 추천 목록 보기
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <GenerateRecommendation />
      </div>
    </div>
  );
} 