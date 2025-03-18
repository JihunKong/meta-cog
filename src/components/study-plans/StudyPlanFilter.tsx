"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 과목 목록 직접 정의
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function StudyPlanFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  
  // 필터 적용
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (subject) {
      params.set("subject", subject);
    }
    
    if (startDate) {
      params.set("startDate", startDate);
    }
    
    if (endDate) {
      params.set("endDate", endDate);
    }

    router.push(`/study-plans?${params.toString()}`);
  };

  // 필터 초기화
  const resetFilters = () => {
    setSubject("");
    setStartDate("");
    setEndDate("");
    router.push("/study-plans");
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-medium mb-4">학습 계획 필터</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            시작일
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            종료일
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
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