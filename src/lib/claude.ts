import Anthropic from '@anthropic-ai/sdk';
import { Recommendation } from './ai-model';
import { RecommendationType } from '@/types';

// API 키 유효성 검사
const apiKey = process.env.ANTHROPIC_API_KEY || '';
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY가 설정되지 않았습니다. 환경 변수를 확인하세요.');
}

// Anthropic API 클라이언트 생성
const anthropic = new Anthropic({
  apiKey: apiKey,
});

interface StudyData {
  recentStudyPlans: any[];
  subjectProgress: any[];
  user: {
    name: string;
    email: string;
  };
}

/**
 * Claude Sonnet을 사용하여 개인화된 학습 추천을 생성합니다.
 */
export async function generateClaudeRecommendations(
  userId: string,
  studyData: StudyData
): Promise<Recommendation[]> {
  try {
    // API 키가 없으면 오류 메시지 반환
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
      return [{
        userId,
        subject: '전체',
        content: 'API 키가 설정되지 않아 AI 추천을 생성할 수 없습니다. 관리자에게 문의하세요.',
        type: 'STRATEGY',
      }];
    }

    const { recentStudyPlans, subjectProgress, user } = studyData;

    // 학습 계획 데이터 가공
    const studyPlansSummary = recentStudyPlans.map(plan => ({
      subject: plan.subject,
      content: plan.content,
      target: plan.target,
      achievement: plan.achievement,
      achievementRate: plan.target > 0 ? Math.round((plan.achievement / plan.target) * 100) : 0,
      date: plan.date
    }));

    // 과목별 진도 데이터 가공
    const progressSummary = subjectProgress.map(progress => ({
      subject: progress.subject,
      completedUnits: progress.completedUnits,
      totalUnits: progress.totalUnits,
      progressRate: progress.totalUnits > 0 ? 
        Math.round((progress.completedUnits / progress.totalUnits) * 100) : 0
    }));

    // 학생 학습 패턴 분석을 위한 프롬프트 생성
    const prompt = `
당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 
학생 이름: ${user.name}
학생 이메일: ${user.email}

최근 학습 계획 데이터:
${JSON.stringify(studyPlansSummary, null, 2)}

과목별 진도율:
${JSON.stringify(progressSummary, null, 2)}

위 데이터를 분석하여 다음 카테고리별로 학습 추천을 각각 1-2개씩 제공해 주세요:
1. STRATEGY: 전반적인 학습 전략 추천
2. SCHEDULE: 효과적인 학습 스케줄 추천
3. SUBJECT: 특정 과목에 대한 학습 방법 추천
4. UNIT: 특정 단원에 대한 집중 학습 방법

각 추천은 실제 학습 데이터에 기반하여 개인화된 내용이어야 합니다.
실용적이고 구체적인 조언을 제공해주세요.
추천은 다음과 같은 JSON 형식으로만 응답해주세요:

[
  {
    "type": "STRATEGY",
    "subject": "전체",
    "content": "조언 내용"
  },
  ...
]
`;

    console.log('Claude API 호출 시작...');
    
    // Claude API 호출
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7sonnet-20250229', // 모델 버전 변경
        max_tokens: 2000,
        system: "당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 학생의 학습 데이터를 분석하여 개인화된 학습 추천을 제공합니다.",
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      console.log('Claude API 응답 받음');

      // API 응답에서 JSON 추출
      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText += block.text;
        }
      }
      
      // 응답에서 JSON 추출
      const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/g;
      const jsonMatch = responseText.match(jsonRegex);
      
      if (!jsonMatch) {
        console.error('API 응답:', responseText);
        throw new Error('API 응답에서 JSON 추천 데이터를 찾을 수 없습니다.');
      }
      
      // JSON 파싱
      let recommendationsData;
      try {
        recommendationsData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, '원본 텍스트:', jsonMatch[0]);
        throw new Error('추천 데이터를 파싱하는 중 오류가 발생했습니다.');
      }
      
      // Recommendation 객체로 변환
      const recommendations: Recommendation[] = recommendationsData.map((rec: any) => ({
        userId,
        subject: rec.subject || '전체',
        content: rec.content,
        type: rec.type as RecommendationType,
      }));
      
      return recommendations;
    } catch (apiError) {
      console.error('Claude API 호출 오류:', apiError);
      throw new Error('Claude API 호출 중 오류가 발생했습니다.');
    }
  } catch (error) {
    console.error('Claude API 추천 생성 중 오류 발생:', error);
    // 오류 발생 시 기본 추천 제공
    return [
      {
        userId,
        subject: '전체',
        content: '학습 데이터를 분석하는 중 오류가 발생했습니다. 균형 잡힌 학습 계획을 수립하고 규칙적으로 학습하세요. 오류 내용: ' + (error instanceof Error ? error.message : '알 수 없는 오류'),
        type: 'STRATEGY',
      },
    ];
  }
} 