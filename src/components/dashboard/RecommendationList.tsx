"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AIRecommendation, UserRole } from "@/types";
import { Icons } from "@/components/ui/icons";
import { toast } from "react-hot-toast";
import { apiCall } from "@/lib/api-service";
import { checkUserRole } from "@/lib/utils";

export default function RecommendationList() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const isTeacher = session?.user && checkUserRole(session.user, ["TEACHER", "ADMIN"]);

  const fetchRecommendations = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const data = await apiCall<{success: boolean; data: AIRecommendation[]}>("/api/recommendations");
      
      if (data.success) {
        setRecommendations(data.data);
      } else {
        throw new Error(data.error?.message || "추천을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendation = async () => {
    if (!session?.user) return;
    
    try {
      setGenerating(true);
      const data = await apiCall<{success: boolean; data: AIRecommendation}>("/api/recommendations/generate", {
        method: "POST"
      });
      
      if (data.success) {
        toast.success("새로운 AI 추천이 생성되었습니다!");
        fetchRecommendations();
      } else {
        throw new Error(data.error?.message || "추천 생성에 실패했습니다.");
      }
    } catch (err) {
      console.error("추천 생성 오류:", err);
      toast.error((err as Error).message || "추천을 생성하는데 문제가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [session]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return <Icons.help className="h-5 w-5 text-purple-600" />;
      case "SCHEDULE":
        return <Icons.calendar className="h-5 w-5 text-blue-600" />;
      case "SUBJECT":
        return <Icons.book className="h-5 w-5 text-green-600" />;
      case "UNIT":
        return <Icons.book className="h-5 w-5 text-yellow-600" />;
      default:
        return <Icons.help className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationTypeText = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return "학습 전략";
      case "SCHEDULE":
        return "학습 일정";
      case "SUBJECT":
        return "과목 조언";
      case "UNIT":
        return "단원 조언";
      default:
        return "추천";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error && !generating) {
    return (
      <div className="text-center py-4 text-red-600 font-medium">
        <p>{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-2 text-sm text-blue-600 hover:underline font-bold"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 줄바꿈 텍스트를 HTML로 변환하는 함수
  const formatContent = (content: string) => {
    // 첫 줄 (제목)을 추출
    const lines = content.split('\n');
    const title = lines[0];
    const restContent = lines.slice(1).join('\n');
    
    return (
      <>
        <div className="font-bold text-gray-900 mb-2">{title}</div>
        <div className="whitespace-pre-line text-sm text-gray-800 font-medium">
          {restContent}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4">
      {isTeacher && (
        <div className="flex justify-end">
          <button
            onClick={generateRecommendation}
            disabled={generating}
            className="flex items-center text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-bold"
          >
            {generating ? (
              <Icons.spinner className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Icons.add className="mr-1.5 h-4 w-4" />
            )}
            새 추천 생성
          </button>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-medium">아직 추천이 없습니다.</p>
          {isTeacher ? (
            <p className="text-sm mt-1 text-blue-700">
              '새 추천 생성' 버튼을 클릭하여 AI 추천을 생성해보세요.
            </p>
          ) : (
            <p className="text-sm mt-1 text-blue-700">
              선생님이 AI 추천을 생성하면 이곳에서 확인할 수 있습니다.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {recommendations.slice(0, 5).map((recommendation) => (
            <div 
              key={recommendation.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-gray-100 p-2 rounded-full">
                  {getRecommendationIcon(recommendation.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900">
                      {recommendation.subject} - {getRecommendationTypeText(recommendation.type)}
                    </h4>
                    <span className="text-xs font-medium text-indigo-600">
                      {new Date(recommendation.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {formatContent(recommendation.content)}
                </div>
              </div>
            </div>
          ))}
          
          {recommendations.length > 5 && (
            <div className="text-center mt-4">
              <a
                href="/recommendations"
                className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors font-bold"
              >
                모든 추천 보기 ({recommendations.length - 5}개 더)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 