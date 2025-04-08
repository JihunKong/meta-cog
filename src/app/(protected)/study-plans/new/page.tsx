import { Metadata } from "next";
import StudyPlanClient from "./StudyPlanClient";

export const metadata: Metadata = {
  title: "새 학습 계획 - 청해FLAME",
  description: "새로운 학습 계획을 생성하세요.",
};

// 정적 내보내기를 위한 더미 파라미터
export async function generateStaticParams() {
  return [{}];
}

export default function NewStudyPlanPage() {
  return <StudyPlanClient />;
} 