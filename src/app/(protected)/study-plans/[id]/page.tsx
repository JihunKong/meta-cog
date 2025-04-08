import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StudyPlanDetailWrapper from "@/components/study-plans/StudyPlanDetailWrapper";

export const metadata: Metadata = {
  title: "학습 계획 상세 - 청해FLAME",
  description: "학습 계획의 상세 정보를 확인하세요.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [
    { id: "fallback" },
  ];
}

interface StudyPlanDetailPageProps {
  params: {
    id: string;
  };
}

export default function StudyPlanDetailPage({ params }: StudyPlanDetailPageProps) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

  return (
    <StudyPlanDetailWrapper id={id} />
  );
} 