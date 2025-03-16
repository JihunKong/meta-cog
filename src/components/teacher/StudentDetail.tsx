"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  content: string;
  target: number;
  achievement: number;
  date: string;
  timeSlot?: string;
  reflection?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

interface AIRecommendation {
  id: string;
  userId: string;
  subject: string;
  content: string;
  type: string;
  createdAt: string;
}

interface StudentDetailProps {
  studentId: string;
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const { data: session } = useSession();
  const [student, setStudent] = useState<User | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecommendation, setGeneratingRecommendation] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        
        // 학생 정보 가져오기
        const userResponse = await fetch(`/api/teacher/users/${studentId}`);
        if (!userResponse.ok) {
          throw new Error("학생 정보를 불러오는데 실패했습니다.");
        }
        
        const userData = await userResponse.json();
        if (userData.success) {
          setStudent(userData.data);
        } else {
          throw new Error(userData.error?.message || "학생 정보를 불러오는데 실패했습니다.");
        }
        
        // 학습 계획 가져오기
        const plansResponse = await fetch(`/api/teacher/users/${studentId}/study-plans`);
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          if (plansData.success) {
            setStudyPlans(plansData.data || []);
          }
        }
        
        // AI 추천 가져오기
        const recommendationsResponse = await fetch(`/api/teacher/users/${studentId}/recommendations`);
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          if (recommendationsData.success) {
            setRecommendations(recommendationsData.data || []);
          }
        }
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [session, studentId]);

  const generateRecommendation = async () => {
    if (!session?.user) return;
    
    try {
      setGeneratingRecommendation(true);
      const response = await fetch(`/api/teacher/users/${studentId}/recommendations`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("AI 추천 생성에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success("AI 추천이 생성되었습니다.");
        
        // 추천 목록 갱신
        const recommendationsResponse = await fetch(`/api/teacher/users/${studentId}/recommendations`);
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          if (recommendationsData.success) {
            setRecommendations(recommendationsData.data || []);
          }
        }
      } else {
        throw new Error(data.error?.message || "AI 추천 생성에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGeneratingRecommendation(false);
    }
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-800 dark:text-red-300">
        <strong className="font-bold">오류 발생:</strong>
        <span className="block sm:inline ml-1">{error}</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-300">
        <strong className="font-bold">알림:</strong>
        <span className="block sm:inline ml-1">학생 정보를 찾을 수 없습니다.</span>
      </div>
    );
  }

  // 학습 계획 달성률 계산
  const totalPlans = studyPlans.length;
  const plansWithAchievement = studyPlans.filter(plan => plan.achievement > 0);
  const completedPlans = plansWithAchievement.length;
  const averageAchievement = completedPlans > 0
    ? plansWithAchievement.reduce((sum, plan) => sum + plan.achievement, 0) / completedPlans
    : 0;

  return (
    <div className="space-y-8">
      {/* 뒤로 가기 버튼 */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Icons.chevronLeft className="w-4 h-4 mr-1" />
          학생 목록으로 돌아가기
        </Link>
      </div>
      
      {/* 학생 정보 */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 h-16 w-16">
          {student.image ? (
            <img className="h-16 w-16 rounded-full" src={student.image} alt={student.name || ""} />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
              <span className="text-gray-700 text-xl font-bold dark:text-gray-200">{student.name?.[0] || "?"}</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{student.email}</p>
        </div>
      </div>

      {/* 학습 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900">
          <h3 className="text-sm font-bold text-blue-700 uppercase dark:text-blue-300">총 학습 계획</h3>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalPlans}개</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900">
          <h3 className="text-sm font-bold text-green-700 uppercase dark:text-green-300">완료된 계획</h3>
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">{completedPlans}개</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg dark:bg-purple-900">
          <h3 className="text-sm font-bold text-purple-700 uppercase dark:text-purple-300">평균 달성률</h3>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{Math.round(averageAchievement)}%</p>
        </div>
      </div>

      {/* 학습 계획 목록 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">학습 계획</h3>
          <Link
            href={`/teacher/students/${studentId}/study-plans`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            모든 학습 계획 보기
          </Link>
        </div>
        
        {studyPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>학습 계획이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    날짜
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    과목
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    내용
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    달성률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {studyPlans.slice(0, 5).map((plan) => {
                  const achievementRate = plan.achievement;
                  
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatDate(new Date(plan.date))}
                        </div>
                        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                          {plan.timeSlot}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{plan.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{plan.content}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2 dark:bg-gray-700">
                            <div
                              className={`h-2.5 rounded-full ${
                                achievementRate >= 80 ? 'bg-green-600' : 
                                achievementRate >= 50 ? 'bg-blue-600' : 
                                achievementRate > 0 ? 'bg-yellow-500' : 
                                'bg-gray-300 dark:bg-gray-600'
                              }`}
                              style={{ width: `${achievementRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{achievementRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI 추천 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">AI 추천</h3>
          <button
            onClick={generateRecommendation}
            disabled={generatingRecommendation}
            className="flex items-center text-sm px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 font-bold dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            {generatingRecommendation ? (
              <Icons.spinner className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Icons.chart className="mr-1.5 h-4 w-4" />
            )}
            AI 추천 생성
          </button>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>AI 추천이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((recommendation) => (
              <div key={recommendation.id} className="p-4 border rounded-lg dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {recommendation.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(recommendation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="mt-2 font-bold">{recommendation.subject}</h4>
                <p className="mt-1 text-gray-700 dark:text-gray-300">{recommendation.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 