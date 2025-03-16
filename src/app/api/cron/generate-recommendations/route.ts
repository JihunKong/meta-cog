import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 이 엔드포인트는 인증되지 않았지만 cron-secret 헤더를 통해 보호됩니다.
// 실제 환경에서는 더 강력한 보안이 필요할 수 있습니다.
const CRON_SECRET = process.env.CRON_SECRET || "default-secret-key-for-development";

export async function POST(req: NextRequest) {
  try {
    // 비밀 키 확인
    const cronSecret = req.headers.get("cron-secret");
    if (cronSecret !== CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: { message: "인증되지 않은 요청입니다." } },
        { status: 401 }
      );
    }

    // 처리 중인 학생 수를 추적
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: { userId: string; error: string }[] = [];

    // 모든 학생 가져오기
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
    });

    // 각 학생마다 AI 추천 생성
    for (const student of students) {
      try {
        processedCount++;
        
        // 학생의 최근 학습 계획 가져오기
        const studyPlans = await prisma.studyPlan.findMany({
          where: { userId: student.id },
          orderBy: { date: "desc" },
          take: 30, // 최근 30개
        });

        // 학습 계획이 없는 경우 건너뛰기
        if (studyPlans.length === 0) {
          continue;
        }

        // 과목별 통계 계산
        interface SubjectStats {
          subject: string;
          totalTarget: number;
          totalAchievement: number;
          count: number;
          achievementRate: number;
        }

        const subjectMap = new Map<string, Omit<SubjectStats, "subject" | "achievementRate">>();
        
        studyPlans.forEach(plan => {
          if (!subjectMap.has(plan.subject)) {
            subjectMap.set(plan.subject, {
              totalTarget: 0,
              totalAchievement: 0,
              count: 0,
            });
          }
          
          const stats = subjectMap.get(plan.subject)!;
          stats.totalTarget += Number(plan.target);
          stats.totalAchievement += Number(plan.achievement);
          stats.count += 1;
        });
        
        // 달성률 계산 및 정렬
        const subjectStats: SubjectStats[] = Array.from(subjectMap.entries()).map(
          ([subject, stats]) => ({
            subject,
            ...stats,
            achievementRate:
              stats.totalTarget > 0
                ? Math.min(Math.round((stats.totalAchievement / stats.totalTarget) * 100), 100)
                : 0,
          })
        ).sort((a, b) => a.achievementRate - b.achievementRate);

        // AI 추천 생성
        let recommendationContent = `${student.name || '학생'}님을 위한 오늘의 학습 추천입니다.\n\n`;
        
        // 달성률이 낮은 과목에 대한 추천
        if (subjectStats.length > 0) {
          const lowPerformingSubjects = subjectStats.filter(s => s.achievementRate < 70);
          
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
          const highPerformingSubjects = subjectStats.filter(s => s.achievementRate >= 80);
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
        recommendationContent += `\n💡 오늘의 조언:\n`;
        
        // 무작위 조언 목록에서 하나 선택
        const adviceList = [
          "규칙적인 학습 시간을 정하고 지키는 것이 중요합니다. 매일 같은 시간에 공부하는 습관을 들이세요.",
          "한 번에 너무 많은 내용을 학습하기보다는, 짧더라도 꾸준히 하는 것이 효과적입니다.",
          "어려운 내용은 선생님께 질문하거나 동료 학생들과 함께 학습해보세요.",
          "집중력이 떨어질 때는 25분 공부 후 5분 휴식하는 '포모도로 기법'을 시도해보세요.",
          "공부하기 전 목표를 명확히 설정하고, 달성했을 때 작은 보상을 주는 것이 도움이 됩니다.",
          "복습은 새로운 내용을 배우는 것만큼 중요합니다. 매일 15분씩 전날 배운 내용을 복습하세요.",
          "스마트폰은 공부에 방해가 될 수 있습니다. 학습 시간에는 방해받지 않는 환경을 만드세요.",
          "새로운 개념을 배웠을 때, 그것을 다른 사람에게 설명하는 연습을 해보세요. 이해도가 높아집니다.",
          "자신의 학습 상태를 기록하고 추적하는 것이 동기부여에 도움이 됩니다.",
          "충분한 수면과 규칙적인 식사는 학습 효율을 높이는데 매우 중요합니다.",
          "어렵고 복잡한 주제는 작은 부분으로 나누어 학습하세요.",
          "시험 전날 벼락치기보다는 매일 조금씩 꾸준히 공부하는 것이 더 효과적입니다."
        ];
        
        const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
        recommendationContent += `- ${randomAdvice}\n`;
        
        // 날짜 추가
        recommendationContent += `\n작성일: ${new Date().toLocaleDateString('ko-KR')}`;

        // 주요 과목 결정 (가장 달성률이 낮은 과목)
        const mainSubject = subjectStats.length > 0 
          ? subjectStats[0].subject 
          : "종합";

        // AI 추천 저장
        await prisma.aIRecommendation.create({
          data: {
            content: recommendationContent,
            userId: student.id,
            subject: mainSubject,
            type: "STRATEGY",
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          userId: student.id,
          error: (error as Error).message,
        });
        console.error(`학생 ${student.id}의 AI 추천 생성 실패:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: students.length,
        processed: processedCount,
        success: successCount,
        error: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("AI 추천 일괄 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "AI 추천을 생성하는 중 오류가 발생했습니다.",
          details: (error as Error).message,
        },
      },
      { status: 500 }
    );
  }
} 