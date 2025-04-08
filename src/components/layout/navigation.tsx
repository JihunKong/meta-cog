import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut } from "lucide-react";

export function Navigation() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "STUDENT";

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="font-bold text-xl">
          청해FLAME
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          {session ? (
            <>
              {userRole === "STUDENT" && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">대시보드</Button>
                  </Link>
                  <Link href="/smart-goals">
                    <Button variant="ghost">SMART 목표</Button>
                  </Link>
                  <Link href="/study-sessions">
                    <Button variant="ghost">학습 세션</Button>
                  </Link>
                </>
              )}
              
              {userRole === "TEACHER" && (
                <>
                  <Link href="/teacher/dashboard">
                    <Button variant="ghost">교사 대시보드</Button>
                  </Link>
                  <Link href="/teacher/students">
                    <Button variant="ghost">학생 관리</Button>
                  </Link>
                  <Link href="/teacher/feedback">
                    <Button variant="ghost">피드백</Button>
                  </Link>
                </>
              )}
              
              {userRole === "ADMIN" && (
                <>
                  <Link href="/admin/dashboard">
                    <Button variant="ghost">관리자 대시보드</Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="ghost">사용자 관리</Button>
                  </Link>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">프로필</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/signout">
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button>로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 