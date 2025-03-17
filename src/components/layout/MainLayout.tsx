"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Icons } from "@/components/ui/icons";
import { cn, getSiteUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
}

const studentNavItems: NavItem[] = [
  { title: "대시보드", href: "/dashboard", icon: "chart" },
  { title: "학습 계획", href: "/study-plans", icon: "book" },
  { title: "AI 추천", href: "/recommendations", icon: "help" },
  { title: "계정 설정", href: "/settings", icon: "settings" },
];

const teacherNavItems: NavItem[] = [
  { title: "교사 대시보드", href: "/teacher", icon: "chart" },
  { title: "학생 현황", href: "/teacher/students", icon: "user" },
  { title: "학습 통계", href: "/teacher/stats", icon: "pieChart" },
  { title: "계정 설정", href: "/settings", icon: "settings" },
];

const adminNavItems: NavItem[] = [
  { title: "관리자 대시보드", href: "/admin", icon: "chart" },
  { title: "사용자 관리", href: "/admin/users", icon: "user" },
  { title: "시스템 설정", href: "/admin/settings", icon: "settings" },
  { title: "계정 설정", href: "/settings", icon: "settings" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  
  // 사용자 역할에 따른 네비게이션 아이템 선택
  const getNavItems = () => {
    if (!session?.user?.role) return studentNavItems;
    
    switch (session.user.role) {
      case "ADMIN":
        return adminNavItems;
      case "TEACHER":
        return teacherNavItems;
      default:
        return studentNavItems;
    }
  };

  const navItems = getNavItems();

  // 현재 경로가 사용자의 역할에 맞는지 확인
  const isValidPath = () => {
    if (!session?.user?.role) return true;
    
    const path = pathname.toLowerCase();
    switch (session.user.role) {
      case "ADMIN":
        return path.startsWith("/admin");
      case "TEACHER":
        return path.startsWith("/teacher");
      case "STUDENT":
        return !path.startsWith("/admin") && !path.startsWith("/teacher");
      default:
        return true;
    }
  };

  // 잘못된 경로 접근 시 리다이렉트
  useEffect(() => {
    if (!isValidPath()) {
      switch (session?.user?.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "TEACHER":
          router.push("/teacher");
          break;
        case "STUDENT":
          router.push("/dashboard");
          break;
      }
    }
  }, [pathname, session]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* 모바일 사이드바 토글 버튼 */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded-md shadow-md"
      >
        {isSidebarOpen ? (
          <Icons.close className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Icons.menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* 사이드바 오버레이 (모바일) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 transition-transform bg-white dark:bg-gray-800 shadow flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* 사이드바 로고 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Icons.logo className="h-5 w-5 text-white" />
            </span>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">청해FLAME</h1>
          </Link>
        </div>

        {/* 스크롤 가능한 내용 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 사이드바 메뉴 */}
          <nav className="py-6 px-3 space-y-1">
            {getNavItems().map((item) => {
              const Icon = Icons[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                    pathname === item.href
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/30"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 사용자 정보 및 로그아웃 - 고정 위치 */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          {session?.user && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold">{session.user.name || session.user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user.role === "ADMIN"
                    ? "관리자"
                    : session.user.role === "TEACHER"
                    ? "교사"
                    : "학생"}
                </p>
              </div>
              <button
                onClick={() => signOut({ 
                  callbackUrl: getSiteUrl() + "/auth/signin" 
                })}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors rounded-md"
              >
                <Icons.logout className="mr-2 h-4 w-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div
        className={cn(
          "transition-all duration-200 min-h-screen",
          isSidebarOpen ? "md:ml-64" : ""
        )}
      >
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 