"use client";

// 정적 생성 비활성화
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Box, 
  CircularProgress, 
  Typography,
  useTheme
} from "@mui/material";

export default function Home() {
  const { data: session, status } = useSession({ required: false });
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    // 로딩 중일 때는 아무 작업도 하지 않음
    if (status === "loading") return;

    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!session) {
      router.push(`/auth/signin`);
      return;
    }

    // 사용자 역할에 따라 다른 페이지로 리다이렉트
    const userRole = session.user?.role;

    if (userRole === "ADMIN") {
      router.push(`/admin`);
    } else if (userRole === "TEACHER") {
      router.push(`/teacher`);
    } else {
      router.push(`/dashboard`);
    }
  }, [session, status, router]);

  // 로딩 상태일 때 표시할 UI
  if (status === "loading") {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: theme.palette.background.default
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.secondary }}>
          로딩 중...
        </Typography>
      </Box>
    );
  }

  // 리다이렉트되는 동안 빈 화면 표시
  return null;
}
