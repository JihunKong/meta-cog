"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";

interface StatsData {
  totalUsers: number;
  totalSubjects: number;
  totalCurriculums: number;
  totalStudyPlans: number;
  completedStudyPlans: number;
}

export default function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        
        if (!response.ok) {
          throw new Error("통계 데이터를 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error?.message || "통계 데이터를 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("통계 데이터 로딩 오류:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-medium">오류 발생:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "총 학생 수",
      value: stats.totalUsers,
      icon: <Icons.user className="h-8 w-8 text-blue-500" />,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "과목 수",
      value: stats.totalSubjects,
      icon: <Icons.book className="h-8 w-8 text-green-500" />,
      color: "bg-green-50 text-green-700",
    },
    {
      title: "교과서 단원 수",
      value: stats.totalCurriculums,
      icon: <Icons.book className="h-8 w-8 text-purple-500" />,
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "학습 계획 수",
      value: stats.totalStudyPlans,
      icon: <Icons.calendar className="h-8 w-8 text-amber-500" />,
      color: "bg-amber-50 text-amber-700",
      subtext: `${stats.completedStudyPlans}개 완료`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow flex items-start justify-between"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
            <p className="text-2xl font-bold mt-1">{card.value.toLocaleString()}</p>
            {card.subtext && <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>}
          </div>
          <div className={`p-3 rounded-full ${card.color.split(" ")[0]}`}>{card.icon}</div>
        </div>
      ))}
    </div>
  );
} 