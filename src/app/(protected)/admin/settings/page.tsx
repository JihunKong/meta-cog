import { Metadata } from "next";
import { AdminCheck } from "@/components/admin/AdminCheck";
import SystemSettings from "@/components/admin/SystemSettings";

export const metadata: Metadata = {
  title: "시스템 설정 - 청해FLAME",
  description: "시스템 설정 및 환경 관리 페이지입니다.",
};

export default function SettingsPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">시스템 설정</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <SystemSettings />
        </div>
      </div>
    </AdminCheck>
  );
} 