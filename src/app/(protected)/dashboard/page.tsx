"use client";  // 클라이언트 컴포넌트로 변경

import { Metadata } from "next";
import StudyPlanSummary from "@/components/dashboard/StudyPlanSummary";
import AchievementChart from "@/components/dashboard/AchievementChart";
import RecommendationList from "@/components/dashboard/RecommendationList";
import CalendarView from "@/components/dashboard/CalendarView";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";

// 메타데이터는 서버 컴포넌트에서만 사용 가능하므로 export 제거
const metadata = {
  title: "대시보드 - 청해FLAME",
  description: "학습 현황과 계획을 한눈에 확인하세요.",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // 사용자가 로그인되어 있고, 세션 로딩이 완료된 경우
    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role as UserRole;
      
      console.log("사용자 역할:", userRole);
      
      // 역할에 따라 적절한 대시보드로 리디렉션
      if (userRole === "ADMIN") {
        console.log("관리자로 리디렉션");
        router.push("/admin/dashboard");
        return;
      } else if (userRole === "TEACHER") {
        console.log("교사로 리디렉션");
        router.push("/teacher/dashboard");
        return;
      }
      // STUDENT는 현재 페이지 유지
    }
  }, [session, status, router]);

  // 로딩 중이거나 리디렉션 중일 때
  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "STUDENT")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">페이지 이동 중...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">학습 진행 현황</h2>
            <AchievementChart />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">이번 주 학습 계획</h2>
            <StudyPlanSummary />
          </div>
        </div>
        
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AI 학습 추천</h2>
            <RecommendationList />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">학습 캘린더</h2>
            <CalendarView />
          </div>
        </div>
      </div>
    </div>
  );
} 