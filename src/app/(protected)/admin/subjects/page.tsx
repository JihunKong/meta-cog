import { Metadata } from "next";
import SubjectsClient from "./SubjectsClient";

export const metadata: Metadata = {
  title: "과목 관리 - 청해FLAME",
  description: "과목 목록 및 관리 페이지입니다.",
};

export default function SubjectsPage() {
  return <SubjectsClient />;
} 