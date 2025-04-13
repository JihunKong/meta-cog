"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface StudyPlansClientProps {
  studentId: string;
}

export default function StudyPlansClient({ studentId }: StudyPlansClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [student, setStudent] = useState<any>(null);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) return;
      
      try {
        // 학생 정보 가져오기
        const studentResponse = await fetch(`/api/teacher/users/${studentId}`);
        if (!studentResponse.ok) {
          throw new Error("학생 정보를 불러오는데 실패했습니다.");
        }
        
        const studentData = await studentResponse.json();
        if (studentData.success) {
          setStudent(studentData.data);
        } else {
          throw new Error(studentData.error?.message || "학생 정보를 불러오는데 실패했습니다.");
        }
        
        // 모든 학습 계획 가져오기
        const plansResponse = await fetch(`/api/teacher/users/${studentId}/study-plans`);
        if (!plansResponse.ok) {
          throw new Error("학습 계획을 불러오는데 실패했습니다.");
        }
        
        const plansData = await plansResponse.json();
        if (plansData.success) {
          setStudyPlans(plansData.data || []);
        } else {
          throw new Error(plansData.error?.message || "학습 계획을 불러오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
        setError(error instanceof Error ? error.message : "데이터를 불러오는데 문제가 발생했습니다.");
        toast.error(error instanceof Error ? error.message : "데이터를 불러오는데 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [session, studentId]);
  
  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
        <p>{error}</p>
        <button
          className="mt-2 text-blue-500 hover:underline"
          onClick={() => router.back()}
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link
            href={`/teacher/students/${studentId}`}
            className="text-blue-500 hover:underline mb-2 inline-block"
          >
            ← 학생 상세 정보로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold">
            {student?.name || "학생"} 학습 계획 전체 목록
          </h1>
        </div>
      </div>

      {studyPlans.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">학습 계획이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간대
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    과목
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학습 내용
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    달성률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studyPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(plan.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.timeSlot || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {plan.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                          <div
                            className={`h-2.5 rounded-full ${
                              (plan.achievement || 0) >= 100
                                ? "bg-green-500"
                                : (plan.achievement || 0) >= 75
                                ? "bg-blue-500"
                                : (plan.achievement || 0) >= 50
                                ? "bg-indigo-500"
                                : (plan.achievement || 0) >= 25
                                ? "bg-yellow-500"
                                : "bg-gray-300"
                            }`}
                            style={{ width: `${plan.achievement || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{plan.achievement || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 