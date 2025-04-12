"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

interface StudyPlan {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  target: number;
  achievement: number;
  date: string;
  time_slot: string;
  reflection: string;
  created_at: string;
  updated_at: string;
}

interface AIRecommendation {
  id: string;
  user_id?: string;
  userId?: string;
  subject: string;
  content: string;
  type: string;
  created_at?: string;
  createdAt?: string;
}

interface StudentDetailProps {
  studentId: string;
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const router = useRouter();
  const [student, setStudent] = useState<User | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecommendation, setGeneratingRecommendation] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // 학생 정보 조회 (API 사용)
      const studentResponse = await fetch(`/api/teacher/users/${studentId}`);
      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.error?.message || '학생 정보를 불러오는데 실패했습니다.');
      }
      
      const studentData = await studentResponse.json();
      if (!studentData.success) {
        throw new Error(studentData.error?.message || '학생 정보를 불러오는데 실패했습니다.');
      }
      
      setStudent(studentData.data);

      // 학습 계획 조회 (API 사용)
      const plansResponse = await fetch(`/api/teacher/users/${studentId}/study-plans`);
      if (!plansResponse.ok) {
        const errorData = await plansResponse.json();
        throw new Error(errorData.error?.message || '학습 계획을 불러오는데 실패했습니다.');
      }
      
      const plansData = await plansResponse.json();
      if (!plansData.success) {
        throw new Error(plansData.error?.message || '학습 계획을 불러오는데 실패했습니다.');
      }
      
      setStudyPlans(plansData.data || []);

      // AI 추천 가져오기 (API 사용)
      const recommendationsResponse = await fetch(`/api/teacher/users/${studentId}/recommendations`);
      if (!recommendationsResponse.ok) {
        console.error('AI 추천을 불러오는데 실패했습니다.');
      } else {
        const recommendationsData = await recommendationsResponse.json();
        if (recommendationsData.success) {
          setRecommendations(recommendationsData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error((error as Error).message || '데이터를 불러오는데 실패했습니다.');
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendation = async () => {
    if (!student) return;
    
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8 text-gray-800 font-medium dark:text-gray-200">
        <p>학생을 찾을 수 없습니다.</p>
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
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {student?.image ? (
              <img
                className="h-16 w-16 rounded-full"
                src={student.image}
                alt={student.name || ""}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                  {student?.name?.[0] || "?"}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {student?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{student?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">학습 계획 목록</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  과목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  목표
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  달성률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  날짜
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {studyPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {plan.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {plan.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {plan.target}시간
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(plan.achievement / plan.target) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {Math.round((plan.achievement / plan.target) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {plan.time_slot}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(plan.date).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI 학습 추천</h3>
          <button
            onClick={generateRecommendation}
            disabled={generatingRecommendation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
          >
            {generatingRecommendation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>새 추천 생성</span>
              </>
            )}
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>아직 AI 추천이 없습니다. 새 추천을 생성해보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{rec.subject}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(rec.created_at || rec.createdAt || new Date()).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {rec.content}
                </div>
                <div className="mt-2 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                    {rec.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 