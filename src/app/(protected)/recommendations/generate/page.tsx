"use client";

import { Metadata } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GenerateRecommendation from "@/components/recommendations/GenerateRecommendation";
import { checkUserRole } from "@/lib/utils";

// 메타데이터는 클라이언트 컴포넌트에서 직접 export할 수 없으므로 변수로 선언
const metadata = {
  title: "AI 학습 추천 생성 - 청해FLAME",
  description: "Claude 3.7 AI를 사용하여 맞춤형 학습 추천을 생성합니다.",
};

export default function GenerateRecommendationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // 로그인 상태이고 교사/관리자가 아닌 경우 대시보드로 리디렉션
    if (status === "authenticated" && session?.user) {
      if (!checkUserRole(session.user, ["TEACHER", "ADMIN"])) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  // 페이지 로딩 중이거나 권한 체크 중일 때
  if (status === "loading" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 권한이 없는 경우 (접근 제한 메시지)
  if (!checkUserRole(session.user, ["TEACHER", "ADMIN"])) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              이 페이지는 교사와 관리자만 접근할 수 있습니다.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/dashboard" className="font-medium text-yellow-700 underline hover:text-yellow-600">
                대시보드로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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