"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GenerateRecommendation from "@/components/recommendations/GenerateRecommendation";

export default function GenerateRecommendationClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && !["TEACHER", "ADMIN"].includes(session?.user?.role || "")) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !["TEACHER", "ADMIN"].includes(session?.user?.role || "")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">접근 제한</h1>
        <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">학습 추천 생성</h1>
      <GenerateRecommendation />
    </div>
  );
} 