import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// 관리자 통계 데이터 API
export async function GET(req: Request) {
  try {
    console.log("관리자 통계 API 시작");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 초기 통계 값 설정
    let stats = {
      totalUsers: 0,
      totalSubjects: 0,
      totalCurriculums: 0,
      totalStudyPlans: 0,
      completedStudyPlans: 0,
    };

    try {
      // 총 사용자 수 (학생만) - 관리자 권한 사용
      const { count: totalUsers, error: userError } = await supabaseAdmin
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'STUDENT');

      if (userError) {
        console.error('사용자 수 조회 오류:', userError);
        // 오류가 있어도 계속 진행
      } else {
        stats.totalUsers = totalUsers || 0;
      }
    } catch (err) {
      console.error("사용자 통계 조회 오류:", err);
      // 오류가 있어도 계속 진행
    }

    try {
      // 과목 조회 - 관리자 권한 사용
      const { data: subjects, error: subjectError } = await supabaseAdmin
        .from('Curriculum')
        .select('subject');

      if (subjectError) {
        console.error('과목 조회 오류:', subjectError);
        // 오류가 있어도 계속 진행
      } else {
        // 과목 중복 제거
        const uniqueSubjects = new Set();
        subjects?.forEach(item => uniqueSubjects.add(item.subject));
        stats.totalSubjects = uniqueSubjects.size;
      }
    } catch (err) {
      console.error("과목 통계 조회 오류:", err);
      // 오류가 있어도 계속 진행
    }

    try {
      // 교과서 단원 수 - 관리자 권한 사용
      const { count: totalCurriculums, error: curriculumError } = await supabaseAdmin
        .from('Curriculum')
        .select('*', { count: 'exact', head: true });

      if (curriculumError) {
        console.error('교과서 단원 조회 오류:', curriculumError);
        // 오류가 있어도 계속 진행
      } else {
        stats.totalCurriculums = totalCurriculums || 0;
      }
    } catch (err) {
      console.error("교과서 단원 통계 조회 오류:", err);
      // 오류가 있어도 계속 진행
    }

    try {
      // 학습 계획 수 - 관리자 권한 사용
      const { count: totalStudyPlans, error: studyPlanError } = await supabaseAdmin
        .from('StudyPlan')
        .select('*', { count: 'exact', head: true });

      if (studyPlanError) {
        console.error('학습 계획 조회 오류:', studyPlanError);
        // 오류가 있어도 계속 진행
      } else {
        stats.totalStudyPlans = totalStudyPlans || 0;
      }
    } catch (err) {
      console.error("학습 계획 통계 조회 오류:", err);
      // 오류가 있어도 계속 진행
    }

    try {
      // 완료된 학습 계획 수 (달성률 100% 이상) - 관리자 권한 사용
      const { count: completedStudyPlans, error: completedError } = await supabaseAdmin
        .from('StudyPlan')
        .select('*', { count: 'exact', head: true })
        .gte('achievement', 100);

      if (completedError) {
        console.error('완료된 학습 계획 조회 오류:', completedError);
        // 오류가 있어도 계속 진행
      } else {
        stats.completedStudyPlans = completedStudyPlans || 0;
      }
    } catch (err) {
      console.error("완료된 학습 계획 통계 조회 오류:", err);
      // 오류가 있어도 계속 진행
    }

    console.log("통계 데이터 생성 완료:", stats);
    return successResponse(stats);
  } catch (error) {
    console.error('관리자 통계 API 오류:', error);
    return errorResponse(error as Error);
  }
} 