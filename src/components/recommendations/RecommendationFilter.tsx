"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 기본 과목 목록 정의
const DEFAULT_SUBJECTS = ["국어", "영어", "수학", "과학", "사회", "역사"];

export default function RecommendationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [type, setType] = useState(searchParams.get("type") || "");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(false);

  // 과목 목록을 가져오는 함수
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch("/api/subjects");
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setSubjects(data.data);
          } else {
            // API 응답이 예상 형식이 아닌 경우 기본 과목 목록 사용
            setSubjects(DEFAULT_SUBJECTS);
          }
        }
      } catch (error) {
        console.error("과목 목록을 가져오는데 실패했습니다:", error);
        // 오류 발생 시 기본 과목 목록 사용
        setSubjects(DEFAULT_SUBJECTS);
      }
    };

    fetchSubjects();
  }, []);

  // 필터 적용
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (type) {
      params.set("type", type);
    }
    
    if (subject) {
      params.set("subject", subject);
    }

    router.push(`/recommendations?${params.toString()}`);
  };

  // 필터 초기화
  const resetFilters = () => {
    setType("");
    setSubject("");
    router.push("/recommendations");
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-medium mb-4">추천 필터</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            추천 유형
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">모든 유형</option>
            <option value="STRATEGY">학습 전략</option>
            <option value="SCHEDULE">일정 계획</option>
            <option value="SUBJECT">과목 추천</option>
            <option value="UNIT">단원 추천</option>
          </select>
        </div>
        
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            과목
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">모든 과목</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={resetFilters}
          className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
        >
          초기화
        </button>
        <button
          onClick={applyFilters}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          적용
        </button>
      </div>
    </div>
  );
} 