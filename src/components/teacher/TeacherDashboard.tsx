"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { User } from "next-auth";

interface TeacherDashboardProps {
  user: User & {
    role: string;
    student_id?: string | null;
  };
}

interface StudyPlanSummary {
  userId: string;
  totalPlans: number;
  completedPlans: number;
  averageAchievement: number;
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [studyPlanSummaries, setStudyPlanSummaries] = useState<Record<string, StudyPlanSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("학생 목록 API 호출 시작");
        
        const response = await fetch("/api/teacher/users?role=STUDENT");
        console.log("API 응답 상태:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API 응답 에러:", errorText);
          throw new Error(`학생 목록을 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API 응답 데이터:", data);
        
        if (data.success) {
          setStudents(data.data || []);
          console.log(`${data.data?.length || 0}명의 학생 정보 로드됨`);
          
          // 학생별 학습 계획 요약 정보 가져오기
          const summaries: Record<string, StudyPlanSummary> = {};
          
          for (const student of data.data) {
            try {
              console.log(`학생 ${student.id} 요약 정보 요청 중`);
              const summaryResponse = await fetch(`/api/teacher/users/${student.id}/study-plans/summary`);
              
              if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                if (summaryData.success) {
                  summaries[student.id] = summaryData.data;
                  console.log(`학생 ${student.id} 요약 정보 로드 성공`);
                }
              } else {
                console.error(`학생 ${student.id} 요약 정보 로드 실패:`, summaryResponse.status);
              }
            } catch (err) {
              console.error(`학생 ${student.id}의 학습 계획 요약 정보를 가져오는데 실패했습니다:`, err);
            }
          }
          
          setStudyPlanSummaries(summaries);
        } else {
          throw new Error(data.error?.message || "학생 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
        console.error("학생 목록 로드 중 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const generateRecommendationsForAll = async () => {
    if (!user) return;
    
    try {
      setGeneratingRecommendations(true);
      const response = await fetch("/api/cron/generate-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cron-secret": "manual-trigger-from-teacher-dashboard"
        }
      });
      
      if (!response.ok) {
        throw new Error("AI 추천 생성에 실패했습니다.");
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success(`${data.stats.success}명의 학생에게 AI 추천이 생성되었습니다.`);
      } else {
        throw new Error(data.error?.message || "AI 추천 생성에 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">학생 목록</h2>
        <button
          onClick={generateRecommendationsForAll}
          disabled={generatingRecommendations}
          className="flex items-center text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-bold dark:bg-indigo-700 dark:hover:bg-indigo-800"
        >
          {generatingRecommendations ? (
            <Icons.spinner className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Icons.chart className="mr-1.5 h-4 w-4" />
          )}
          모든 학생에게 AI 추천 생성
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="이름 또는 이메일로 검색..."
          className="w-full p-2 border rounded-md font-medium text-gray-800 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-800 font-medium dark:text-gray-200">
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                  학생
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                  이메일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                  학습 계획
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                  평균 달성률
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider dark:text-gray-300">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {filteredStudents.map((student) => {
                const summary = studyPlanSummaries[student.id];
                const achievementRate = summary ? Math.round(summary.averageAchievement) : 0;
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.image ? (
                            <img className="h-10 w-10 rounded-full" src={student.image} alt={student.name || ""} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                              <span className="text-gray-700 font-bold dark:text-gray-200">{student.name?.[0] || "?"}</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {summary ? `${summary.completedPlans} / ${summary.totalPlans}` : "0 / 0"}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                          학습 현황
                        </Link>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/teacher/users/${student.id}/recommendations`, {
                                method: "POST"
                              });
                              
                              if (!response.ok) {
                                throw new Error("AI 추천 생성에 실패했습니다.");
                              }
                              
                              const data = await response.json();
                              if (data.success) {
                                toast.success("AI 추천이 생성되었습니다.");
                              } else {
                                throw new Error(data.error?.message || "AI 추천 생성에 실패했습니다.");
                              }
                            } catch (err) {
                              toast.error((err as Error).message);
                            }
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-bold dark:bg-purple-700 dark:hover:bg-purple-800"
                        >
                          AI 추천 생성
                        </button>
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
  );
} 