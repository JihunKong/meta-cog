"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import Link from "next/link";
import { RecommendationType } from "@/types";

interface Recommendation {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  type: RecommendationType;
  created_at: string;
}

export default function RecommendationList() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RecommendationType | "ALL">("ALL");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recommendations");
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data);
      } else {
        toast.error("추천 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      toast.error("서버 오류가 발생했습니다.");
      console.error("추천 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("새로운 추천이 생성되었습니다!");
        fetchRecommendations();
      } else {
        toast.error(data.error?.message || "추천 생성에 실패했습니다.");
      }
    } catch (error) {
      toast.error("서버 오류가 발생했습니다.");
      console.error("추천 생성 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecommendations = activeTab === "ALL" 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeTab);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: RecommendationType) => {
    switch(type) {
      case "STRATEGY": return "학습 전략";
      case "SCHEDULE": return "학습 일정";
      case "SUBJECT": return "과목 추천";
      case "UNIT": return "단원 학습";
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI 추천 목록</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRecommendations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={generateRecommendations}
            disabled={isLoading}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            새 추천 생성
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ALL" value={activeTab} onValueChange={(value) => setActiveTab(value as RecommendationType | "ALL")}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="ALL">전체</TabsTrigger>
          <TabsTrigger value="STRATEGY">학습 전략</TabsTrigger>
          <TabsTrigger value="SCHEDULE">학습 일정</TabsTrigger>
          <TabsTrigger value="SUBJECT">과목 추천</TabsTrigger>
          <TabsTrigger value="UNIT">단원 학습</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">아직 추천이 없습니다.</p>
              <Button onClick={generateRecommendations}>
                <PlusCircle className="h-4 w-4 mr-2" />
                추천 생성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>
                          {recommendation.subject === "전체" 
                            ? getTypeLabel(recommendation.type) 
                            : `${recommendation.subject} - ${getTypeLabel(recommendation.type)}`}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(recommendation.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-line">
                      {recommendation.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 