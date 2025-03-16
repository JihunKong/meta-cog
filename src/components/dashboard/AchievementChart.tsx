"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Chart, registerables } from "chart.js";
import { StudyPlan } from "@/types";
import { calculateAchievementRate } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

Chart.register(...registerables);

export default function AchievementChart() {
  const { data: session } = useSession();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!session?.user) return;

      try {
        // 지난 30일 간의 데이터를 가져옵니다
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const response = await fetch(
          `/api/study-plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        if (!response.ok) {
          throw new Error("학습 계획을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        if (data.success) {
          setStudyPlans(data.data);
        } else {
          throw new Error(data.error?.message || "학습 계획을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyPlans();
  }, [session]);

  useEffect(() => {
    if (loading || !studyPlans.length || !chartRef.current) return;

    // 과목별로 데이터 그룹화
    const subjectMap = {};
    
    studyPlans.forEach((plan) => {
      if (!subjectMap[plan.subject]) {
        subjectMap[plan.subject] = {
          plans: [],
          achievementSum: 0
        };
      }
      
      subjectMap[plan.subject].plans.push(plan);
      subjectMap[plan.subject].achievementSum += plan.achievement;
    });
    
    // 차트 데이터 준비
    const subjects = Object.keys(subjectMap);
    const achievementRates = [];
    const subjectData = {};
    
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
                  const subject = context.label;
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

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>표시할 학습 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  );
} 