// 부정행위 방지 시스템

export interface SessionValidationResult {
  isValid: boolean;
  warnings: string[];
  adjustedScore?: number;
}

export interface FraudDetectionConfig {
  maxSessionsPerDay: number;          // 하루 최대 세션 수
  minSessionInterval: number;         // 세션 간 최소 간격 (분)
  maxDailyStudyHours: number;        // 하루 최대 학습 시간
  minReflectionLength: number;        // 최소 반성 글자 수
  suspiciousPatternThreshold: number; // 의심스러운 패턴 임계값
}

const DEFAULT_CONFIG: FraudDetectionConfig = {
  maxSessionsPerDay: 3,
  minSessionInterval: 30, // 30분
  maxDailyStudyHours: 8,
  minReflectionLength: 20,
  suspiciousPatternThreshold: 0.8
};

// 1. 세션 유효성 검증
export const validateSession = (
  session: any,
  previousSessions: any[],
  config: FraudDetectionConfig = DEFAULT_CONFIG
): SessionValidationResult => {
  const warnings: string[] = [];
  let isValid = true;

  // 오늘 날짜의 세션들 필터링
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySessions = previousSessions.filter(s => {
    const sessionDate = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  // 1-1. 하루 최대 세션 수 체크
  if (todaySessions.length >= config.maxSessionsPerDay) {
    warnings.push(`하루 최대 ${config.maxSessionsPerDay}개 세션만 허용됩니다.`);
    isValid = false;
  }

  // 1-2. 세션 간 최소 간격 체크
  const lastSession = previousSessions
    .sort((a, b) => {
      const aTime = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
      const bTime = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
      return bTime - aTime;
    })[0];

  if (lastSession) {
    const lastSessionTime = lastSession.created_at?.toDate ? lastSession.created_at.toDate() : new Date(lastSession.created_at);
    const currentTime = new Date();
    const timeDiff = (currentTime.getTime() - lastSessionTime.getTime()) / (1000 * 60); // 분 단위

    if (timeDiff < config.minSessionInterval) {
      warnings.push(`이전 세션과 최소 ${config.minSessionInterval}분 간격이 필요합니다.`);
      isValid = false;
    }
  }

  // 1-3. 하루 총 학습 시간 체크
  const todayTotalMinutes = todaySessions.reduce((total, s) => total + (s.duration || 0), 0);
  const proposedTotalHours = (todayTotalMinutes + (session.duration || 0)) / 60;

  if (proposedTotalHours > config.maxDailyStudyHours) {
    warnings.push(`하루 최대 학습 시간(${config.maxDailyStudyHours}시간)을 초과했습니다.`);
    isValid = false;
  }

  // 1-4. 반성 최소 길이 체크
  if (session.reflection && session.reflection.trim().length < config.minReflectionLength) {
    warnings.push(`반성은 최소 ${config.minReflectionLength}자 이상 작성해주세요.`);
  }

  return { isValid, warnings };
};

// 2. 의심스러운 패턴 탐지
export const detectSuspiciousPatterns = (
  sessions: any[],
  config: FraudDetectionConfig = DEFAULT_CONFIG
): {
  suspiciousLevel: number; // 0-1 사이의 값
  patterns: string[];
} => {
  const patterns: string[] = [];
  let suspiciousScore = 0;
  const maxScore = 100;

  // 2-1. 반복적인 동일 시간대 학습 패턴
  const sessionTimes = sessions.map(s => {
    const date = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
    return date.getHours();
  });

  const timeDistribution = sessionTimes.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxTimeFrequency = Math.max(...Object.values(timeDistribution));
  if (maxTimeFrequency / sessions.length > 0.8) {
    patterns.push('항상 같은 시간대에 학습');
    suspiciousScore += 20;
  }

  // 2-2. 반성 내용 유사성 체크
  const reflections = sessions
    .filter(s => s.reflection && s.reflection.trim().length > 0)
    .map(s => s.reflection.trim().toLowerCase());

  if (reflections.length > 3) {
    const duplicateCount = reflections.length - new Set(reflections).size;
    if (duplicateCount / reflections.length > 0.5) {
      patterns.push('반성 내용이 너무 유사함');
      suspiciousScore += 30;
    }
  }

  // 2-3. 비현실적인 집중도 패턴
  const achievements = sessions
    .filter(s => s.percent !== undefined)
    .map(s => s.percent);

  if (achievements.length > 5) {
    const perfectSessions = achievements.filter(p => p >= 95).length;
    if (perfectSessions / achievements.length > 0.8) {
      patterns.push('비현실적으로 높은 집중도');
      suspiciousScore += 25;
    }
  }

  // 2-4. 연속적인 최대 시간 학습
  const maxSessionsInRow = sessions.filter(s => (s.duration || 0) >= 180).length; // 3시간 이상
  if (maxSessionsInRow > sessions.length * 0.7) {
    patterns.push('지나치게 긴 학습 시간이 연속됨');
    suspiciousScore += 25;
  }

  return {
    suspiciousLevel: Math.min(1, suspiciousScore / maxScore),
    patterns
  };
};

// 3. 점수 조정 로직
export const adjustScoreForSuspiciousActivity = (
  originalScore: number,
  suspiciousLevel: number,
  config: FraudDetectionConfig = DEFAULT_CONFIG
): number => {
  if (suspiciousLevel < config.suspiciousPatternThreshold) {
    return originalScore;
  }

  // 의심스러운 정도에 따라 점수 감점
  const penaltyMultiplier = 1 - (suspiciousLevel * 0.5); // 최대 50% 감점
  return Math.round(originalScore * penaltyMultiplier);
};

// 4. 실시간 부정행위 모니터링
export const monitorRealTimeActivity = (
  userId: string,
  sessions: any[]
): {
  alertLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  
  // 최근 24시간 활동 분석
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);
  
  const recentSessions = sessions.filter(s => {
    const sessionDate = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at);
    return sessionDate >= last24Hours;
  });

  let alertLevel: 'low' | 'medium' | 'high' = 'low';

  // 급격한 활동 증가
  if (recentSessions.length > 10) {
    alertLevel = 'high';
    recommendations.push('비정상적으로 많은 세션이 기록되었습니다.');
  } else if (recentSessions.length > 6) {
    alertLevel = 'medium';
    recommendations.push('오늘 많은 활동이 있었습니다. 적절한 휴식을 권장합니다.');
  }

  // 짧은 시간 간격 세션들
  const shortIntervals = recentSessions.filter((session, index) => {
    if (index === 0) return false;
    
    const currentTime = session.created_at?.toDate ? session.created_at.toDate() : new Date(session.created_at);
    const prevTime = recentSessions[index - 1].created_at?.toDate ? 
      recentSessions[index - 1].created_at.toDate() : 
      new Date(recentSessions[index - 1].created_at);
    
    const diff = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
    return diff < 15; // 15분 미만
  });

  if (shortIntervals.length > 3) {
    alertLevel = alertLevel === 'high' ? 'high' : 'medium';
    recommendations.push('세션 간격이 너무 짧습니다. 충분한 학습 시간을 가지세요.');
  }

  return { alertLevel, recommendations };
};

// 5. 교사용 의심스러운 학생 목록
export const flagSuspiciousStudents = (
  studentStats: Record<string, { sessions: any[] }>,
  config: FraudDetectionConfig = DEFAULT_CONFIG
): Array<{
  userId: string;
  suspiciousLevel: number;
  issues: string[];
}> => {
  const suspiciousStudents: Array<{
    userId: string;
    suspiciousLevel: number;
    issues: string[];
  }> = [];

  Object.entries(studentStats).forEach(([userId, stats]) => {
    const { suspiciousLevel, patterns } = detectSuspiciousPatterns(stats.sessions, config);
    
    if (suspiciousLevel >= config.suspiciousPatternThreshold) {
      suspiciousStudents.push({
        userId,
        suspiciousLevel,
        issues: patterns
      });
    }
  });

  return suspiciousStudents.sort((a, b) => b.suspiciousLevel - a.suspiciousLevel);
};