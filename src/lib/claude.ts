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

    // 학생 학습 패턴 분석을 위한 프롬프트 생성 - 자연어 기반으로 변경
    const prompt = `
당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 
학생 이름: ${user.name}
학생 이메일: ${user.email}

최근 학습 계획 데이터:
${JSON.stringify(studyPlansSummary, null, 2)}

과목별 진도율:
${JSON.stringify(progressSummary, null, 2)}

위 데이터를 분석하여 다음 카테고리별로 학습 추천을 각각 1-2개씩 제공해 주세요:

## STRATEGY
여기에 전반적인 학습 전략 추천을 작성해주세요. 학생의 학습 패턴을 고려한 구체적인 조언을 제공하세요.

## SCHEDULE
여기에 효과적인 학습 스케줄 추천을 작성해주세요. 시간 관리나 학습 계획에 대한 조언을 제공하세요.

## SUBJECT
여기에 특정 과목(들)에 대한 학습 방법 추천을 작성해주세요. 과목명을 명시하고 해당 과목에 대한 구체적인 학습 전략을 제안하세요.

## UNIT
여기에 특정 단원이나 주제에 대한 집중 학습 방법을 작성해주세요. 가능하다면 구체적인 단원명을 언급하고 학습 방법을 제안하세요.

각 추천은 실제 학습 데이터에 기반하여 개인화된 내용이어야 합니다.
실용적이고 구체적인 조언을 제공해주세요.
각 섹션을 명확히 구분하여 작성해주세요.
`;

    console.log('Claude API 호출 시작...');
    
    // Claude API 호출
    try {
      // 5초 후에 타임아웃되는 Promise 생성
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API 요청 타임아웃')), 60000); // 60초 타임아웃
      });

      // API 요청 Promise - JSON 형식 강제를 제거
      const apiRequestPromise = anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // 최신 모델로 변경
        max_tokens: 2000,
        system: "당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 학생의 학습 데이터를 분석하여 개인화된 학습 추천을 제공합니다.",
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      // 둘 중 먼저 완료되는 Promise를 사용
      const message = await Promise.race([apiRequestPromise, timeoutPromise]);
      
      console.log('Claude API 응답 받음');

      // API 응답에서 텍스트 추출
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
      
      // 자연어 응답에서 구조화된 데이터 추출
      const recommendations: Recommendation[] = [];
      
      // STRATEGY 섹션 추출
      const strategyMatch = responseText.match(/## STRATEGY\s+([\s\S]*?)(?=##|$)/);
      if (strategyMatch && strategyMatch[1].trim()) {
        recommendations.push({
          userId,
          type: 'STRATEGY',
          subject: '전체',
          content: strategyMatch[1].trim()
        });
      }
      
      // SCHEDULE 섹션 추출
      const scheduleMatch = responseText.match(/## SCHEDULE\s+([\s\S]*?)(?=##|$)/);
      if (scheduleMatch && scheduleMatch[1].trim()) {
        recommendations.push({
          userId,
          type: 'SCHEDULE',
          subject: '전체',
          content: scheduleMatch[1].trim()
        });
      }
      
      // SUBJECT 섹션 추출
      const subjectMatch = responseText.match(/## SUBJECT\s+([\s\S]*?)(?=##|$)/);
      if (subjectMatch && subjectMatch[1].trim()) {
        // 과목 이름을 추출하려고 시도
        const subjectNameMatch = subjectMatch[1].match(/(\w+)(?:\s*:|에 대한)/);
        const subject = subjectNameMatch ? subjectNameMatch[1] : '전체';
        
        recommendations.push({
          userId,
          type: 'SUBJECT',
          subject: subject,
          content: subjectMatch[1].trim()
        });
      }
      
      // UNIT 섹션 추출
      const unitMatch = responseText.match(/## UNIT\s+([\s\S]*?)(?=##|$)/);
      if (unitMatch && unitMatch[1].trim()) {
        recommendations.push({
          userId,
          type: 'UNIT',
          subject: '전체',
          content: unitMatch[1].trim()
        });
      }
      
      // 추천 항목이 없으면 기본 추천 제공
      if (recommendations.length === 0) {
        return [
          {
            userId,
            type: 'STRATEGY',
            subject: '전체',
            content: '학습 데이터를 분석한 결과, 현재 더 많은 학습 계획이 필요합니다. 규칙적으로 학습하고 계획을 기록해보세요.'
          }
        ];
      }
      
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
          type: 'STRATEGY',
          subject: '전체',
          content: '현재 AI 추천 시스템에 일시적인 문제가 있습니다. 학습 계획에 따라 규칙적으로 학습하고, 복습을 충분히 하시기 바랍니다.'
        },
        {
          userId,
          type: 'SCHEDULE',
          subject: '전체',
          content: '효과적인 학습을 위해 각 과목별로 시간을 배분하고, 집중력이 높은 시간대에 어려운 과목을 공부하세요.'
        }
      ];
    }
  } catch (error) {
    console.error('Claude API 추천 생성 중 오류 발생:', error);
    // 오류 발생 시 기본 추천 제공
    return [
      {
        userId,
        type: 'STRATEGY',
        subject: '전체',
        content: '학습 데이터를 분석하는 중 오류가 발생했습니다. 균형 잡힌 학습 계획을 수립하고 규칙적으로 학습하세요. 자세한 내용은 선생님과 상담하는 것이 좋겠습니다.'
      },
      {
        userId,
        type: 'SUBJECT',
        subject: '전체',
        content: '학습에 어려움이 있는 과목이 있다면, 해당 과목의 기초부터 천천히 다시 학습해보세요. 기초가 탄탄해야 응용 문제도 해결할 수 있습니다.'
      }
    ];
  }
} 