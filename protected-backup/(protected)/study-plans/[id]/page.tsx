"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import StudyPlanDetailWrapper from "@/components/study-plans/StudyPlanDetailWrapper";


interface StudyPlanDetailPageProps {
  params: {
    id: string;
  };
}

export default function StudyPlanDetailPage({ params }: StudyPlanDetailPageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/study-plans"
          className="text-blue-600 hover:text-blue-800"
        >
          ← 목록으로 돌아가기
        </Link>
      </div>
      <StudyPlanDetailWrapper id={params.id} />
    </div>
  );
} 