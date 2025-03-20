import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { z } from "zod";
import { generateClaudeRecommendations } from "@/lib/claude";

// 필요한 타입 정의
interface Curriculum {
  id: string;
  subject: string;
  unit: string;
  content: string;
  order: number;
}

interface CurriculumProgress {
  id: string;
  userId: string;
  curriculumId: string;
  progress: number;
  curriculum: Curriculum;
}

// API 스키마 정의
const generateRecommendationSchema = z.object({
  type: z.enum(["STRATEGY", "SCHEDULE", "SUBJECT", "UNIT"]).optional(),
  subject: z.string().optional(),
});

type GenerateRecommendationInput = z.infer<typeof generateRecommendationSchema>;

export async function POST(request: Request) {
  try {
    console.log('AI 추천 생성 API 호출됨');
    
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.error('인증되지 않은 사용자가 API 호출 시도');
      throw new ApiError(401, "인증이 필요합니다");
    }

    console.log('인증된 사용자:', session.user.email);

    // 요청 데이터 검증
    let validatedData: GenerateRecommendationInput = {};
    
    try {
      const body = await request.json();
      validatedData = generateRecommendationSchema.parse(body);
    } catch (validationError) {
      console.error('요청 데이터 검증 실패:', validationError);
      throw new ApiError(400, "유효하지 않은 요청 데이터입니다");
    }

    // 최근 10개의 학습 계획 조회
    const recentStudyPlans = await prisma.studyPlan.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    console.log(`조회된 학습 계획 수: ${recentStudyPlans.length}`);

    // 과목별 단원 수 계산
    const curriculum = await prisma.curriculum.findMany({
      orderBy: {
        subject: "asc",
      },
    });

    const subjectUnits: Record<string, number> = {};
    curriculum.forEach((item: Curriculum) => {
      if (!subjectUnits[item.subject]) {
        subjectUnits[item.subject] = 0;
      }
      subjectUnits[item.subject]++;
    });

    console.log('과목별 단원 수:', subjectUnits);

    // 사용자의 커리큘럼 진도 조회
    const curriculumProgress = await prisma.curriculumProgress.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        curriculum: true,
      },
    }) as CurriculumProgress[];

    console.log(`조회된 커리큘럼 진도 수: ${curriculumProgress.length}`);

    // 과목별 진행 상황 매핑
    const subjectProgressMap: Record<string, { completedUnits: number; totalUnits: number }> = {};

    // 완료된 단원 계산 (진도율 80% 이상인 경우 완료로 간주)
    curriculumProgress.forEach((progress: CurriculumProgress) => {
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

    console.log('과목별 진행 상황:', subjectProgress);

    console.log('Claude API 추천 생성 시작...');
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

    console.log(`생성된 추천 수: ${recommendations.length}`);

    // 특정 타입과 과목에 대한 필터링
    const filteredRecommendations = recommendations.filter(rec => {
      if (validatedData.type && rec.type !== validatedData.type) return false;
      if (validatedData.subject && rec.subject !== validatedData.subject) return false;
      return true;
    });

    console.log(`필터링 후 추천 수: ${filteredRecommendations.length}`);

    // 추천 결과를 저장합니다
    try {
      const savedRecommendations = await Promise.all(
        filteredRecommendations.map((recommendation) =>
          prisma.aIRecommendation.create({
            data: recommendation,
          })
        )
      );

      console.log(`저장된 추천 수: ${savedRecommendations.length}`);
      
      // 성공 응답 반환 (추가 정보 포함)
      return successResponse({
        recommendations: savedRecommendations,
        info: {
          studyPlansCount: recentStudyPlans.length,
          progressCount: curriculumProgress.length,
          generatedCount: recommendations.length,
          savedCount: savedRecommendations.length
        }
      }, 201);
    } catch (dbError) {
      console.error('추천 저장 오류:', dbError);
      throw new ApiError(500, "추천을 저장하는 중 오류가 발생했습니다");
    }
  } catch (error) {
    console.error('추천 생성 에러:', error);
    return errorResponse(error as Error);
  }
}

// 간단한 추천 콘텐츠 생성 함수 (실제 프로덕션에서는 AI 모델을 사용해야 함)
function generateRecommendationContent(type: string, subject: string, additionalInfo?: string): string {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  
  switch (type) {
    case "STRATEGY":
      return `[${subject} 학습 전략 추천] - ${currentDate}
      
${subject}에 대한 효과적인 학습 전략을 추천합니다:

1. 개념 이해 중심으로 접근하기
   - 암기보다는 원리와 개념을 이해하는 데 집중하세요.
   - 주요 개념을 자신의 말로 설명해보는 연습을 하세요.

2. 문제 해결 능력 강화하기
   - 다양한 유형의 문제를 풀어보며 응용력을 키우세요.
   - 어려운 문제는 단계별로 나누어 접근하세요.

3. 오답 노트 작성하기
   - 틀린 문제는 반드시 오답 노트에 정리하세요.
   - 왜 틀렸는지, 정답은 무엇인지 명확히 기록하세요.

4. 복습 일정 설정하기
   - 에빙하우스의 망각 곡선을 고려하여 복습 일정을 세우세요.
   - 학습 후 1일, 3일, 7일, 14일 후에 복습하는 것이 효과적입니다.

5. 학습 환경 최적화하기
   - 집중이 잘 되는 환경을 조성하세요.
   - 50분 학습 후 10분 휴식의 패턴을 유지하세요.

${additionalInfo ? `\n추가 정보를 바탕으로 맞춤 추천:\n${additionalInfo}에 관련하여 더 집중적인 학습이 필요합니다.` : ''}`;

    case "SCHEDULE":
      return `[${subject} 학습 일정 추천] - ${currentDate}
      
${subject}에 대한 효율적인 학습 일정을 추천합니다:

< 주간 학습 계획 >

월요일:
- 오전 (1시간): 전주 배운 내용 복습
- 오후 (1.5시간): 새로운 개념 학습
- 저녁 (30분): 오늘 배운 내용 요약 정리

화요일:
- 오전 (1시간): 개념 문제 풀이
- 오후 (1.5시간): 응용 문제 풀이
- 저녁 (30분): 오답 정리 및 복습

수요일:
- 오전 (1시간): 어려웠던 부분 재학습
- 오후 (1.5시간): 심화 문제 풀이
- 저녁 (30분): 학습 내용 요약 및 정리

목요일:
- 오전 (1시간): 개념 복습 및 확장
- 오후 (1.5시간): 실전 문제 풀이
- 저녁 (30분): 오답 분석

금요일:
- 오전 (1시간): 취약점 집중 학습
- 오후 (1.5시간): 모의고사 풀이
- 저녁 (1시간): 주간 총 복습

주말:
- 토요일 (2시간): 한 주 내용 종합 정리
- 일요일: 충분한 휴식 후 다음 주 학습 계획 수립

${additionalInfo ? `\n맞춤 일정 조정:\n${additionalInfo}을(를) 고려하여 일정을 조정하는 것이 좋습니다.` : ''}`;

    case "SUBJECT":
      return `[학습 과목 추천] - ${currentDate}
      
현재 ${subject}를 공부하고 계시는군요. 균형 잡힌 학습을 위해 함께 공부하면 좋을 과목을 추천합니다:

1. 주력 과목: ${subject}
   - 현재 집중하고 있는 과목으로 계속해서 깊이 있게 학습하세요.
   - 주 3-4회, 회당 1.5시간 투자가 적절합니다.

2. 보완 과목 추천:
   ${subject === "수학" ? "물리학" : subject === "국어" ? "사회" : subject === "영어" ? "국어" : "수학"}
   - ${subject}와 시너지 효과를 낼 수 있는 과목입니다.
   - 주 2-3회, 회당 1시간 투자를 추천합니다.

3. 균형을 위한 과목:
   ${subject === "수학" || subject === "과학" ? "국어 또는 영어" : "수학 또는 과학"}
   - 다른 사고방식을 활용하여 두뇌의 균형 발달에 도움이 됩니다.
   - 주 2회, 회당 1시간 투자가 적절합니다.

4. 장기적 성장을 위한 과목:
   ${subject === "수학" ? "통계학 기초" : subject === "국어" ? "철학 입문" : subject === "영어" ? "제2외국어" : "정보 및 컴퓨터 과학"}
   - 심화 학습 및 진로 탐색에 도움이 됩니다.
   - 주 1회, 회당 1시간 투자를 시작으로 점진적으로 늘려가세요.

${additionalInfo ? `\n개인 맞춤 과목 추천:\n${additionalInfo}을(를) 고려하여 ${subject === "수학" ? "경제학 기초" : "심리학 입문"}도 함께 학습하시면 도움이 될 것입니다.` : ''}`;

    case "UNIT":
      return `[${subject} 단원 학습 추천] - ${currentDate}
      
${subject}에서 중점적으로 학습해야 할 단원을 추천합니다:

< 핵심 단원 및 학습 순서 >

1. 우선 학습 단원:
   ${subject === "수학" ? "함수의 극한과 연속" : 
   subject === "국어" ? "현대 문학 작품 해석" : 
   subject === "영어" ? "동사의 시제와 태" : 
   "물질의 구조와 특성"}
   - 기초 개념을 다지는 데 필수적인 단원입니다.
   - 충분한 시간을 들여 완벽하게 이해하세요.

2. 중점 학습 단원:
   ${subject === "수학" ? "미분법과 적분법" : 
   subject === "국어" ? "비문학 독해와 논증" : 
   subject === "영어" ? "구문 분석과 해석" : 
   "화학 반응과 에너지"}
   - 많은 문제가 출제되는 중요한 단원입니다.
   - 다양한 유형의 문제를 풀어보며 응용력을 키우세요.

3. 심화 학습 단원:
   ${subject === "수학" ? "확률과 통계" : 
   subject === "국어" ? "고전 문학과 문법" : 
   subject === "영어" ? "에세이 작성과 독해" : 
   "유기화합물과 반응 메커니즘"}
   - 상위권 진입을 위해 필요한 단원입니다.
   - 개념 연결과 문제 해결 전략에 집중하세요.

4. 취약점 보완 단원:
   ${subject === "수학" ? "기하와 벡터" : 
   subject === "국어" ? "화법과 작문" : 
   subject === "영어" ? "어휘와 숙어" : 
   "실험 설계와 분석"}
   - 학습자들이 흔히 어려워하는 단원입니다.
   - 기초부터 차근차근 접근하세요.

5. 마무리 단원:
   - 모든 단원의 연결성을 이해하고 종합 문제를 풀어보세요.
   - 실전 모의고사를 통해 전체 단원을 아우르는 연습을 하세요.

${additionalInfo ? `\n맞춤형 학습 조언:\n${additionalInfo}을(를) 고려했을 때, 특히 ${subject === "수학" ? "삼각함수와 정적분" : "독해 전략과 문맥 파악"} 부분에 더 많은 시간을 투자하세요.` : ''}`;

    default:
      return `${subject}에 대한 학습 추천입니다. 더 구체적인 추천을 원하시면 다시 시도해주세요.`;
  }
} 