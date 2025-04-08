import { Metadata } from "next";
import StudyPlansClient from "./StudyPlansClient";

export const metadata: Metadata = {
  title: "학습 계획 관리 - 청해FLAME",
  description: "학습 계획을 관리하고 달성률을 추적하세요.",
};

export default function StudyPlansPage() {
  return <StudyPlansClient />;
} 