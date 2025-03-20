import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST와 GET 모두 동일한 초기화 기능을 수행합니다
export async function GET() {
  return handleInitialize();
}

export async function POST() {
  return handleInitialize();
}

// 초기화 로직을 공통 함수로 분리
async function handleInitialize() {
  try {
    // 인증 및 권한 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 관리자 계정을 제외한 모든 데이터 초기화
    console.log("데이터 초기화 시작...");
    
    // 1. AI 추천 삭제 (대소문자 다른 테이블명 모두 시도)
    console.log("AI 추천 데이터 삭제 중...");
    await prisma.aIRecommendation.deleteMany({});
    await prisma.recommendation.deleteMany({});
    await prisma.aiRecommendation.deleteMany({}).catch((e: Error) => console.log("aiRecommendation 테이블 없음"));
    await prisma.AIRecommendation.deleteMany({}).catch((e: Error) => console.log("AIRecommendation 테이블 없음"));
    
    // 2. 학습 계획 삭제
    console.log("학습 계획 데이터 삭제 중...");
    await prisma.studyPlan.deleteMany({});
    
    // 3. 커리큘럼 진행 상황 삭제
    console.log("커리큘럼 진행 상황 삭제 중...");
    await prisma.curriculumProgress.deleteMany({});
    
    // 4. 커리큘럼 삭제
    console.log("커리큘럼 데이터 삭제 중...");
    await prisma.curriculum.deleteMany({});
    
    // 5. 관리자를 제외한 모든 사용자 삭제
    console.log("관리자 외 사용자 삭제 중...");
    await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN"
        }
      }
    });

    console.log("데이터 초기화 완료");
    return NextResponse.json(
      { message: "데이터가 성공적으로 초기화되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("데이터 초기화 오류:", error);
    return NextResponse.json(
      { error: "데이터 초기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 