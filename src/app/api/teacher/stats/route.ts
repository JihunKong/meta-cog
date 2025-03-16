import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// 통계 API (교사만 접근 가능)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    // 전체 학생 수 조회
    const totalStudents = await prisma.user.count({
      where: { role: "STUDENT" },
    });

    // 모든 학습 계획 조회
    const studyPlans = await prisma.studyPlan.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 총 학습 계획 수
    const totalStudyPlans = studyPlans.length;

    // 과목별 분포 계산
    const subjectDistribution: Record<string, number> = {};
    studyPlans.forEach(plan => {
      const subject = plan.subject || "기타";
      subjectDistribution[subject] = (subjectDistribution[subject] || 0) + 1;
    });

    // 월별 달성률 추이 계산
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // 최근 6개월 통계 계산
    const monthlyStats = [];
    // 총 참여율 계산용 변수
    let totalMaxParticipation = 0;
    let totalActualParticipation = 0;
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentYear, currentDate.getMonth() - i, 1);
      const monthName = month.toLocaleString('ko-KR', { month: 'long' });
      
      // 해당 달의 학습 계획들 필터링
      const monthPlans = studyPlans.filter(plan => {
        const planDate = new Date(plan.date);
        return planDate.getMonth() === month.getMonth() && 
               planDate.getFullYear() === month.getFullYear();
      });
      
      // 월간 참여 가능 횟수 계산 (학생 수 * 주당 참여 가능 횟수(5) * 주당 일수(5))
      const daysInMonth = new Date(currentYear, month.getMonth() + 1, 0).getDate();
      const weekdays = Math.min(Math.floor(daysInMonth / 7 * 5), daysInMonth);
      const maxParticipation = totalStudents * weekdays;
      
      // 실제 참여 횟수
      const actualParticipation = monthPlans.length;
      
      // 총계에 추가
      totalMaxParticipation += maxParticipation;
      totalActualParticipation += actualParticipation;
      
      // 참여율 계산
      const participationRate = maxParticipation > 0 
        ? Math.round((actualParticipation / maxParticipation) * 100) 
        : 0;
      
      // 달성률 계산
      const completedPlans = monthPlans.filter(plan => plan.achievement > 0);
      const averageAchievement = completedPlans.length > 0
        ? Math.round(completedPlans.reduce((sum, plan) => sum + plan.achievement, 0) / completedPlans.length)
        : 0;
        
      monthlyStats.push({
        month: monthName,
        achievement: averageAchievement,
        participationRate: participationRate,
        totalPlans: monthPlans.length,
        completedPlans: completedPlans.length,
      });
    }
    
    // 전체 평균 참여율 계산
    const averageParticipationRate = totalMaxParticipation > 0
      ? Math.round((totalActualParticipation / totalMaxParticipation) * 100)
      : 0;

    // 학생별 평균 달성률 계산
    const studentPerformance = [];
    const studentMap: Record<string, { plans: any[], name: string, email: string }> = {};
    
    // 학생별로 학습 계획 그룹화
    studyPlans.forEach(plan => {
      if (plan.user) {
        const userId = plan.user.id;
        if (!studentMap[userId]) {
          studentMap[userId] = {
            plans: [],
            name: plan.user.name || "이름 없음",
            email: plan.user.email || "",
          };
        }
        studentMap[userId].plans.push(plan);
      }
    });
    
    // 학생별 참여 데이터 계산을 위한 날짜 범위 설정 (최근 3개월)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);
    
    // 각 학생의 평균 달성률과 참여율 계산
    for (const userId in studentMap) {
      const student = studentMap[userId];
      const plansWithAchievement = student.plans.filter(plan => plan.achievement > 0);
      const averageAchievement = plansWithAchievement.length > 0
        ? Math.round(plansWithAchievement.reduce((sum, plan) => sum + plan.achievement, 0) / plansWithAchievement.length)
        : 0;
      
      // 참여율 계산: 최근 3개월간 참여한 일수 / 최근 3개월간 총 수업일수
      const recentPlans = student.plans.filter(plan => new Date(plan.date) >= threeMonthsAgo);
      
      // 학생별 참여 가능 일수 계산 (최근 3개월간 주중일수)
      let possibleDays = 0;
      let currentDate = new Date(threeMonthsAgo);
      while (currentDate <= new Date()) {
        // 주중(월-금)인 경우만 카운트
        if (currentDate.getDay() > 0 && currentDate.getDay() < 6) {
          possibleDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 학생이 참여한 고유 날짜 수 계산
      const uniqueDates = new Set();
      recentPlans.forEach(plan => {
        const dateStr = new Date(plan.date).toISOString().split('T')[0];
        uniqueDates.add(dateStr);
      });
      
      const participationDays = uniqueDates.size;
      const participationRate = possibleDays > 0
        ? Math.round((participationDays / possibleDays) * 100)
        : 0;
        
      studentPerformance.push({
        id: userId,
        name: student.name,
        email: student.email,
        totalPlans: student.plans.length,
        completedPlans: plansWithAchievement.length,
        averageAchievement: averageAchievement,
        participationRate: participationRate,
        participationDays: participationDays,
        possibleDays: possibleDays
      });
    }
    
    // 전체 평균 달성률 계산
    const plansWithAchievement = studyPlans.filter(plan => plan.achievement > 0);
    const averageAchievement = plansWithAchievement.length > 0
      ? Math.round(plansWithAchievement.reduce((sum, plan) => sum + plan.achievement, 0) / plansWithAchievement.length)
      : 0;

    return successResponse({
      totalStudents,
      totalStudyPlans,
      averageAchievement,
      averageParticipationRate,
      subjectDistribution,
      monthlyAchievements: monthlyStats,
      studentPerformance,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("통계 API 오류:", error);
    return errorResponse(error as Error);
  }
} 