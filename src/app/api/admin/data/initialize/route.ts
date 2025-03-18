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
    // 1. AI 추천 삭제
    await prisma.aIRecommendation.deleteMany({});
    
    // 2. 학습 계획 삭제
    await prisma.studyPlan.deleteMany({});
    
    // 3. 커리큘럼 삭제
    await prisma.curriculum.deleteMany({});
    
    // 4. 관리자를 제외한 모든 사용자 삭제
    await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN"
        }
      }
    });

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