import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ApiError, successResponse, errorResponse } from "@/lib/api-utils";

// 요청 스키마 정의
const customRecommendationSchema = z.object({
  type: z.string().min(1, "추천 유형을 선택해주세요"),
  subject: z.string().min(1, "과목을 선택해주세요"),
  prompt: z.string().optional(),
});

// 추천 유형별 제목 및 기본 콘텐츠
const typeTemplates = {
  STRATEGY: {
    title: "맞춤형 학습 전략 추천",
    content: `
### 학습 전략 추천
1. 기초 개념부터 차근차근 학습하세요.
2. 매일 30분 이상 꾸준히 학습하는 것이 중요합니다.
3. 문제 풀이와 개념 이해를 균형있게 진행하세요.
4. 모르는 부분은 즉시 질문하고 해결하세요.
5. 주기적으로 복습하여 학습 내용을 강화하세요.
    `
  },
  SCHEDULE: {
    title: "최적화된 학습 일정 추천",
    content: `
### 주간 학습 일정
- 월요일: 개념 학습 (40분)
- 화요일: 기본 문제 풀이 (30분)
- 수요일: 심화 학습 (40분)
- 목요일: 응용 문제 풀이 (30분)
- 금요일: 주간 복습 (40분)
- 주말: 부족한 부분 보충 (60분)
    `
  },
  SUBJECT: {
    title: "맞춤형 과목 추천",
    content: `
### 추천 학습 내용
1. 핵심 개념 정리
2. 기출 문제 분석
3. 오답 노트 작성
4. 개념 연결 학습
5. 실생활 적용 예시 학습
    `
  },
  UNIT: {
    title: "단원별 학습 방법 추천",
    content: `
### 단원 학습 방법
1. 개념 이해: 교과서 내용 꼼꼼히 읽기
2. 기본 문제: 기초 개념 적용 문제 풀이
3. 심화 학습: 관련 보충 자료 학습
4. 응용 문제: 다양한 유형의 문제 풀이
5. 오답 분석: 틀린 문제 원인 파악 및 재학습
    `
  }
};

export async function POST(request: Request) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "인증이 필요합니다");
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 데이터 유효성 검증
    const validationResult = customRecommendationSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("유효성 검증 오류:", validationResult.error.format());
      throw new ApiError(400, "유효하지 않은 요청 데이터: " + JSON.stringify(validationResult.error.errors));
    }
    
    const { type, subject, prompt } = validationResult.data;
    
    // 템플릿 가져오기
    const template = typeTemplates[type as keyof typeof typeTemplates];
    if (!template) {
      throw new ApiError(400, "지원하지 않는 추천 유형입니다");
    }
    
    // 추천 내용 생성
    let content = `## ${template.title} - ${subject}`;
    
    // 사용자 프롬프트가 있으면 추가
    if (prompt) {
      content += `\n\n### 사용자 요청 사항\n${prompt}`;
    }
    
    // 기본 템플릿 콘텐츠 추가
    content += `\n${template.content}`;

    // 추천 데이터베이스에 저장
    const recommendation = await prisma.aIRecommendation.create({
      data: {
        user_id: session.user.id,
        subject,
        content,
        type,
      },
    });

    return successResponse(recommendation, 201);
  } catch (error) {
    console.error("맞춤 추천 생성 오류:", error);
    return errorResponse(error as Error);
  }
} 