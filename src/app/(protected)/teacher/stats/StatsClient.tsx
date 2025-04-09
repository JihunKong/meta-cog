"use client";

import { TeacherCheck } from "@/components/teacher/TeacherCheck";
import { TeacherStats } from "@/components/teacher/TeacherStats";

export default function StatsClient() {
  return (
    <TeacherCheck>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">교사 통계</h1>
        <TeacherStats />
      </div>
    </TeacherCheck>
  );
} 