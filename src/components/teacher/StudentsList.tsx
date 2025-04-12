"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { apiCall } from "@/lib/api-service";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { UserRole } from "@/types";

interface StudentsListProps {
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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export default function StudentsList({ user }: StudentsListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [studyPlanSummaries, setStudyPlanSummaries] = useState<Record<string, StudyPlanSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiCall<ApiResponse<User[]>>('/api/teacher/users?role=STUDENT');
      
      if (data.success) {
        setUsers(data.data);
        
        // 학생별 학습 계획 요약 정보 가져오기
        const summaries: Record<string, StudyPlanSummary> = {};
        
        for (const student of data.data) {
          try {
            const summaryData = await apiCall<ApiResponse<StudyPlanSummary>>(
              `/api/teacher/users/${student.id}/study-plans/summary`
            );
            
            if (summaryData.success) {
              summaries[student.id] = summaryData.data;
            }
          } catch (err) {
            console.error(`학생 ${student.id}의 학습 계획 요약 정보를 가져오는데 실패했습니다:`, err);
          }
        }
        
        setStudyPlanSummaries(summaries);
      } else {
        console.error('사용자 목록을 불러오는데 실패했습니다.', data.error);
        setError('사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 목록 가져오기 오류:', err);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const data = await apiCall<ApiResponse<User>>(`/api/teacher/users/${userId}`, {
        method: 'PATCH',
        body: { role: newRole }
      });
      
      if (data.success) {
        // 사용자 목록에서 해당 사용자 업데이트
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole as any } : user
          )
        );
        toast.success('사용자 역할이 업데이트되었습니다.');
      } else {
        console.error('사용자 역할 업데이트 실패:', data.error);
        toast.error('사용자 역할을 업데이트하는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 역할 업데이트 오류:', err);
      toast.error('사용자 역할을 업데이트하는데 실패했습니다.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">오류 발생:</strong>
        <span className="block sm:inline ml-1">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">학생 목록</h2>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="이름 또는 이메일로 검색..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  학생
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  이메일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  학습 계획
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  평균 달성률
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((student) => {
                const summary = studyPlanSummaries[student.id];
                const achievementRate = summary ? Math.round(summary.averageAchievement) : 0;
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.image ? (
                            <img className="h-10 w-10 rounded-full" src={student.image} alt={student.name || ""} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-700 font-bold">{student.name?.[0] || "?"}</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">
                        {summary ? `${summary.completedPlans} / ${summary.totalPlans}` : "0 / 0"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              achievementRate >= 80 ? 'bg-green-600' : 
                              achievementRate >= 50 ? 'bg-blue-600' : 
                              achievementRate > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${achievementRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{achievementRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold"
                        >
                          상세 보기
                        </Link>
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