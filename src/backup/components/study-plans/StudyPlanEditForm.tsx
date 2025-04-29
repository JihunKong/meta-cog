"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import StudyPlanForm from "./StudyPlanForm";

interface StudyPlanEditFormProps {
  id: string;
}

interface StudyPlan {
  id: string;
  date: string;
  timeSlot: string;
  subject: string;
  content: string;
  achievement: number;
  reflection?: string;
  target?: number;
}

export default function StudyPlanEditForm({ id }: StudyPlanEditFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStudyPlan() {
      try {
        const response = await fetch(`/api/study-plans/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("학습 계획을 찾을 수 없습니다.");
          }
          throw new Error("학습 계획을 불러오는데 실패했습니다.");
        }
        
        const data = await response.json();
        setStudyPlan(data.data);
        setLoading(false);
      } catch (error) {
        console.error("학습 계획 불러오기 오류:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("학습 계획을 불러오는데 문제가 발생했습니다.");
        }
        setLoading(false);
      }
    }

    fetchStudyPlan();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
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

  if (!studyPlan) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">학습 계획을 찾을 수 없습니다.</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return <StudyPlanForm initialData={studyPlan} />;
} 