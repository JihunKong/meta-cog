import { Metadata } from "next";
import StudyPlanSummary from "@/components/dashboard/StudyPlanSummary";
import AchievementChart from "@/components/dashboard/AchievementChart";
import RecommendationList from "@/components/dashboard/RecommendationList";
import CalendarView from "@/components/dashboard/CalendarView";

export const metadata: Metadata = {
  title: "대시보드 - 청해FLAME",
  description: "학습 현황과 계획을 한눈에 확인하세요.",
};

export default function DashboardPage() {
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