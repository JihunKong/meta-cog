"use client";

import { Metadata } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import RecommendationList from "@/components/recommendations/RecommendationList";
import RecommendationFilter from "@/components/recommendations/RecommendationFilter";
import { checkUserRole } from "@/lib/utils";

// 메타데이터는 클라이언트 컴포넌트에서 직접 export할 수 없으므로 변수로 선언
const metadata = {
  title: "AI 학습 추천 - 청해FLAME",
  description: "AI가 추천하는 맞춤형 학습 전략과 계획을 확인하세요.",
};

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const isTeacher = session?.user && checkUserRole(session.user, ["TEACHER", "ADMIN"]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI 학습 추천</h1>
        {isTeacher && (
          <div className="flex gap-2">
            <Link
              href="/recommendations/generate"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              새 추천 생성하기
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <RecommendationFilter />
        <RecommendationList />
      </div>
    </div>
  );
} 