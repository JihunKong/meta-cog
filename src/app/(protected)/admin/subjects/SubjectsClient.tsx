"use client";

import SubjectsList from "@/components/admin/SubjectsList";

export default function SubjectsClient() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">과목 관리</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <SubjectsList />
      </div>
    </div>
  );
} 