"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Chart, registerables } from "chart.js";
import { StudyPlan } from "@/types";
import { calculateAchievementRate } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

Chart.register(...registerables);

interface SubjectData {
  plans: StudyPlan[];
  achievementSum: number;
}

interface SubjectAchievement {
  achievementRate: number;
}

export default function AchievementChart() {
  const { data: session } = useSession();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

  useEffect(() => {
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('studyPlanUpdated');
      if (lastUpdate) {
        console.log('학습 계획 업데이트 감지:', lastUpdate);
        setRefreshTrigger(Date.now());
        localStorage.removeItem('studyPlanUpdated');
      }
    };
    
    checkForUpdates();
    
    const handleFocus = () => checkForUpdates();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        setError(null);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const timestamp = Date.now();
        
        const response = await fetch(
          `/api/study-plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        if (!response.ok) {
          // 404나 500 에러인 경우에도 빈 배열로 처리하고 오류 메시지는 숨김
          console.error('API 응답 오류:', response.status, response.statusText);
          setStudyPlans([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setStudyPlans(data.data || []);
        } else {
          console.error('API 응답 실패:', data.error);
          setStudyPlans([]);
        }
      } catch (err) {
        console.error('학습 계획 데이터 가져오기 오류:', err);
        setStudyPlans([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStudyPlans();
    }
  }, [session, refreshTrigger]);

  useEffect(() => {
    // 이전 차트 정리
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
    
    if (loading || !chartRef.current) return;
    
    // 데이터가 없는 경우 차트를 그리지 않음
    if (studyPlans.length === 0) return;

    // 과목별로 데이터 그룹화
    const subjectMap: Record<string, SubjectData> = {};
    
    studyPlans.forEach((plan) => {
      if (!subjectMap[plan.subject]) {
        subjectMap[plan.subject] = {
          plans: [],
          achievementSum: 0
        };
      }
      
      subjectMap[plan.subject].plans.push(plan);
      subjectMap[plan.subject].achievementSum += (plan.achievement || 0);
    });
    
    // 차트 데이터 준비
    const subjects = Object.keys(subjectMap);
    const achievementRates: number[] = [];
    const subjectData: Record<string, SubjectAchievement> = {};
    
    subjects.forEach((subject) => {
      const { plans, achievementSum } = subjectMap[subject];
      const averageAchievement = plans.length > 0 ? Math.round(achievementSum / plans.length) : 0;
      
      achievementRates.push(averageAchievement);
      
      subjectData[subject] = {
        achievementRate: averageAchievement
      };
    });
    
    // 차트 생성
    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: subjects,
          datasets: [
            {
              label: "목표 달성률 (%)",
              data: achievementRates,
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function (value) {
                  return value + "%";
                },
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const subject = context.label as string;
                  const { achievementRate } = subjectData[subject];
                  return [`달성률: ${achievementRate}%`];
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [studyPlans, loading]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>표시할 학습 데이터가 없습니다.</p>
        <p className="text-sm mt-2">
          <a href="/study-plans/new" className="text-blue-500 hover:underline">
            학습 계획 추가하기
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  );
} 