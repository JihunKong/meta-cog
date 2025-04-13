"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export function TeacherStats() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.user) return;
      
      try {
        setLoading(true);
        const response = await fetch("/api/teacher/stats");
        
        if (!response.ok) {
          throw new Error("통계 데이터를 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error?.message || "통계 데이터를 불러오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("통계 불러오기 오류:", error);
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <p>통계 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">학생 수</h3>
          <p className="text-3xl font-bold">{stats.studentCount || 0}명</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">학습 계획 수</h3>
          <p className="text-3xl font-bold">{stats.studyPlanCount || 0}개</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">평균 달성률</h3>
          <p className="text-3xl font-bold">{stats.averageAchievement || 0}%</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">과목별 통계</h3>
        {stats.subjectStats && stats.subjectStats.length > 0 ? (
          <div className="space-y-4">
            {stats.subjectStats.map((subject: any) => (
              <div key={subject.name} className="flex items-center">
                <span className="w-20 font-medium">{subject.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 ml-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${subject.averageAchievement || 0}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{subject.averageAchievement || 0}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">과목별 통계 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
} 