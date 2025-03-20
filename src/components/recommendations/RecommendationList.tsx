"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";
import { checkUserRole } from "@/lib/utils";

interface Recommendation {
  id: string;
  type: "STRATEGY" | "SCHEDULE" | "SUBJECT" | "UNIT";
  subject: string;
  content: string;
  createdAt: string;
}

export default function RecommendationList() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const isTeacher = session?.user && checkUserRole(session.user, ["TEACHER", "ADMIN"]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        
        // 검색 파라미터 구성
        const params = new URLSearchParams();
        const type = searchParams.get("type");
        const subject = searchParams.get("subject");
        
        if (type) {
          params.append("type", type);
        }
        
        if (subject) {
          params.append("subject", subject);
        }

        const response = await fetch(`/api/recommendations?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("추천 목록을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        if (data.success) {
          setRecommendations(data.data);
        } else {
          throw new Error(data.error?.message || "추천 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session, searchParams]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말로 이 추천을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("추천을 삭제하는데 실패했습니다.");
      }

      const data = await response.json();
      if (data.success) {
        // 삭제 성공 후 목록 업데이트
        setRecommendations(recommendations.filter((rec) => rec.id !== id));
        toast.success("추천이 삭제되었습니다.");
      } else {
        throw new Error(data.error?.message || "추천을 삭제하는데 실패했습니다.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return "학습 전략";
      case "SCHEDULE":
        return "일정 계획";
      case "SUBJECT":
        return "과목 추천";
      case "UNIT":
        return "단원 추천";
      default:
        return "기타";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "STRATEGY":
        return "bg-blue-100 text-blue-800";
      case "SCHEDULE":
        return "bg-green-100 text-green-800";
      case "SUBJECT":
        return "bg-purple-100 text-purple-800";
      case "UNIT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 날짜 포맷팅 함수
  const formatRecommendationDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icons.spinner className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>AI 추천이 없습니다.</p>
        <p className="text-sm mt-2">
          <Link href="/recommendations/generate" className="text-blue-500 hover:underline">
            새 추천 생성하기
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {recommendations.map((recommendation) => (
        <div key={recommendation.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(recommendation.type)}`}>
                {getTypeLabel(recommendation.type)}
              </span>
              <span className="text-sm font-medium text-gray-700">{recommendation.subject}</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatRecommendationDate(recommendation.createdAt)}
            </span>
          </div>
          <div className="p-4">
            {isTeacher ? (
              // 교사용 뷰: 내용 요약 + 자세히 보기/삭제 버튼
              <>
                <p className="text-gray-700 line-clamp-3">{recommendation.content}</p>
                <div className="p-4 bg-gray-50 border-t flex justify-between">
                  <Link
                    href={`/recommendations/${recommendation.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    자세히 보기
                  </Link>
                  <button
                    onClick={() => handleDelete(recommendation.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </>
            ) : (
              // 학생용 뷰: 전체 내용 바로 표시
              <div className="whitespace-pre-line text-gray-700">
                {recommendation.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 