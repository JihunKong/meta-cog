import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DataManagementClient from "./DataManagementClient";

export const metadata: Metadata = {
  title: "데이터 관리 - 청해FLAME",
  description: "시스템 데이터 초기화 및 백업/복원을 관리합니다.",
};

export const dynamic = 'force-dynamic';

export default async function DataManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <DataManagementClient />;
} 