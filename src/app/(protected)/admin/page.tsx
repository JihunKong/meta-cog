import { Metadata } from "next";
import Link from "next/link";
import AdminStats from "@/components/admin/AdminStats";
import { AdminCheck } from "@/components/admin/AdminCheck";
import UsersList from "@/components/admin/UsersList";
import { Icons } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "관리자 대시보드 - 청해FLAME",
  description: "시스템 관리 및 통계 확인을 위한 관리자 대시보드입니다.",
};

export default function AdminDashboardPage() {
  return (
    <AdminCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <AdminStats />
          
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">관리 메뉴</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/admin/users" 
                className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
              >
                <div className="flex items-center">
                  <Icons.user className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="font-medium text-blue-800">사용자 관리</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">사용자 계정 및 권한 관리</p>
              </Link>
              
              <Link 
                href="/admin/data" 
                className="p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition"
              >
                <div className="flex items-center">
                  <Icons.trash className="h-5 w-5 mr-2 text-red-600" />
                  <h3 className="font-medium text-red-800">데이터 관리</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">데이터 초기화 및 백업/복원</p>
              </Link>
            </div>
          </div>
          
          <div className="md:col-span-3 bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">최근 가입 사용자</h2>
              <Link 
                href="/admin/users" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                모든 사용자 보기
              </Link>
            </div>
            <UsersList limit={5} />
          </div>
        </div>
      </div>
    </AdminCheck>
  );
} 