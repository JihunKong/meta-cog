"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 세션 로딩 완료 확인
    if (session) {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">교사 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">교사 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>환영합니다, {session?.user?.name || '교사'}님!</CardTitle>
            <CardDescription>
              역할: {session?.user?.role || '교사'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>이메일: {session?.user?.email || '정보 없음'}</p>
            <p className="mt-4">청해FLAME 교사 대시보드에 오신 것을 환영합니다.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">마지막 로그인: {new Date().toLocaleString()}</p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>교사 기능</CardTitle>
            <CardDescription>자주 사용하는 교육 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">학생 관리</Button>
            <Button className="w-full" variant="outline">학습 계획 검토</Button>
            <Button className="w-full" variant="outline">성취도 분석</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>학생 현황</CardTitle>
            <CardDescription>현재 학생 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-green-500 font-medium">● 정상 작동 중</p>
            <p className="mt-2">세션 ID: {session?.user?.id || '정보 없음'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
