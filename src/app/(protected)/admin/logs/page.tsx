import { Metadata } from "next";
import { AdminCheck } from "@/components/admin/AdminCheck";
import SystemLogs from "@/components/admin/SystemLogs";

export const metadata: Metadata = {
  title: "시스템 로그 - 청해FLAME",
  description: "시스템 로그를 확인합니다.",
};

export default function LogsPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">시스템 로그</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <SystemLogs />
        </div>
      </div>
    </AdminCheck>
  );
} 