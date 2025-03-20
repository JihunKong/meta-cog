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
    console.log(`[generateClaudeRecommendations] 시작: 사용자 ID ${userId}`);
    
    // 제공된 userId가 없거나 유효하지 않은 경우를 명시적으로 체크
    if (!userId || userId.trim() === '') {
      console.error('[generateClaudeRecommendations] 유효하지 않은 userId:', userId);
      throw new Error('유효한 사용자 ID가 필요합니다.');
    }
    
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

    console.log('학습 계획 데이터 수:', recentStudyPlans.length);
    console.log('과목별 진도 데이터 수:', subjectProgress.length);

    // 학습 데이터가 없으면 기본 메시지 반환
    if (recentStudyPlans.length === 0 && subjectProgress.length === 0) {
      console.log(`[generateClaudeRecommendations] 학습 데이터 없음, 기본 추천 생성 (사용자 ID: ${userId})`);
      return [{
        userId,
        subject: '전체',
        content: '아직 학습 데이터가 충분하지 않습니다. 학습 계획을 등록하고 과목별 진도를 기록하면 맞춤형 AI 추천을 받을 수 있습니다.',
        type: 'STRATEGY',
      }];
    }

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
    console.log('사용 모델: claude-3-5-sonnet-20241022');
    
    // Claude API 호출
    try {
      // 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API 요청 타임아웃')), 60000); // 60초 타임아웃
      });

      // API 요청 준비
      const apiRequestPromise = anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // 최신 모델로 변경
        max_tokens: 2000,
        system: "당신은 청해FLAME 자기주도학습 관리 시스템의 AI 학습 조언자입니다. 학생의 학습 데이터를 분석하여 개인화된 학습 추천을 제공합니다.",
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      console.log('API 요청 시작 시간:', new Date().toISOString());

      // 둘 중 먼저 완료되는 Promise를 사용
      const message = await Promise.race([apiRequestPromise, timeoutPromise]);
      
      console.log('Claude API 응답 받음 -', new Date().toISOString());

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
      
      // 자연어 응답에서 구조화된 데이터 추출 - 강화된 정규식 사용
      const recommendations: Recommendation[] = [];
      
      console.log('응답 텍스트에서 추천 추출 시작');
      
      // 섹션 추출 함수를 강화
      const extractSection = (text: string, sectionName: string): string | null => {
        const patterns = [
          new RegExp(`## ${sectionName}\\s+((?:.|\\s)*?)(?=^##|$)`, 'mi'),
          new RegExp(`${sectionName}:\\s*((?:.|\\s)*?)(?=^[A-Z]+:|$)`, 'mi'),
          new RegExp(`${sectionName}\\s*((?:.|\\s)*?)(?=^[A-Z]+[:\\s]|$)`, 'mi')
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1] && match[1].trim()) {
            return match[1].trim();
          }
        }
        
        return null;
      };
      
      // STRATEGY 섹션 추출
      const strategyContent = extractSection(responseText, 'STRATEGY');
      if (strategyContent) {
        console.log(`[generateClaudeRecommendations] STRATEGY 섹션 추출 성공 (사용자 ID: ${userId})`);
        recommendations.push({
          userId,
          type: 'STRATEGY',
          subject: '전체',
          content: strategyContent
        });
      } else {
        console.log(`[generateClaudeRecommendations] STRATEGY 섹션을 찾을 수 없습니다 (사용자 ID: ${userId})`);
      }
      
      // SCHEDULE 섹션 추출
      const scheduleContent = extractSection(responseText, 'SCHEDULE');
      if (scheduleContent) {
        console.log('SCHEDULE 섹션 추출 성공:', scheduleContent.substring(0, 50) + '...');
        recommendations.push({
          userId,
          type: 'SCHEDULE',
          subject: '전체',
          content: scheduleContent
        });
      } else {
        console.log('SCHEDULE 섹션을 찾을 수 없습니다.');
      }
      
      // SUBJECT 섹션 추출
      const subjectContent = extractSection(responseText, 'SUBJECT');
      if (subjectContent) {
        // 과목 이름을 추출하려고 시도 - 한글 문자 지원 추가
        const subjectNameMatch = subjectContent.match(/([가-힣a-zA-Z0-9]+)(?:\s*:|에 대한)/);
        const subject = subjectNameMatch ? subjectNameMatch[1] : '전체';
        
        console.log('SUBJECT 섹션 추출 성공:', subject, subjectContent.substring(0, 50) + '...');
        recommendations.push({
          userId,
          type: 'SUBJECT',
          subject: subject,
          content: subjectContent
        });
      } else {
        console.log('SUBJECT 섹션을 찾을 수 없습니다.');
      }
      
      // UNIT 섹션 추출
      const unitContent = extractSection(responseText, 'UNIT');
      if (unitContent) {
        console.log('UNIT 섹션 추출 성공:', unitContent.substring(0, 50) + '...');
        recommendations.push({
          userId,
          type: 'UNIT',
          subject: '전체',
          content: unitContent
        });
      } else {
        console.log('UNIT 섹션을 찾을 수 없습니다.');
      }
      
      // 추천 항목이 없으면 기본 추천 제공
      if (recommendations.length === 0) {
        console.log(`[generateClaudeRecommendations] 추출된 추천 없음, 기본 추천 생성 (사용자 ID: ${userId})`);
        
        // 대안 1: 전체 응답을 하나의 STRATEGY 추천으로 사용
        if (responseText.trim().length > 0) {
          console.log(`[generateClaudeRecommendations] 전체 응답을 STRATEGY 추천으로 사용 (사용자 ID: ${userId})`);
          recommendations.push({
            userId,
            type: 'STRATEGY',
            subject: '전체',
            content: responseText.trim()
          });
        } else {
          // 대안 2: 기본 메시지 사용
          console.log('기본 메시지를 사용합니다.');
          recommendations.push({
            userId,
            type: 'STRATEGY',
            subject: '전체',
            content: '학습 데이터를 분석한 결과, 현재 더 많은 학습 계획이 필요합니다. 규칙적으로 학습하고 계획을 기록해보세요.'
          });
        }
      }
      
      console.log('생성된 추천 항목 수:', recommendations.length);
      return recommendations;
    } catch (apiError) {
      console.error('Claude API 호출 오류:', apiError);
      
      // 오류의 세부 정보 로깅
      if (apiError instanceof Error) {
        console.error('오류 메시지:', apiError.message);
        console.error('오류 스택:', apiError.stack);
        
        // API 키 관련 오류 메시지 처리
        if (apiError.message.includes('invalid_api_key') || 
            apiError.message.includes('auth') || 
            apiError.message.includes('authentication')) {
          return [{
            userId,
            type: 'STRATEGY',
            subject: '전체',
            content: 'API 키가 유효하지 않습니다. 관리자에게 문의하여 올바른 Claude API 키를 설정해주세요.',
          }];
        }
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