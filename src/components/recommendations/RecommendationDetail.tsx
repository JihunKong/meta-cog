"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { AIRecommendation, UserRole } from "@/types";
import { Icons } from "@/components/ui/icons";
import { apiCall } from "@/lib/api-service";
import { checkUserRole } from "@/lib/utils";

interface RecommendationDetailProps {
  id: string;
}

interface Recommendation {
  id: string;
  type: "STRATEGY" | "SCHEDULE" | "SUBJECT" | "UNIT";
  subject: string;
  content: string;
  createdAt: string;
}

export default function RecommendationDetail({ id }: RecommendationDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isTeacher = session?.user && checkUserRole(session.user, ["TEACHER", "ADMIN"]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchRecommendation() {
      if (!session?.user) return;
      
      try {
        const response = await fetch(`/api/recommendations/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("추천을 찾을 수 없습니다.");
          }
          throw new Error("추천을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        if (data.success) {
          setRecommendation(data.data);
        } else {
          throw new Error(data.error?.message || "추천을 불러오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("추천 불러오기 오류:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("추천을 불러오는데 문제가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendation();
  }, [id, session]);

  const handleDelete = async () => {
    if (!window.confirm("정말 이 추천을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleting(true);
      
      const result = await apiCall(`/api/recommendations/${id}`, {
        method: "DELETE",
      });
      
      if (result.success) {
        toast.success("추천이 삭제되었습니다");
        router.push("/recommendations");
      } else {
        throw new Error(result.error?.message || "추천을 삭제하는데 실패했습니다");
      }
    } catch (error) {
      console.error("추천 삭제 오류:", error);
      toast.error("추천을 삭제하는데 문제가 발생했습니다");
    } finally {
      setDeleting(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">추천을 찾을 수 없습니다.</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(recommendation.type)}`}>
            {getTypeLabel(recommendation.type)}
          </span>
          <h2 className="text-xl font-bold">{recommendation.subject}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-200"
          >
            뒤로 가기
          </button>
          
          {isTeacher && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              {deleting ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.trash className="h-4 w-4" />
              )}
              삭제
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <pre className="whitespace-pre-wrap text-gray-700 font-sans">
          {recommendation.content}
        </pre>
      </div>
    </div>
  );
} 