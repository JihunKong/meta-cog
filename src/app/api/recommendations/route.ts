import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";
import { generateClaudeRecommendations } from "@/lib/claude";
import { supabase } from "@/lib/supabase";

// AI 추천 목록 조회 API
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }
    
    console.log('추천 조회 API: 인증된 사용자 ID:', session.user.id, 'Email:', session.user.email, 'Role:', session.user.role);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const subject = searchParams.get("subject");

    // 반드시 사용자 ID로 필터링
    if (!session.user.id) {
      throw new ApiError(400, "유효한 사용자 ID가 필요합니다");
    }

    // 쿼리 구성
    let query = supabase
      .from('AIRecommendation')
      .select('*')
      .eq('user_id', session.user.id);

    if (type) {
      query = query.eq('type', type);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: recommendations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, error.message);
    }
    
    console.log(`사용자 ID ${session.user.id}에 대한 추천 조회 결과: ${recommendations?.length || 0}개 항목`);

    return successResponse(recommendations || []);
  } catch (error) {
    return errorResponse(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 최근 학습 계획 데이터를 가져옵니다
    const { data: recentStudyPlans, error: studyError } = await supabase
      .from('StudyPlan')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (studyError) {
      throw new ApiError(500, "학습 계획 데이터를 가져오는 중 오류가 발생했습니다: " + studyError.message);
    }

    // 교과 과정 데이터 가져오기
    const { data: allCurriculum, error: curriculumError } = await supabase
      .from('Curriculum')
      .select('*');

    if (curriculumError) {
      throw new ApiError(500, "교과 과정 데이터를 가져오는 중 오류가 발생했습니다: " + curriculumError.message);
    }

    // 교과 과정 진도 데이터 가져오기
    const { data: curriculumProgress, error: progressError } = await supabase
      .from('CurriculumProgress')
      .select('*, Curriculum:curriculum_id(*)')
      .eq('user_id', session.user.id);

    if (progressError) {
      throw new ApiError(500, "교과 과정 진도 데이터를 가져오는 중 오류가 발생했습니다: " + progressError.message);
    }

    // 과목별로 진도 데이터 그룹화
    const subjectProgressMap: Record<string, { completedUnits: number; totalUnits: number }> = {};
    
    // 각 과목별 총 단원 수 계산
    const subjectUnits: Record<string, number> = {};
    
    allCurriculum?.forEach((curr: { subject: string }) => {
      if (!subjectUnits[curr.subject]) {
        subjectUnits[curr.subject] = 0;
      }
      subjectUnits[curr.subject]++;
    });

    // 완료된 단원 계산 (진도율 80% 이상인 경우 완료로 간주)
    curriculumProgress?.forEach((progress: any) => {
      if (progress.Curriculum) {
        const subject = progress.Curriculum.subject;
        
        if (!subjectProgressMap[subject]) {
          subjectProgressMap[subject] = {
            completedUnits: 0,
            totalUnits: subjectUnits[subject] || 0,
          };
        }
        
        if (progress.progress_percentage >= 80) {
          subjectProgressMap[subject].completedUnits++;
        }
      }
    });

    // 각 과목별 진행 상황 배열 생성
    const subjectProgress = Object.entries(subjectProgressMap).map(([subject, data]) => ({
      subject,
      completedUnits: data.completedUnits,
      totalUnits: data.totalUnits,
    }));

    // Claude API를 통해 AI 추천을 생성합니다
    const recommendations = await generateClaudeRecommendations(
      session.user.id,
      {
        recentStudyPlans: recentStudyPlans || [],
        subjectProgress,
        user: {
          name: session.user.name || '학생',
          email: session.user.email || ''
        }
      }
    );

    // 추천 결과를 저장합니다
    const savedRecommendations = [];
    for (const recommendation of recommendations) {
      const { data, error } = await supabase
        .from('AIRecommendation')
        .insert([
          {
            user_id: recommendation.userId,
            subject: recommendation.subject,
            content: recommendation.content,
            type: recommendation.type,
            created_at: new Date()
          }
        ])
        .select()
        .single();
        
      if (error) {
        console.error("추천 저장 중 오류:", error);
      } else if (data) {
        savedRecommendations.push(data);
      }
    }

    return successResponse(savedRecommendations, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 