"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Icons } from "@/components/ui/icons";

export default function RecommendationGenerator() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: "STRATEGY",
    subject: "",
    additionalInfo: "",
  });

  // 과목 목록을 가져오는 함수
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const response = await fetch("/api/subjects");
        if (!response.ok) throw new Error("과목 목록을 불러오는데 실패했습니다.");
        const data = await response.json();
        setSubjects(data);
        
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, subject: data[0] }));
        }
      } catch (error) {
        console.error("과목 목록 불러오기 오류:", error);
        toast.error("과목 목록을 불러오는데 문제가 발생했습니다.");
      }
    }

    fetchSubjects();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject) {
      toast.error("과목을 선택해주세요.");
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("AI 추천 생성에 실패했습니다.");
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success("새로운 AI 추천이 생성되었습니다.");
        router.push(`/recommendations/${data.data.id}`);
      } else {
        throw new Error(data.error?.message || "AI 추천 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("AI 추천 생성 오류:", error);
      toast.error("AI 추천을 생성하는데 문제가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            추천 유형
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            disabled={generating}
          >
            <option value="STRATEGY">학습 전략</option>
            <option value="SCHEDULE">일정 계획</option>
            <option value="SUBJECT">과목 추천</option>
            <option value="UNIT">단원 추천</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.type === "STRATEGY" && "학습 방법과 전략에 대한 추천을 받습니다."}
            {formData.type === "SCHEDULE" && "효율적인 학습 일정에 대한 추천을 받습니다."}
            {formData.type === "SUBJECT" && "집중해야 할 과목에 대한 추천을 받습니다."}
            {formData.type === "UNIT" && "중점적으로 학습해야 할 단원에 대한 추천을 받습니다."}
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            과목
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            disabled={generating}
          >
            <option value="">과목 선택</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
            추가 정보 (선택사항)
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder="AI가 참고할 만한 추가 정보를 입력하세요. (예: 어려움을 겪는 부분, 목표 등)"
            disabled={generating}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
        <h3 className="text-md font-medium mb-2">AI 추천 생성 안내</h3>
        <p className="text-sm">
          AI는 여러분의 학습 데이터와 패턴을 분석하여 맞춤형 추천을 제공합니다.
          더 정확한 추천을 위해 추가 정보를 입력해주세요.
          추천 생성에는 약 10-30초가 소요될 수 있습니다.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={generating}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={generating}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <Icons.spinner className="animate-spin h-4 w-4" />
              <span>생성 중...</span>
            </>
          ) : (
            "추천 생성하기"
          )}
        </button>
      </div>
    </form>
  );
} 