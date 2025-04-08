import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { StudyPlanList } from "@/components/study-plans/study-plan-list";
import { SmartGoalList } from "@/components/smart-goals/smart-goal-list";

export const metadata: Metadata = {
  title: "대시보드",
  description: "학습 현황을 확인하고 관리하세요.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="학습 대시보드"
        text="오늘의 학습 현황을 확인하고 관리하세요."
      />
      <div className="grid gap-8">
        <SmartGoalList />
        <StudyPlanList />
      </div>
    </DashboardShell>
  );
} 