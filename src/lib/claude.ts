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
      // 5초 후에 타임아웃되는 Promise 생성
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API 요청 타임아웃')), 60000); // 60초 타임아웃
      });

      // API 요청 Promise
      const apiRequestPromise = anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        temperature: 0.7, // 온도 값을 낮춰 더 결정적인 응답 생성
        system: "당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 학생의 학습 데이터를 분석하여 개인화된 학습 추천을 제공합니다. 반드시 JSON 형식으로만 응답해야 합니다.",
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      // 둘 중 먼저 완료되는 Promise를 사용
      const message = await Promise.race([apiRequestPromise, timeoutPromise]);
      
      console.log('Claude API 응답 받음');

      // API 응답에서 JSON 추출
      let responseText = '';
      for (const block of message.content) {
        if (block.type === 'text') {
          responseText += block.text;
        }
      }
      
      console.log('응답 텍스트 길이:', responseText.length);
      
      // 디버깅을 위해 응답 텍스트의 일부를 로깅 (너무 길면 잘라서)
      if (responseText.length > 0) {
        console.log('응답 텍스트 샘플:', responseText.substring(0, Math.min(500, responseText.length)));
      } else {
        console.error('빈 응답 텍스트를 받았습니다.');
        throw new Error('API에서 빈 응답을 받았습니다.');
      }
      
      // 응답에서 JSON 추출
      const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/g;
      const jsonMatch = responseText.match(jsonRegex);
      
      if (!jsonMatch) {
        console.error('API 응답에서 JSON을 찾을 수 없습니다:', responseText);
        // JSON이 없는 경우 기본 추천 제공
        return [
          {
            userId,
            subject: '전체',
            content: '학습 데이터를 분석하는 중 오류가 발생했습니다. 현재 데이터를 기반으로 균형 잡힌 학습 계획을 수립하고 규칙적으로 학습하는 것이 좋겠습니다.',
            type: 'STRATEGY',
          },
          {
            userId,
            subject: '전체',
            content: '각 과목별로 복습 시간을 따로 배정하고, 일일 학습 계획을 수립하여 꾸준히 진행하세요.',
            type: 'SCHEDULE',
          }
        ];
      }
      
      // JSON 파싱
      let recommendationsData;
      try {
        console.log('파싱할 JSON:', jsonMatch[0]);
        recommendationsData = JSON.parse(jsonMatch[0]);
        console.log('파싱된 추천 수:', recommendationsData.length);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, '원본 텍스트:', jsonMatch[0]);
        // 파싱 실패 시 기본 추천 제공
        return [
          {
            userId,
            subject: '전체',
            content: '추천 데이터 처리 중 오류가 발생했습니다. 학습 내용을 복습하고 어려운 부분은 선생님께 질문하는 것이 좋겠습니다.',
            type: 'STRATEGY',
          }
        ];
      }
      
      // 빈 배열이거나 유효하지 않은 데이터인지 확인
      if (!Array.isArray(recommendationsData) || recommendationsData.length === 0) {
        console.error('유효하지 않은 추천 데이터:', recommendationsData);
        return [
          {
            userId,
            subject: '전체',
            content: '추천을 생성할 데이터가 충분하지 않습니다. 더 많은 학습 계획을 등록한 후 다시 시도해 보세요.',
            type: 'STRATEGY',
          }
        ];
      }
      
      // Recommendation 객체로 변환
      const recommendations: Recommendation[] = recommendationsData.map((rec: any) => ({
        userId,
        subject: rec.subject || '전체',
        content: rec.content || '추천 내용이 제공되지 않았습니다.',
        type: rec.type as RecommendationType || 'STRATEGY',
      }));
      
      console.log('생성된 추천 항목 수:', recommendations.length);
      return recommendations;
    } catch (apiError) {
      console.error('Claude API 호출 오류:', apiError);
      
      // 오류의 세부 정보 로깅
      if (apiError instanceof Error) {
        console.error('오류 메시지:', apiError.message);
        console.error('오류 스택:', apiError.stack);
      }
      
      // 어떤 에러가 발생하더라도 유용한 기본 추천 제공
      return [
        {
          userId,
          subject: '전체',
          content: '현재 AI 추천 시스템에 일시적인 문제가 있습니다. 학습 계획에 따라 규칙적으로 학습하고, 복습을 충분히 하시기 바랍니다.',
          type: 'STRATEGY',
        },
        {
          userId,
          subject: '전체',
          content: '효과적인 학습을 위해 각 과목별로 시간을 배분하고, 집중력이 높은 시간대에 어려운 과목을 공부하세요.',
          type: 'SCHEDULE',
        }
      ];
    }
  } catch (error) {
    console.error('Claude API 추천 생성 중 오류 발생:', error);
    // 오류 발생 시 기본 추천 제공
    return [
      {
        userId,
        subject: '전체',
        content: '학습 데이터를 분석하는 중 오류가 발생했습니다. 균형 잡힌 학습 계획을 수립하고 규칙적으로 학습하세요. 자세한 내용은 선생님과 상담하는 것이 좋겠습니다.',
        type: 'STRATEGY',
      },
    ];
  }
} 