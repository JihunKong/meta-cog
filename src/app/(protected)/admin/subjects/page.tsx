import { Metadata } from "next";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";
import SubjectsClient from "./SubjectsClient";

export const metadata: Metadata = {
  title: "과목 관리 - 청해FLAME",
  description: "과목 관리 페이지입니다.",
};

export const dynamic = 'force-dynamic';

function SubjectsPage() {
  return <SubjectsClient />;
}

export default withAdminAuth(SubjectsPage, { metadata }); 