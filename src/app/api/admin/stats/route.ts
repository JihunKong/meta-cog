import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { supabase } from "@/lib/supabase";

// 관리자 통계 데이터 API
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 관리자 권한 확인
    if (session.user.role !== "ADMIN") {
      throw new ApiError(403, "관리자 권한이 필요합니다");
    }

    // 총 사용자 수 (학생만)
    const { count: totalUsers, error: userError } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT');

    if (userError) {
      console.error('사용자 수 조회 오류:', userError);
      throw new ApiError(500, userError.message);
    }

    // 과목 조회
    const { data: subjects, error: subjectError } = await supabase
      .from('Curriculum')
      .select('subject');

    if (subjectError) {
      console.error('과목 조회 오류:', subjectError);
      throw new ApiError(500, subjectError.message);
    }

    // 과목 중복 제거
    const uniqueSubjects = new Set();
    subjects?.forEach(item => uniqueSubjects.add(item.subject));
    const totalSubjects = uniqueSubjects.size;

    // 교과서 단원 수
    const { count: totalCurriculums, error: curriculumError } = await supabase
      .from('Curriculum')
      .select('*', { count: 'exact', head: true });

    if (curriculumError) {
      console.error('교과서 단원 조회 오류:', curriculumError);
      throw new ApiError(500, curriculumError.message);
    }

    // 학습 계획 수
    const { count: totalStudyPlans, error: studyPlanError } = await supabase
      .from('StudyPlan')
      .select('*', { count: 'exact', head: true });

    if (studyPlanError) {
      console.error('학습 계획 조회 오류:', studyPlanError);
      throw new ApiError(500, studyPlanError.message);
    }

    // 완료된 학습 계획 수 (달성률 100% 이상)
    const { count: completedStudyPlans, error: completedError } = await supabase
      .from('StudyPlan')
      .select('*', { count: 'exact', head: true })
      .gte('achievement', 100);

    if (completedError) {
      console.error('완료된 학습 계획 조회 오류:', completedError);
      throw new ApiError(500, completedError.message);
    }

    const stats = {
      totalUsers: totalUsers || 0,
      totalSubjects: totalSubjects || 0,
      totalCurriculums: totalCurriculums || 0,
      totalStudyPlans: totalStudyPlans || 0,
      completedStudyPlans: completedStudyPlans || 0,
    };

    return successResponse(stats);
  } catch (error) {
    console.error('관리자 통계 API 오류:', error);
    return errorResponse(error as Error);
  }
} 