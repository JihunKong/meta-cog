"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AdminCheck } from "@/components/admin/AdminCheck";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// AIRecommendation 타입 정의
interface AIRecommendation {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  type: string;
  created_at: Date;
}

export default function RecommendationsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations');
        if (!response.ok) throw new Error('추천 목록을 불러오는데 실패했습니다.');
        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast.error('추천 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 AI 추천을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('AI 추천 삭제에 실패했습니다.');
      }

      setRecommendations(prev => prev.filter(rec => rec.id !== id));
      toast.success('AI 추천이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('AI 추천 삭제에 실패했습니다.');
    }
  };

  // 내용에서 제목 추출
  const extractTitle = (content: string): string => {
    // 첫 번째 줄을 제목으로 사용
    const lines = content.split('\n');
    return lines[0].replace(/\[|\]/g, '').trim() || '제목 없음';
  };

  // 추천 타입 레이블 변환
  const getTypeLabel = (type: string): string => {
    switch(type) {
      case "STRATEGY": return "학습 전략";
      case "SCHEDULE": return "학습 일정";
      case "SUBJECT": return "과목 추천";
      case "UNIT": return "단원 학습";
      default: return type;
    }
  };

  return (
    <AdminCheck>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI 추천 관리</h1>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline">대시보드로 돌아가기</Button>
            </Link>
            <Link href="/admin/recommendations/create">
              <Button>새 AI 추천 생성</Button>
            </Link>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-center py-10">등록된 AI 추천이 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>과목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((recommendation) => (
                <TableRow key={recommendation.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/recommendations/${recommendation.id}`} className="hover:underline">
                      {extractTitle(recommendation.content)}
                    </Link>
                  </TableCell>
                  <TableCell>{recommendation.subject}</TableCell>
                  <TableCell>{getTypeLabel(recommendation.type)}</TableCell>
                  <TableCell>{new Date(recommendation.created_at).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(recommendation.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminCheck>
  );
} 