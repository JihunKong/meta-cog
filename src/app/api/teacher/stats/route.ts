// 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabaseAdmin } from "@/lib/supabase";

// 수정된 기본 통계 데이터 타입 정의
interface MonthlyStats {
  month: string;
  achievement: number;
  participationRate: number;
  totalPlans: number;
  completedPlans: number;
}

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  totalPlans: number;
  completedPlans: number;
  averageAchievement: number;
  participationRate: number;
  participationDays: number;
  possibleDays: number;
}

interface TeacherStats {
  totalStudents: number;
  totalStudyPlans: number;
  averageAchievement: number;
  averageParticipationRate: number;
  subjectDistribution: Record<string, number>;
  monthlyAchievements: MonthlyStats[];
  studentPerformance: StudentPerformance[];
  lastUpdated: string;
}

// 통계 API (교사만 접근 가능)
export async function GET(request: Request) {
  try {
    console.log("[교사 통계 API] 시작");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("[교사 통계 API] 인증 실패: 세션 없음");
      throw new ApiError(401, "인증이 필요합니다");
    }
    
    console.log(`[교사 통계 API] 사용자: ${session.user.email}, 역할: ${session.user.role}`);

    // 교사 또는 관리자 권한 확인
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      console.log(`[교사 통계 API] 권한 오류: ${session.user.role}는 접근 불가`);
      throw new ApiError(403, "교사 또는 관리자 권한이 필요합니다");
    }

    // 기본 통계 데이터 구조 (오류 시 이 값 반환)
    const defaultStats: TeacherStats = {
      totalStudents: 0,
      totalStudyPlans: 0,
      averageAchievement: 0,
      averageParticipationRate: 0,
      subjectDistribution: {},
      monthlyAchievements: [],
      studentPerformance: [],
      lastUpdated: new Date().toISOString(),
    };

    try {
      console.log("[교사 통계 API] Supabase 쿼리 시작");
      
      // 1. 전체 학생 수 조회
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('User')
        .select('id, name, email')
        .eq('role', 'STUDENT');
      
      if (studentsError) {
        console.error("[교사 통계 API] 학생 조회 오류:", studentsError);
        throw new Error(`학생 정보 조회 오류: ${studentsError.message}`);
      }
      
      const totalStudents = students?.length || 0;
      defaultStats.totalStudents = totalStudents;
      console.log(`[교사 통계 API] 전체 학생 수: ${totalStudents}명`);

      // 2. 모든 학습 계획 조회
      const { data: studyPlans, error: studyPlansError } = await supabaseAdmin
        .from('StudyPlan')
        .select(`
          id, 
          user_id,
          subject,
          content,
          target,
          achievement,
          date,
          time_slot,
          reflection,
          created_at,
          updated_at,
          User:user_id (
            id,
            name,
            email
          )
        `);
      
      if (studyPlansError) {
        console.error("[교사 통계 API] 학습 계획 조회 오류:", studyPlansError);
        throw new Error(`학습 계획 조회 오류: ${studyPlansError.message}`);
      }
      
      const totalStudyPlans = studyPlans?.length || 0;
      defaultStats.totalStudyPlans = totalStudyPlans;
      console.log(`[교사 통계 API] 전체 학습 계획 수: ${totalStudyPlans}개`);

      // 3. 과목별 분포 계산
      const subjectDistribution: Record<string, number> = {};
      studyPlans?.forEach(plan => {
        const subject = plan.subject || "기타";
        subjectDistribution[subject] = (subjectDistribution[subject] || 0) + 1;
      });
      defaultStats.subjectDistribution = subjectDistribution;
      console.log(`[교사 통계 API] 과목별 분포: ${Object.keys(subjectDistribution).length}개 과목`);

      // 4. 월별 달성률 추이 계산
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // 최근 6개월 통계 계산
      const monthlyStats: MonthlyStats[] = [];
      // 총 참여율 계산용 변수
      let totalMaxParticipation = 0;
      let totalActualParticipation = 0;
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentDate.getMonth() - i, 1);
        const monthName = month.toLocaleString('ko-KR', { month: 'long' });
        
        // 해당 달의 학습 계획들 필터링
        const monthPlans = studyPlans?.filter(plan => {
          const planDate = new Date(plan.date);
          return planDate.getMonth() === month.getMonth() && 
                planDate.getFullYear() === month.getFullYear();
        }) || [];
        
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
          ? Math.round(completedPlans.reduce((sum, plan) => sum + (plan.achievement || 0), 0) / completedPlans.length)
          : 0;
          
        monthlyStats.push({
          month: monthName,
          achievement: averageAchievement,
          participationRate: participationRate,
          totalPlans: monthPlans.length,
          completedPlans: completedPlans.length,
        });
      }
      defaultStats.monthlyAchievements = monthlyStats;
      console.log(`[교사 통계 API] 월별 통계 계산 완료: ${monthlyStats.length}개월 데이터`);
      
      // 5. 전체 평균 참여율 계산
      const averageParticipationRate = totalMaxParticipation > 0
        ? Math.round((totalActualParticipation / totalMaxParticipation) * 100)
        : 0;
      defaultStats.averageParticipationRate = averageParticipationRate;
      console.log(`[교사 통계 API] 전체 평균 참여율: ${averageParticipationRate}%`);

      // 6. 학생별 평균 달성률 계산
      const studentPerformance: StudentPerformance[] = [];
      const studentMap: Record<string, { 
        plans: any[], 
        name: string,
        email: string 
      }> = {};
      
      // 학생별로 학습 계획 그룹화
      studyPlans?.forEach(plan => {
        if (plan.User) {
          const userId = plan.user_id;
          if (!studentMap[userId]) {
            studentMap[userId] = {
              plans: [],
              name: plan.User.name || "이름 없음",
              email: plan.User.email || "",
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
          ? Math.round(plansWithAchievement.reduce((sum, plan) => sum + (plan.achievement || 0), 0) / plansWithAchievement.length)
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
      defaultStats.studentPerformance = studentPerformance;
      console.log(`[교사 통계 API] 학생별 통계 계산 완료: ${studentPerformance.length}명`);
      
      // 7. 전체 평균 달성률 계산
      const plansWithAchievement = studyPlans?.filter(plan => plan.achievement > 0) || [];
      const averageAchievement = plansWithAchievement.length > 0
        ? Math.round(plansWithAchievement.reduce((sum, plan) => sum + (plan.achievement || 0), 0) / plansWithAchievement.length)
        : 0;
      defaultStats.averageAchievement = averageAchievement;
      console.log(`[교사 통계 API] 전체 평균 달성률: ${averageAchievement}%`);
      
      console.log("[교사 통계 API] 통계 데이터 생성 완료");
    } catch (dbError) {
      console.error("[교사 통계 API] 데이터베이스 쿼리 오류:", dbError);
      // DB 오류 시 기본 통계 데이터 반환
    }

    return successResponse(defaultStats);
  } catch (error) {
    console.error("[교사 통계 API] 통계 API 오류:", error);
    return errorResponse(error as Error);
  }
} 