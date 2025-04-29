"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";
import { useTheme } from "next-themes";

interface StudyPlan {
  id: string;
  subject: string;
  content: string;
  target: number;
  achievement: number;
  date: string;
  timeSlot: string;
  userId: string;
}

// 시간대 ID를 사용자 친화적인 레이블로 변환하는 함수
const getTimeSlotLabel = (timeSlotId: string) => {
  const timeSlots = [
    { id: "17-17:50", label: "17시 00분~17시 50분" },
    { id: "19-19:50", label: "19시 00분~19시 50분" },
    { id: "20-20:50", label: "20시 00분~20시 50분" },
    { id: "21-21:50", label: "21시 00분~21시 50분" },
  ];
  
  const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
  return timeSlot ? timeSlot.label : timeSlotId;
};

export default function StudyPlansTable() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  // 데이터 갱신 트리거를 위한 상태
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

  // 로컬 스토리지에서 학습 계획 업데이트를 감지하는 이벤트 리스너
  useEffect(() => {
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('studyPlanUpdated');
      if (lastUpdate) {
        console.log('학습 계획 업데이트 감지:', lastUpdate);
        // 갱신 신호가 있으면 트리거 업데이트
        setRefreshTrigger(Date.now());
        // 사용한 갱신 신호는 제거
        localStorage.removeItem('studyPlanUpdated');
      }
    };
    
    // 초기 체크
    checkForUpdates();
    
    // 포커스가 다시 페이지로 돌아올 때 체크
    const handleFocus = () => checkForUpdates();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    async function fetchStudyPlans() {
      if (!session?.user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/study-plans');
        
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
        console.error("학습 계획 조회 오류:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchStudyPlans();
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말로 이 학습 계획을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/study-plans/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("학습 계획을 삭제하는데 실패했습니다.");
      }

      const data = await response.json();
      if (data.success) {
        // 삭제 성공 후 목록 업데이트
        setStudyPlans(studyPlans.filter((plan) => plan.id !== id));
        toast.success("학습 계획이 삭제되었습니다.");
      } else {
        throw new Error(data.error?.message || "학습 계획을 삭제하는데 실패했습니다.");
      }
    } catch (err) {
      console.error("학습 계획 삭제 오류:", err);
      toast.error((err as Error).message);
    }
  };

  const navigateToCompletionCheck = (id: string) => {
    router.push(`/study-plans/${id}?mode=complete`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 font-medium">
        <p>{error}</p>
      </div>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-800 font-medium">
        <p>등록된 학습 계획이 없습니다.</p>
        <p className="text-sm mt-2">
          <Link href="/study-plans/new" className="text-blue-600 hover:underline font-bold">
            새 학습 계획 추가하기
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              날짜
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              과목
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              학습 내용
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              달성률
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              관리
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {studyPlans
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((plan) => {
              // 달성률 직접 사용
              const achievementRate = plan.achievement;
              
              return (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {formatDate(new Date(plan.date))}
                    </div>
                    <div className="text-xs font-medium text-indigo-600 mt-1">
                      {getTimeSlotLabel(plan.timeSlot || "")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      {plan.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">
                      {plan.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            achievementRate >= 100
                              ? "bg-green-600"
                              : achievementRate >= 70
                              ? "bg-blue-600"
                              : achievementRate > 0
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${achievementRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800">{achievementRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => navigateToCompletionCheck(plan.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        학습 완료 체크
                      </button>
                      <Link
                        href={`/study-plans/${plan.id}/edit`}
                        className="px-2 py-1 text-indigo-600 hover:text-indigo-900 font-bold"
                      >
                        학습 계획 수정
                      </Link>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="px-2 py-1 text-red-600 hover:text-red-900 font-bold"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}