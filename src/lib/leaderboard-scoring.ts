// 리더보드 점수 계산 라이브러리

// 1. 일관성 점수 계산
export const calculateConsistencyScore = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;
  
  // 최근 30일 내 세션들만 고려
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSessions = sessions.filter(session => {
    const sessionDate = session.created_at instanceof Date ? session.created_at : new Date(session.created_at);
    return sessionDate >= thirtyDaysAgo;
  });
  
  // 학습한 날짜들 추출
  const studyDates = new Set(
    recentSessions.map(session => {
      const date = session.created_at instanceof Date ? session.created_at : new Date(session.created_at);
      return date.toDateString();
    })
  );
  
  const studyDaysCount = studyDates.size;
  const maxPossibleDays = Math.min(30, Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)));
  
  // 학습한 날짜 비율 × 100점
  return Math.min(100, Math.round((studyDaysCount / maxPossibleDays) * 100));
};

// 2. 품질 점수 계산 (성취도 제외)
export const calculateQualityScore = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;
  
  let qualityPoints = 0;
  let maxPoints = 0;
  
  sessions.forEach(session => {
    maxPoints += 100; // 세션당 최대 100점
    
    // 반성 내용이 있는지 (30점)
    if (session.reflection && session.reflection.trim().length > 0) {
      qualityPoints += 30;
      
      // 반성 내용의 길이와 품질 (50점)
      const reflectionLength = session.reflection.trim().length;
      if (reflectionLength >= 20) { // 최소 20자 이상
        let lengthScore = Math.min(30, Math.floor(reflectionLength / 10)); // 10글자당 1점, 최대 30점
        qualityPoints += lengthScore;
        
        // 키워드 기반 품질 평가 (20점)
        const qualityKeywords = ['어려웠다', '배웠다', '느꼈다', '생각한다', '개선', '부족', '노력', '집중', '이해'];
        const foundKeywords = qualityKeywords.filter(keyword => 
          session.reflection.includes(keyword)
        ).length;
        qualityPoints += Math.min(20, foundKeywords * 3);
      }
    }
    
    // 세션 설명의 구체성 (20점)
    if (session.description && session.description.trim().length >= 10) {
      qualityPoints += 20;
    }
  });
  
  return maxPoints > 0 ? Math.round((qualityPoints / maxPoints) * 100) : 0;
};

// 3. 참여도 점수 계산 (하루 최대 3세션만 인정)
export const calculateEngagementScore = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;
  
  // 날짜별로 세션 그룹화
  const sessionsByDate = new Map<string, any[]>();
  
  sessions.forEach(session => {
    const date = session.created_at instanceof Date ? session.created_at : new Date(session.created_at);
    const dateKey = date.toDateString();
    
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  });
  
  // 각 날짜별로 최대 3세션만 인정
  let validSessionCount = 0;
  sessionsByDate.forEach(daySessions => {
    validSessionCount += Math.min(3, daySessions.length);
  });
  
  // 총 유효 세션 수에 따른 점수 (최대 100점)
  // 30세션 이상이면 만점
  return Math.min(100, Math.round((validSessionCount / 30) * 100));
};

// 4. 연속 학습 스트릭 계산
export const calculateStreakScore = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;
  
  // 날짜별로 정렬
  const studyDates = [...new Set(
    sessions.map(session => {
      const date = session.created_at instanceof Date ? session.created_at : new Date(session.created_at);
      return date.toDateString();
    })
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let currentStreak = 0;
  let maxStreak = 0;
  let previousDate = new Date();
  
  for (let i = 0; i < studyDates.length; i++) {
    const currentDate = new Date(studyDates[i]);
    const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (i === 0 || diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    
    previousDate = currentDate;
  }
  
  // 연속 학습일에 따른 점수 (7일 이상이면 만점)
  return Math.min(100, Math.round((maxStreak / 7) * 100));
};

// 전체 점수 계산 (메인 함수)
export const calculateImprovedScore = (sessions: any[]) => {
  const consistencyScore = calculateConsistencyScore(sessions);
  const qualityScore = calculateQualityScore(sessions);
  const engagementScore = calculateEngagementScore(sessions);
  const streakScore = calculateStreakScore(sessions);
  
  const totalScore = Math.round(
    (consistencyScore * 0.4) + 
    (qualityScore * 0.35) + 
    (engagementScore * 0.15) + 
    (streakScore * 0.1)
  );

  return {
    score: totalScore,
    breakdown: {
      consistency: consistencyScore,
      quality: qualityScore,
      engagement: engagementScore,
      streak: streakScore
    }
  };
};

// 점수 등급 계산
export const getScoreGrade = (score: number): {
  grade: string;
  color: string;
  description: string;
} => {
  if (score >= 90) {
    return {
      grade: 'S',
      color: '#FFD700',
      description: '최고 등급! 완벽한 학습 습관'
    };
  } else if (score >= 80) {
    return {
      grade: 'A',
      color: '#FF6B6B',
      description: '우수! 꾸준한 학습자'
    };
  } else if (score >= 70) {
    return {
      grade: 'B',
      color: '#4ECDC4',
      description: '양호! 조금 더 노력해요'
    };
  } else if (score >= 60) {
    return {
      grade: 'C',
      color: '#45B7D1',
      description: '보통! 더 꾸준히 해봅시다'
    };
  } else {
    return {
      grade: 'D',
      color: '#96CEB4',
      description: '시작이 반! 꾸준히 노력하세요'
    };
  }
};

// 개선 제안 생성
export const getImprovementSuggestions = (breakdown: {
  consistency: number;
  quality: number;
  engagement: number;
  streak: number;
}): string[] => {
  const suggestions: string[] = [];
  
  if (breakdown.consistency < 60) {
    suggestions.push('📅 매일 조금씩이라도 꾸준히 학습해보세요');
  }
  
  if (breakdown.quality < 60) {
    suggestions.push('✍️ 학습 후 더 자세한 반성을 작성해보세요');
  }
  
  if (breakdown.engagement < 60) {
    suggestions.push('📚 적정한 수준의 학습 세션을 늘려보세요');
  }
  
  if (breakdown.streak < 60) {
    suggestions.push('🔥 연속 학습일을 늘려 습관을 만들어보세요');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('🎉 완벽합니다! 현재 패턴을 유지하세요');
  }
  
  return suggestions;
};