"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { apiCall } from "@/lib/api-service";

// 시간대 정의
const TIME_SLOTS = [
  { id: "19-20:15", label: "19시 00분~20시 15분" },
  { id: "20:35-21:50", label: "20시 35분~21시 50분" },
];

// 과목 목록 정의
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

// 달성률 옵션
const ACHIEVEMENT_OPTIONS = [
  { value: 0, label: "0% - 전혀 하지 못했어요" },
  { value: 10, label: "10% - 아주 조금 했어요" },
  { value: 20, label: "20% - 시작해보았어요" },
  { value: 30, label: "30% - 조금 진행했어요" },
  { value: 40, label: "40% - 절반을 향해 가고 있어요" },
  { value: 50, label: "50% - 절반 정도 했어요" },
  { value: 60, label: "60% - 절반을 넘었어요" },
  { value: 70, label: "70% - 많이 진행했어요" },
  { value: 80, label: "80% - 거의 다 했어요" },
  { value: 90, label: "90% - 마무리 단계예요" },
  { value: 100, label: "100% - 모두 완료했어요!" },
];

type StudyPlanFormProps = {
  initialData?: {
    id: string;
    date: string;
    timeSlot: string;
    subject: string;
    content: string;
    achievement: number;
    reflection?: string;
  };
};

export default function StudyPlanForm({ initialData }: StudyPlanFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    timeSlot: initialData?.timeSlot || TIME_SLOTS[0].id,
    subject: initialData?.subject || "",
    content: initialData?.content || "",
    achievement: initialData?.achievement || 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "achievement") {
      // 달성률 변경 시 숫자로 변환
      const percent = parseInt(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: percent
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 폼 제출 전 데이터 정리
  const prepareFormData = () => {
    return formData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    try {
      const url = initialData
        ? `/api/study-plans/${initialData.id}`
        : "/api/study-plans";
      const method = initialData ? "PATCH" : "POST";

      // 필수 필드가 누락되었는지 확인
      if (!formData.subject || !formData.content || !formData.date || !formData.timeSlot) {
        throw new Error("필수 항목이 누락되었습니다. 모든 필드를 입력해주세요.");
      }

      const dataToSend = {
        ...formData,
        targetAchievement: 100, // 기본값 설정
        date: new Date(formData.date).toISOString(),
        time_slot: formData.timeSlot, // Supabase 필드명 호환성 추가
      };

      console.log("[폼 제출] 서버로 전송할 데이터:", dataToSend);
      console.log("[폼 제출] 요청 URL:", url);
      console.log("[폼 제출] 요청 메소드:", method);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });

        console.log("[폼 제출] 응답 상태:", response.status);
        const contentType = response.headers.get('content-type');
        console.log("[폼 제출] 응답 콘텐츠 타입:", contentType);

        let responseData;
        try {
          const responseText = await response.text();
          console.log("[폼 제출] 응답 텍스트:", responseText);
          
          try {
            responseData = JSON.parse(responseText);
            console.log("[폼 제출] 응답 데이터:", responseData);
          } catch (parseError) {
            console.error("[폼 제출] JSON 파싱 오류:", parseError);
            throw new Error("서버 응답을 파싱할 수 없습니다: " + responseText);
          }
        } catch (textError) {
          console.error("[폼 제출] 응답 텍스트 읽기 오류:", textError);
          throw new Error("서버 응답을 읽을 수 없습니다.");
        }

        if (!response.ok) {
          const errorMessage = responseData?.error?.message || "학습 계획을 저장하는데 실패했습니다.";
          console.error("[폼 제출] 응답 오류:", errorMessage);
          throw new Error(errorMessage);
        }

        if (responseData.success) {
          toast.success(
            initialData ? "학습 계획이 수정되었습니다." : "새 학습 계획이 생성되었습니다."
          );
          console.log("[폼 제출] 성공, 리디렉션 수행");
          router.push("/study-plans");
        } else {
          const errorMessage = responseData.error?.message || "학습 계획을 저장하는데 실패했습니다.";
          console.error("[폼 제출] 성공 플래그 없음:", errorMessage);
          throw new Error(errorMessage);
        }
      } catch (fetchError) {
        console.error("[폼 제출] 네트워크 오류:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("[폼 제출] 최종 오류:", error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            날짜
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
            시간대
          </label>
          <select
            id="timeSlot"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            과목
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">과목 선택</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          학습 내용
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="이 시간에 무엇을 공부할지 구체적으로 적어주세요. (예: 영어단어 100개 외우기, 수학 문제 20문제 풀기 등)"
        />
        <p className="text-xs text-gray-500 mt-1">
          SMART 목표 기법에 따라 구체적인 목표를 설정하세요. (구체적이고, 측정 가능하며, 달성 가능하고, 관련성이 있으며, 기한이 있는 목표)
        </p>
      </div>

      {initialData && (
        <div className="space-y-2">
          <label htmlFor="achievement" className="block text-sm font-medium text-gray-700">
            달성률
          </label>
          <select
            id="achievement"
            name="achievement"
            value={formData.achievement}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {ACHIEVEMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-semibold">{formData.achievement}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  formData.achievement >= 100
                    ? "bg-green-500"
                    : formData.achievement >= 75
                    ? "bg-blue-500"
                    : formData.achievement >= 50
                    ? "bg-indigo-500" 
                    : formData.achievement >= 25
                    ? "bg-yellow-500"
                    : "bg-gray-300"
                }`}
                style={{ width: `${formData.achievement}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? "저장 중..." : initialData ? "수정하기" : "저장하기"}
        </button>
      </div>
    </form>
  );
} 