"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StudyPlan } from "@/types";
import { formatDate, calculateAchievementRate, getWeekRange } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

export default function StudyPlanSummary() {
  const { data: session } = useSession();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!session?.user) return;

      try {
        const today = new Date();
        const { start, end } = getWeekRange(today);
        
        const response = await fetch(
          `/api/study-plans?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
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
        <p>이번 주 학습 계획이 없습니다.</p>
        <p className="text-sm mt-2">
          <a href="/study-plans/new" className="text-blue-500 hover:underline">
            새 학습 계획 추가하기
          </a>
        </p>
      </div>
    );
  }

  // 과목별로 그룹화
  const groupedBySubject = studyPlans.reduce(
    (acc, plan) => {
      if (!acc[plan.subject]) {
        acc[plan.subject] = [];
      }
      acc[plan.subject].push(plan);
      return acc;
    },
    {} as Record<string, StudyPlan[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold mb-0">최근 학습 요약</h2>
        <Link href="/study-plans" className="text-sm text-blue-600 hover:underline font-bold">
          전체 보기
        </Link>
      </div>
      
      {Object.entries(groupedBySubject).map(([subject, plans]) => {
        // 달성률을 직접 사용
        const achievementRate = Math.round(
          plans.reduce((sum, plan) => sum + Number(plan.achievement), 0) / plans.length
        );

        return (
          <div key={subject} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{subject}</h3>
              <span className="text-sm text-gray-500">
                달성률: {achievementRate}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${achievementRate > 100 ? 100 : achievementRate}%` }}
              />
            </div>
            
            <div className="mt-3 space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="text-sm flex justify-between">
                  <span className="text-gray-600">{plan.content}</span>
                  <span className="text-gray-500">
                    {formatDate(new Date(plan.date))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 