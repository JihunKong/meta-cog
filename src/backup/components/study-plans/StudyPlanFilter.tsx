"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";

// 과목 목록 직접 정의
const SUBJECTS = ["국어", "영어", "수학", "과학", "사회"];

export default function StudyPlanFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    searchParams.get("subject")
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get("date")
  );

  const handleSubjectChange = (subject: string) => {
    const newSubject = selectedSubject === subject ? null : subject;
    setSelectedSubject(newSubject);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newSubject) {
      params.set("subject", newSubject);
    } else {
      params.delete("subject");
    }
    router.push(`?${params.toString()}`);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    setSelectedDate(date);
    
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            onClick={() => handleSubjectChange(subject)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedSubject === subject
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            날짜 선택
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate || ""}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
} 