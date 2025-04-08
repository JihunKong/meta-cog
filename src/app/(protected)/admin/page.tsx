import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "관리자 대시보드 - 청해FLAME",
  description: "관리자 대시보드입니다.",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminClient />;
} 