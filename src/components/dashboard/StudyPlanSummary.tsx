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
        setLoading(true);
        setError(null);
        const today = new Date();
        const { start, end } = getWeekRange(today);
        
        const url = `/api/study-plans?startDate=${start.toISOString()}&endDate=${end.toISOString()}&userId=${session.user.id}`;
        console.log('학습 계획 요청 URL:', url);
        console.log('현재 사용자 ID:', session.user.id);
        
        const response = await fetch(
          url,
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
          const filteredPlans = data.data.filter((plan: StudyPlan) => 
            plan.userId === session.user.id
          );
          console.log(`API 응답 데이터 수: ${data.data.length}, 필터링 후 데이터 수: ${filteredPlans.length}`);
          
          setStudyPlans(filteredPlans || []);
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

    fetchStudyPlans();
  }, [session]);

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
        <p>이번 주 학습 계획이 없습니다.</p>
        <p className="text-sm mt-2">
          <Link href="/study-plans/new" className="text-blue-500 hover:underline">
            새 학습 계획 추가하기
          </Link>
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
        // 달성률을 직접 사용 (NaN 방지)
        const totalAchievement = plans.reduce((sum, plan) => sum + Number(plan.achievement || 0), 0);
        const achievementRate = plans.length > 0 ? Math.round(totalAchievement / plans.length) : 0;

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