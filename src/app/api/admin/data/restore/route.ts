import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
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

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 백업 파일 처리
    const formData = await request.formData();
    const backupFile = formData.get("backupFile") as File;
    
    if (!backupFile) {
      return NextResponse.json(
        { error: "백업 파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 내용 읽기
    const fileContent = await backupFile.text();
    let backupData;
    
    try {
      backupData = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: "유효하지 않은 백업 파일 형식입니다." },
        { status: 400 }
      );
    }

    // 백업 데이터 유효성 검사
    if (!backupData.metadata || !backupData.data) {
      return NextResponse.json(
        { error: "유효하지 않은 백업 데이터 구조입니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 데이터 복원
    await prisma.$transaction(async (tx) => {
      // 1. 기존 데이터 삭제 (관리자 계정 제외)
      await tx.aIRecommendation.deleteMany({});
      await tx.studyPlan.deleteMany({});
      await tx.curriculum.deleteMany({});
      await tx.user.deleteMany({
        where: {
          role: {
            not: UserRole.ADMIN
          }
        }
      });

      // 2. 백업 데이터 복원
      // 2.1 사용자 복원 (관리자 제외)
      const nonAdminUsers = backupData.data.users.filter(
        (u: any) => u.role !== UserRole.ADMIN
      );
      
      for (const userData of nonAdminUsers) {
        // ID 충돌 방지를 위해 ID 필드 제거
        const { id, ...userDataWithoutId } = userData;
        
        await tx.user.create({
          data: {
            ...userDataWithoutId,
            // 날짜 필드가 문자열로 저장되었을 수 있으므로 Date 객체로 변환
            createdAt: new Date(userDataWithoutId.createdAt),
            updatedAt: new Date(userDataWithoutId.updatedAt),
          },
        });
      }

      // 2.2 커리큘럼 복원
      for (const curriculumData of backupData.data.curriculums) {
        const { id, createdAt, updatedAt, ...curriculumDataWithoutId } = curriculumData;
        
        await tx.curriculum.create({
          data: {
            ...curriculumDataWithoutId,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        });
      }

      // 2.3 학습 계획 복원
      for (const studyPlanData of backupData.data.studyPlans) {
        const { id, createdAt, updatedAt, ...studyPlanDataWithoutId } = studyPlanData;
        
        await tx.studyPlan.create({
          data: {
            ...studyPlanDataWithoutId,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        });
      }

      // 2.4 AI 추천 복원
      for (const aiRecommendationData of backupData.data.aiRecommendations) {
        const { id, createdAt, updatedAt, ...aiRecommendationDataWithoutId } = aiRecommendationData;
        
        await tx.aIRecommendation.create({
          data: {
            ...aiRecommendationDataWithoutId,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        });
      }
    });

    return NextResponse.json(
      { message: "데이터가 성공적으로 복원되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("데이터 복원 오류:", error);
    return NextResponse.json(
      { error: "데이터 복원 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 