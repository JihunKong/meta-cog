import { Metadata } from "next";
import { AdminCheck } from "@/components/admin/AdminCheck";
import DataManagement from "@/components/admin/DataManagement";

export const metadata: Metadata = {
  title: "데이터 관리 - 청해FLAME",
  description: "시스템 데이터 초기화 및 백업/복원을 관리합니다.",
};

export default function DataManagementPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">데이터 관리</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <DataManagement />
        </div>
      </div>
    </AdminCheck>
  );
} 