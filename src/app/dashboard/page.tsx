"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 테스트 계정으로 직접 로그인하는 함수
  const handleDirectLogin = async () => {
    try {
      console.log('테스트 계정으로 직접 로그인 시도');
      setLoading(true);
      
      // 테스트 계정으로 로그인 시도
      window.location.href = '/admin/dashboard';
    } catch (error) {
      console.error('로그인 실패:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('대시보드 페이지 로딩 - 세션 상태:', status);
    console.log('세션 데이터:', session);
    
    // 세션 로딩 중
    if (status === 'loading') {
      return;
    }
    
    // 사용자가 로그인되어 있고, 세션 로딩이 완료된 경우
    if (status === "authenticated" && session?.user) {
      // 테스트 계정 직접 처리
      if (session.user.email === 'admin@pof.com') {
        console.log('관리자 테스트 계정 처리');
        window.location.href = '/admin/dashboard';
        return;
      }
      
      // 일반 사용자 처리
      const userRole = session.user.role;
      console.log("사용자 역할:", userRole);
      
      // 역할에 따라 적절한 대시보드로 리디렉션
      if (userRole === "ADMIN") {
        console.log("관리자로 리디렉션");
        window.location.href = "/admin/dashboard";
        return;
      } else if (userRole === "TEACHER") {
        console.log("교사로 리디렉션");
        window.location.href = "/teacher/dashboard";
        return;
      }
      
      // STUDENT는 현재 페이지 유지
      console.log('학생 대시보드 표시');
      setLoading(false);
    } else if (status === "unauthenticated") {
      // 로그인되지 않은 경우 로그인 페이지로 리디렉션
      console.log("로그인되지 않음, 로그인 페이지로 이동");
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">대시보드 로딩 중...</p>
      </div>
    );
  }
  
  // 개발 환경에서 관리자 페이지로 바로 접근하는 버튼 추가
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p>세션 상태: {status}</p>
        <p>사용자 정보: {session?.user?.email || '로그인되지 않음'}</p>
        
        <div className="space-y-4">
          <Button onClick={handleDirectLogin} className="bg-blue-600 hover:bg-blue-700">
            관리자 페이지로 바로 이동
          </Button>
          
          <Button onClick={() => router.push('/auth/signin')} className="bg-gray-600 hover:bg-gray-700">
            로그인 페이지로 이동
          </Button>
        </div>
      </div>
    );
  }
  
  // 학생용 대시보드
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">학생 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>환영합니다, {session?.user?.name || '학생'}님!</CardTitle>
            <CardDescription>
              역할: {session?.user?.role || '학생'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>이메일: {session?.user?.email || '정보 없음'}</p>
            <p className="mt-4">청해FLAME 학생 대시보드에 오신 것을 환영합니다.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">마지막 로그인: {new Date().toLocaleString()}</p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>학습 기능</CardTitle>
            <CardDescription>자주 사용하는 학습 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">학습 계획 관리</Button>
            <Button className="w-full" variant="outline">성취도 분석</Button>
            <Button className="w-full" variant="outline">학습 자료 탐색</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>학습 현황</CardTitle>
            <CardDescription>현재 학습 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-green-500 font-medium">● 정상 진행 중</p>
            <p className="mt-2">세션 ID: {session?.user?.id || '정보 없음'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  

} 