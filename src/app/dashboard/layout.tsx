import ProtectedRoute from "@/components/auth/ProtectedRoute";

// dashboard/layout.tsx 파일 내용을 확인해야 정확한 수정이 가능합니다.
// 예시 코드:

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={["STUDENT", "TEACHER", "ADMIN"]}>
      {/* 레이아웃 내용 */}
      {children}
    </ProtectedRoute>
  );
} 