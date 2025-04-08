import { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "관리자 대시보드 - 청해FLAME",
  description: "시스템 관리 및 통계 확인을 위한 관리자 대시보드입니다.",
};

export default function AdminDashboardPage() {
  return <AdminClient />;
} 