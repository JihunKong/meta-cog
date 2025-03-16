import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StudyPlan } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "인증되지 않은 요청입니다." } },
        { status: 401 }
      );
    }

    // 관리자 또는 교사 확인
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "TEACHER")) {
      return NextResponse.json(
        { success: false, error: { message: "접근 권한이 없습니다." } },
        { status: 403 }
      );
    }

    // 학생 ID 확인
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "학생 ID가 필요합니다." } },
        { status: 400 }
      );
    }

    // 학생 AI 추천 조회
    const recommendations = await prisma.aIRecommendation.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("학생 AI 추천 조회 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "AI 추천을 조회하는 중 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}

// AI 추천 생성
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "인증되지 않은 요청입니다." } },
        { status: 401 }
      );
    }

    // 관리자 또는 교사 확인
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "TEACHER")) {
      return NextResponse.json(
        { success: false, error: { message: "접근 권한이 없습니다." } },
        { status: 403 }
      );
    }

    // 학생 ID 확인
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "학생 ID가 필요합니다." } },
        { status: 400 }
      );
    }

    // 학생 존재 확인
    const student = await prisma.user.findUnique({
      where: { id },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, error: { message: "해당 학생을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    // 학생의 학습 데이터 가져오기
    const studyPlans = await prisma.studyPlan.findMany({
      where: { userId: id },
      orderBy: { date: "desc" },
      take: 30, // 최근 30개 학습 계획
    });

    // 과목별 통계 계산
    interface SubjectStatsMap {
      [key: string]: {
        totalTarget: number;
        totalAchievement: number;
        count: number;
      };
    }

    const subjectStats = studyPlans.reduce((acc: SubjectStatsMap, plan: StudyPlan) => {
      if (!acc[plan.subject]) {
        acc[plan.subject] = {
          totalTarget: 0,
          totalAchievement: 0,
          count: 0,
        };
      }
      
      acc[plan.subject].totalTarget += Number(plan.target);
      acc[plan.subject].totalAchievement += Number(plan.achievement);
      acc[plan.subject].count += 1;
      
      return acc;
    }, {} as SubjectStatsMap);

    // 달성률 계산 및 정렬
    const subjectStatsArray = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      achievementRate: stats.totalTarget > 0 
        ? Math.min(Math.round((stats.totalAchievement / stats.totalTarget) * 100), 100) 
        : 0,
      totalTarget: stats.totalTarget,
      totalAchievement: stats.totalAchievement,
      count: stats.count,
    })).sort((a, b) => a.achievementRate - b.achievementRate);

    // AI 추천 생성 (실제로는 AI 모델을 호출해야 함)
    // 여기서는 간단한 추천 로직으로 대체
    let recommendationContent = `${student.name || '학생'}님을 위한 학습 추천입니다.\n\n`;
    
    // 달성률이 낮은 과목에 대한 추천
    if (subjectStatsArray.length > 0) {
      const lowPerformingSubjects = subjectStatsArray.filter(s => s.achievementRate < 70);
      
      if (lowPerformingSubjects.length > 0) {
        recommendationContent += `📚 중점 개선 필요 과목:\n`;
        lowPerformingSubjects.forEach(subject => {
          recommendationContent += `- ${subject.subject}: 달성률 ${subject.achievementRate}%\n`;
          
          // 과목별 맞춤 추천
          if (subject.achievementRate < 30) {
            recommendationContent += `  → 기초부터 차근차근 시작하세요. 하루 30분씩 꾸준히 학습하는 것을 추천합니다.\n`;
          } else if (subject.achievementRate < 50) {
            recommendationContent += `  → 부족한 부분을 파악하고 집중적으로 보완하세요. 학습 시간을 10% 늘려보세요.\n`;
          } else {
            recommendationContent += `  → 거의 다 왔습니다! 마지막 마무리를 잘하면 큰 성과를 얻을 수 있습니다.\n`;
          }
        });
      }
      
      // 잘하는 과목에 대한 격려
      const highPerformingSubjects = subjectStatsArray.filter(s => s.achievementRate >= 80);
      if (highPerformingSubjects.length > 0) {
        recommendationContent += `\n🏆 잘하고 있는 과목:\n`;
        highPerformingSubjects.forEach(subject => {
          recommendationContent += `- ${subject.subject}: 달성률 ${subject.achievementRate}%\n`;
          recommendationContent += `  → 아주 잘하고 있습니다! 이 과목의 학습 방법을 다른 과목에도 적용해보세요.\n`;
        });
      }
    } else {
      recommendationContent += '아직 충분한 학습 데이터가 없습니다. 더 많은 학습 계획을 등록하고 실천해보세요!\n';
    }
    
    // 일반적인 조언 추가
    recommendationContent += `\n💡 일반 조언:\n`;
    recommendationContent += `- 규칙적인 학습 시간을 정하고 지키세요.\n`;
    recommendationContent += `- 한 번에 너무 많은 내용을 학습하기보다는, 짧더라도 꾸준히 하는 것이 중요합니다.\n`;
    recommendationContent += `- 어려운 내용은 선생님께 질문하거나 동료 학생들과 함께 학습해보세요.\n`;
    
    // 날짜 추가
    recommendationContent += `\n작성일: ${new Date().toLocaleDateString('ko-KR')}`;

    // 주요 과목 찾기
    const mainSubject = subjectStatsArray.length > 0 
      ? subjectStatsArray[Math.floor(subjectStatsArray.length / 2)].subject 
      : "종합";

    // AI 추천 저장
    const recommendation = await prisma.aIRecommendation.create({
      data: {
        content: recommendationContent,
        userId: id,
        subject: mainSubject,
        type: "STRATEGY",
      },
    });

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error("AI 추천 생성 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "AI 추천을 생성하는 중 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
} 