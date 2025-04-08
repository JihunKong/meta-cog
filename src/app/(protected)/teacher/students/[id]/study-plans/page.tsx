import { Metadata } from "next";
import StudyPlansClient from "./StudyPlansClient";

export const metadata: Metadata = {
  title: "학생 학습 계획 목록 - 청해FLAME",
  description: "학생의 모든 학습 계획 목록을 확인합니다.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [
    { id: "fallback" },
  ];
}

export default function StudentStudyPlansPage({ params }: { params: { id: string } }) {
  return <StudyPlansClient studentId={params.id} />;
} 