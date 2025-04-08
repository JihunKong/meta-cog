import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SubjectsClient from "./SubjectsClient";

export const metadata: Metadata = {
  title: "과목 관리 - 청해FLAME",
  description: "과목 관리 페이지입니다.",
};

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <SubjectsClient />;
} 