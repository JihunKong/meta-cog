import * as tf from "@tensorflow/tfjs";
import { PrismaClient } from "@prisma/client";
import { RecommendationType } from "@/types";

interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  content: string;
  target: number;
  achievement: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Curriculum {
  id: string;
  subject: string;
  unit: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface AchievementData {
  subject: string;
  achievementRate: number;
  totalMinutes: number;
}

interface SubjectProgress {
  subject: string;
  completedUnits: number;
  totalUnits: number;
}

export interface Recommendation {
  userId: string;
  subject: string;
  content: string;
  type: RecommendationType;
}

/**
 * 학습 계획 데이터를 분석하여 성취율 데이터를 생성합니다.
 */
function analyzeAchievementRates(studyPlans: StudyPlan[]): AchievementData[] {
  const subjectData: Record<string, { totalTarget: number; totalAchievement: number }> = {};

  // 각 과목별로 목표와 달성률을 집계합니다
  studyPlans.forEach((plan) => {
    if (!subjectData[plan.subject]) {
      subjectData[plan.subject] = { totalTarget: 0, totalAchievement: 0 };
    }

    subjectData[plan.subject].totalTarget += Number(plan.target);
    subjectData[plan.subject].totalAchievement += Number(plan.achievement);
  });

  // 과목별 달성률 데이터를 생성합니다
  return Object.entries(subjectData).map(([subject, data]) => ({
    subject,
    achievementRate: data.totalTarget > 0 ? (data.totalAchievement / data.totalTarget) * 100 : 0,
    totalMinutes: data.totalAchievement,
  }));
}

/**
 * 교과서 진도 데이터를 분석하여 과목별 진행 상황을 파악합니다.
 */
function analyzeSubjectProgress(curriculum: Curriculum[]): SubjectProgress[] {
  const subjectUnits: Record<string, { total: number }> = {};

  // 과목별 단원 수를 집계합니다
  curriculum.forEach((item) => {
    if (!subjectUnits[item.subject]) {
      subjectUnits[item.subject] = { total: 0 };
    }
    subjectUnits[item.subject].total++;
  });

  // 과목별 진행 상황 데이터를 생성합니다
  return Object.entries(subjectUnits).map(([subject, data]) => ({
    subject,
    completedUnits: 0, // 실제로는 학생의 진행 상황을 추적해야 합니다
    totalUnits: data.total,
  }));
}

/**
 * 학습 추천 전략을 생성합니다.
 */
function generateLearningStrategies(
  achievementData: AchievementData[]
): Recommendation[] {
  const strategies: Recommendation[] = [];
  
  // 성취율이 낮은 과목에 대한 추천
  const lowAchievementSubjects = achievementData
    .filter((data) => data.achievementRate < 80)
    .sort((a, b) => a.achievementRate - b.achievementRate);

  if (lowAchievementSubjects.length > 0) {
    const worstSubject = lowAchievementSubjects[0];
    strategies.push({
      userId: "",
      subject: worstSubject.subject,
      content: `${worstSubject.subject} 과목의 목표 달성률이 ${Math.round(
        worstSubject.achievementRate
      )}%로 낮습니다. 학습 시간을 늘리고 집중도를 높이는 것이 좋겠습니다.`,
      type: "STRATEGY",
    });
  }

  // 학습 시간 증가 추천
  const lowTimeSubjects = achievementData
    .filter((data) => data.totalMinutes < 300) // 주당 5시간 미만
    .sort((a, b) => a.totalMinutes - b.totalMinutes);

  if (lowTimeSubjects.length > 0) {
    const leastTimeSubject = lowTimeSubjects[0];
    strategies.push({
      userId: "",
      subject: leastTimeSubject.subject,
      content: `${leastTimeSubject.subject} 과목의 학습 시간이 부족합니다. 주당 최소 5시간 이상 학습하는 것을 목표로 하세요.`,
      type: "STRATEGY",
    });
  }

  return strategies;
}

/**
 * 학습 스케줄 추천을 생성합니다.
 */
function generateScheduleRecommendations(
  achievementData: AchievementData[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // 균형 잡힌 주간 스케줄 추천
  const allSubjects = achievementData.map((data) => data.subject);
  
  if (allSubjects.length > 0) {
    recommendations.push({
      userId: "",
      subject: "전체",
      content: `균형 잡힌 학습을 위해 ${allSubjects.join(
        ", "
      )} 과목을 골고루 학습하세요. 각 과목별로 주당 최소 3회, 회당 1시간 이상 학습하는 것이 효과적입니다.`,
      type: "SCHEDULE",
    });
  }

  // 성취율이 낮은 과목에 더 많은 시간 할당 추천
  const lowAchievementSubjects = achievementData
    .filter((data) => data.achievementRate < 70)
    .map((data) => data.subject);

  if (lowAchievementSubjects.length > 0) {
    recommendations.push({
      userId: "",
      subject: lowAchievementSubjects.join(", "),
      content: `${lowAchievementSubjects.join(
        ", "
      )} 과목의 달성률이 낮습니다. 이 과목들에 주당 2시간씩 추가 학습 시간을 배정하세요.`,
      type: "SCHEDULE",
    });
  }

  return recommendations;
}

/**
 * 과목별 추천을 생성합니다.
 */
function generateSubjectRecommendations(
  achievementData: AchievementData[],
  subjectProgress: SubjectProgress[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 각 과목별 맞춤 추천
  achievementData.forEach((data) => {
    const progress = subjectProgress.find((p) => p.subject === data.subject);
    
    if (progress) {
      const progressPercent = (progress.completedUnits / progress.totalUnits) * 100;
      
      if (data.achievementRate < 60) {
        recommendations.push({
          userId: "",
          subject: data.subject,
          content: `${data.subject} 과목의 목표 달성률이 낮습니다. 기초 개념부터 차근차근 복습하고, 문제 풀이 시간을 늘리세요.`,
          type: "SUBJECT",
        });
      } else if (progressPercent < 50) {
        recommendations.push({
          userId: "",
          subject: data.subject,
          content: `${data.subject} 과목의 진도가 절반 이하입니다. 진도를 따라잡기 위해 학습 계획을 조정하세요.`,
          type: "SUBJECT",
        });
      }
    }
  });

  return recommendations;
}

/**
 * 단원별 추천을 생성합니다.
 */
function generateUnitRecommendations(
  curriculum: Curriculum[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // 각 과목별로 중요 단원 추천
  const subjectUnits: Record<string, Curriculum[]> = {};
  
  curriculum.forEach((item) => {
    if (!subjectUnits[item.subject]) {
      subjectUnits[item.subject] = [];
    }
    subjectUnits[item.subject].push(item);
  });
  
  // 각 과목에서 처음 3개 단원을 중요 단원으로 간주
  Object.entries(subjectUnits).forEach(([subject, units]) => {
    const sortedUnits = [...units].sort((a, b) => a.order - b.order);
    const importantUnits = sortedUnits.slice(0, Math.min(3, sortedUnits.length));
    
    if (importantUnits.length > 0) {
      const unitNames = importantUnits.map((unit) => unit.unit).join(", ");
      recommendations.push({
        userId: "",
        subject,
        content: `${subject} 과목의 ${unitNames} 단원은 기초 개념을 다루는 중요한 단원입니다. 이 단원들을 철저히 학습하세요.`,
        type: "UNIT",
      });
    }
  });

  return recommendations;
}

/**
 * 학습 계획 및 교과서 진도 데이터를 기반으로 AI 추천을 생성합니다.
 */
export async function generateRecommendations(
  userId: string,
  studyPlans: any[],
  curriculum: any[]
): Promise<Recommendation[]> {
  try {
    // 학습 데이터 분석
    const achievementData = analyzeAchievementRates(studyPlans as StudyPlan[]);
    const subjectProgress = analyzeSubjectProgress(curriculum as Curriculum[]);
    
    // 추천 생성
    const strategies = generateLearningStrategies(achievementData);
    const schedules = generateScheduleRecommendations(achievementData);
    const subjectRecs = generateSubjectRecommendations(
      achievementData,
      subjectProgress
    );
    const unitRecs = generateUnitRecommendations(curriculum as Curriculum[]);
    
    // 모든 추천에 userId 설정
    const allRecommendations = [
      ...strategies,
      ...schedules,
      ...subjectRecs,
      ...unitRecs,
    ].map((rec) => ({
      ...rec,
      userId,
    }));
    
    return allRecommendations;
  } catch (error) {
    console.error("추천 생성 중 오류 발생:", error);
    return [];
  }
} 