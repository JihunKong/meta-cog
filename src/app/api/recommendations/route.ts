import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { generateClaudeRecommendations } from "@/lib/claude";

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

    let where: any = {
      userId: session.user.id
    };

    if (type) {
      where.type = type;
    }

    if (subject) {
      where.subject = subject;
    }
    
    console.log('추천 조회 필터:', JSON.stringify(where));

    const recommendations = await prisma.aIRecommendation.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
    });
    
    console.log(`사용자 ID ${session.user.id}에 대한 추천 조회 결과: ${recommendations.length}개 항목`);
    
    // 추가 안전장치: 모든 추천이 현재 사용자의 것인지 확인
    const validRecommendations = recommendations.filter(rec => rec.userId === session.user.id);
    
    if (validRecommendations.length !== recommendations.length) {
      console.error(`사용자 ID 불일치: ${recommendations.length - validRecommendations.length}개의 추천이 필터링되었습니다.`);
    }

    return successResponse(validRecommendations);
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
    const recentStudyPlans = await prisma.studyPlan.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 30,
    });

    // 과목별 진도 데이터 처리
    const curriculumProgress = await prisma.curriculumProgress.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        curriculum: true,
      },
    });

    // 과목별로 진도 데이터 그룹화
    const subjectProgressMap: Record<string, { completedUnits: number; totalUnits: number }> = {};
    
    // 각 과목별 총 단원 수 계산
    const subjectUnits: Record<string, number> = {};
    
    const allCurriculum = await prisma.curriculum.findMany();
    allCurriculum.forEach((curr: { subject: string }) => {
      if (!subjectUnits[curr.subject]) {
        subjectUnits[curr.subject] = 0;
      }
      subjectUnits[curr.subject]++;
    });

    // 완료된 단원 계산 (진도율 80% 이상인 경우 완료로 간주)
    curriculumProgress.forEach((progress: { curriculum: { subject: string }, progress: number }) => {
      const subject = progress.curriculum.subject;
      
      if (!subjectProgressMap[subject]) {
        subjectProgressMap[subject] = {
          completedUnits: 0,
          totalUnits: subjectUnits[subject] || 0,
        };
      }
      
      if (progress.progress >= 80) {
        subjectProgressMap[subject].completedUnits++;
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
        recentStudyPlans,
        subjectProgress,
        user: {
          name: session.user.name || '학생',
          email: session.user.email || ''
        }
      }
    );

    // 추천 결과를 저장합니다
    const savedRecommendations = await Promise.all(
      recommendations.map((recommendation) =>
        prisma.aIRecommendation.create({
          data: recommendation,
        })
      )
    );

    return successResponse(savedRecommendations, 201);
  } catch (error) {
    return errorResponse(error as Error);
  }
} 