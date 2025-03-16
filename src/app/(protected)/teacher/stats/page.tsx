"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatsData {
  totalStudents: number;
  totalStudyPlans: number;
  averageAchievement: number;
  averageParticipationRate: number;
  subjectDistribution: Record<string, number>;
  monthlyAchievements: {
    month: string;
    achievement: number;
    participationRate: number;
    totalPlans: number;
    completedPlans: number;
  }[];
  studentPerformance: {
    id: string;
    name: string;
    email: string;
    totalPlans: number;
    completedPlans: number;
    averageAchievement: number;
    participationRate: number;
    participationDays: number;
    possibleDays: number;
  }[];
  lastUpdated: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'achievement' | 'participation'>('achievement');

  useEffect(() => {
    document.title = "학습 통계 - 청해FLAME";
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/teacher/stats');
        
        if (!response.ok) {
          throw new Error('통계 데이터를 불러오는데 실패했습니다.');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.message || '통계 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
        toast.error("오류", {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // 30초마다 데이터 자동 새로고침
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 파이 차트 데이터 준비
  const prepareSubjectDistributionData = () => {
    if (!data || !data.subjectDistribution) return [];
    
    return Object.entries(data.subjectDistribution).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  // 정렬된 학생 성과 데이터
  const getSortedStudentPerformance = () => {
    if (!data || !data.studentPerformance) return [];
    
    return [...data.studentPerformance].sort((a, b) => {
      if (sortBy === 'achievement') {
        return b.averageAchievement - a.averageAchievement;
      } else {
        return b.participationRate - a.participationRate;
      }
    });
  };

  const formatLastUpdated = () => {
    if (!data || !data.lastUpdated) return '정보 없음';
    
    try {
      const date = new Date(data.lastUpdated);
      return `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR')}`;
    } catch (e) {
      return data.lastUpdated;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">통계 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <h1 className="text-2xl font-bold text-red-500">오류가 발생했습니다</h1>
        <p className="text-gray-600 mt-2">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">학습 통계</h1>
        <div className="text-sm text-gray-500">
          마지막 업데이트: {formatLastUpdated()}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">전체 학생수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.totalStudents || 0}명</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">평균 달성률</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.averageAchievement || 0}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">평균 참여율</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.averageParticipationRate || 0}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">총 학습 계획</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.totalStudyPlans || 0}개</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="students">학생별 순위</TabsTrigger>
          <TabsTrigger value="monthly">월간 참여율</TabsTrigger>
          <TabsTrigger value="distribution">과목별 분포</TabsTrigger>
        </TabsList>
        
        {/* 학생별 순위 탭 */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>학생별 성과 순위</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={sortBy === 'achievement' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSortBy('achievement')}
                  >
                    달성률 순
                  </Button>
                  <Button 
                    variant={sortBy === 'participation' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSortBy('participation')}
                  >
                    참여율 순
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead className="text-right">학습 계획</TableHead>
                    <TableHead className="text-right">
                      <span className={sortBy === 'achievement' ? "font-bold underline" : ""}>
                        평균 달성률
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className={sortBy === 'participation' ? "font-bold underline" : ""}>
                        참여율
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedStudentPerformance().map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">{student.totalPlans}개</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span 
                          className={`px-2 py-1 rounded-full ${
                            student.averageAchievement >= 80 ? 'bg-green-100 text-green-800' :
                            student.averageAchievement >= 60 ? 'bg-blue-100 text-blue-800' :
                            student.averageAchievement >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.averageAchievement}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span 
                          className={`px-2 py-1 rounded-full ${
                            student.participationRate >= 80 ? 'bg-green-100 text-green-800' :
                            student.participationRate >= 60 ? 'bg-blue-100 text-blue-800' :
                            student.participationRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.participationRate}% ({student.participationDays}/{student.possibleDays}일)
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {(!data?.studentPerformance || data.studentPerformance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        학생 성적 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 월간 추이 탭 */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>월간 참여율 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data?.monthlyAchievements || []}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="participationRate"
                      name="참여율"
                      stroke="#82ca9d"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="achievement"
                      name="평균 달성률"
                      stroke="#8884d8"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">참여율이란?</h3>
                <p className="text-sm text-gray-600">
                  참여율은 월간 최대 참여 가능 횟수(학생 수 * 주당 수업일 수) 대비 실제 참여한 학습 계획 수의 비율입니다.
                  높은 참여율은 학생들이 꾸준히 학습에 참여하고 있음을 나타냅니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 과목별 분포 탭 */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>과목별 학습 계획 분포</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareSubjectDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareSubjectDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}개`, '학습 계획 수']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 