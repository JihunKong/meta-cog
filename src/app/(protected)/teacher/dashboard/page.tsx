import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "교사 대시보드 - 청해FLAME",
  description: "학생들의 학습 성과와 통계를 확인하세요.",
};

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  if (session.user.role !== "TEACHER") {
    redirect("/");
  }
  
  // 서버 컴포넌트에서 UI 구성하고 클라이언트 컴포넌트는 PropsDrilling으로 전달
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">교사 대시보드</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        <DashboardClient user={session.user} />
      </div>
    </div>
  );
} 