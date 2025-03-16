"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

// 학생 타입 정의
interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

// 학습 계획 타입 정의
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

// 과목별 통계 타입 정의
interface SubjectStats {
  subject: string;
  count: number;
  achievementRate: number;
}

interface AIRecommendation {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
}

interface StudentDetailViewProps {
  studentId: string;
}

export function StudentDetailView({ studentId }: StudentDetailViewProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // 학생 정보 가져오기
        const studentResponse = await fetch(`/api/admin/users/${studentId}`);
        if (!studentResponse.ok) {
          const errorData = await studentResponse.json();
          throw new Error(errorData.error || "학생 정보를 불러오는데 실패했습니다.");
        }
        const studentData = await studentResponse.json();
        setStudent(studentData.data);
        
        // 학생의 학습 계획 가져오기
        try {
          const plansResponse = await fetch(`/api/admin/users/${studentId}/study-plans`);
          if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            setStudyPlans(plansData.data || []);
          } else {
            console.log("학습 계획 API가 아직 준비되지 않았습니다.");
          }
        } catch (err) {
          console.log("학습 계획을 불러오는데 실패했습니다:", err);
        }
        
        // AI 추천 데이터 가져오기
        try {
          const recommendationsResponse = await fetch(`/api/admin/users/${studentId}/recommendations`);
          if (recommendationsResponse.ok) {
            const recommendationsData = await recommendationsResponse.json();
            setRecommendations(recommendationsData.data || []);
          } else {
            console.log("AI 추천 API가 아직 준비되지 않았습니다.");
          }
        } catch (err) {
          console.log("AI 추천 데이터를 가져오는데 실패했습니다:", err);
        }
        
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  // 과목별 통계 계산
  useEffect(() => {
    // 과목별 통계 계산
    const calculateSubjectStats = () => {
      const stats: Record<string, SubjectStats> = {};
      
      studyPlans.forEach(plan => {
        if (!stats[plan.subject]) {
          stats[plan.subject] = {
            subject: plan.subject,
            count: 0,
            achievementRate: 0
          };
        }
        
        stats[plan.subject].count += 1;
      });
      
      // 달성률 계산 - 각 과목의 평균 달성률을 계산
      Object.values(stats).forEach(stat => {
        // 달성률을 직접 사용
        const totalAchievementRate = studyPlans
          .filter(plan => plan.subject === stat.subject)
          .reduce((sum, plan) => sum + plan.achievement, 0);
          
        const plansCount = stat.count;
        stat.achievementRate = plansCount > 0 
          ? Math.round(totalAchievementRate / plansCount) 
          : 0;
      });
      
      // 달성률 기준으로 정렬
      return Object.values(stats).sort((a, b) => b.achievementRate - a.achievementRate);
    };
    
    if (studyPlans.length > 0) {
      setSubjectStats(calculateSubjectStats());
    }
  }, [studyPlans]);

  // 과목 필터링된 학습 계획
  const filteredStudyPlans = selectedSubject 
    ? studyPlans.filter(plan => plan.subject === selectedSubject)
    : studyPlans;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">오류 발생:</strong>
        <span className="block sm:inline ml-1">{error}</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8 text-gray-800 font-medium">
        <p>학생 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 학생 기본 정보 */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 h-16 w-16">
          {student.image ? (
            <img className="h-16 w-16 rounded-full" src={student.image} alt={student.name || ""} />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">{student.name?.[0] || "?"}</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{student.name || "이름 없음"}</h2>
          <p className="text-gray-800 font-medium">{student.email || "이메일 없음"}</p>
        </div>
      </div>

      {/* 과목별 학습 통계 */}
      <div>
        <h3 className="text-lg font-bold mb-4">과목별 학습 현황</h3>
        {subjectStats.length === 0 ? (
          <p className="text-gray-800 font-medium">아직 등록된 학습 계획이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((stat) => (
              <div 
                key={stat.subject} 
                className={`p-4 rounded-lg border ${
                  selectedSubject === stat.subject ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                } cursor-pointer hover:bg-gray-50`}
                onClick={() => setSelectedSubject(selectedSubject === stat.subject ? null : stat.subject)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-900">{stat.subject}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    stat.achievementRate >= 80 ? 'bg-green-100 text-green-800' : 
                    stat.achievementRate >= 50 ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {stat.achievementRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800">달성률:</span>
                  <span className="font-bold text-gray-800">{stat.achievementRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">학습 계획 수:</span>
                  <span className="font-bold text-gray-800">{stat.count}개</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      stat.achievementRate >= 80 ? 'bg-green-600' : 
                      stat.achievementRate >= 50 ? 'bg-blue-600' : 
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${stat.achievementRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI 추천 사항 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">AI 맞춤 학습 추천</h3>
          <button 
            className="text-sm font-bold text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"
            onClick={() => toast.success("AI 추천이 요청되었습니다.")}
          >
            새 AI 추천 생성
          </button>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-blue-800 font-medium mb-2">학생을 위한 AI 추천 사항이 아직 없습니다.</p>
            <p className="text-blue-800 font-medium">학생의 학습 데이터가 쌓이면 자동으로 추천이 생성됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-indigo-800 font-medium">
                    {formatDate(new Date(rec.createdAt))}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-line font-medium">{rec.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 학습 계획 목록 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            학습 계획 목록
            {selectedSubject && <span className="ml-2 text-blue-600">({selectedSubject})</span>}
          </h3>
          {selectedSubject && (
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-bold"
              onClick={() => setSelectedSubject(null)}
            >
              모든 과목 보기
            </button>
          )}
        </div>
        
        {filteredStudyPlans.length === 0 ? (
          <p className="text-gray-800 font-medium">등록된 학습 계획이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">과목</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">학습 내용</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">달성률</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudyPlans
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
                            {plan.timeSlot}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{plan.subject}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{plan.content}</div>
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
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 