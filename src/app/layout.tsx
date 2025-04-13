"use client";

import "./globals.css";
import { Roboto } from "next/font/google";
import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "@/theme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 사이드에서만 실행되도록 함
  useEffect(() => {
    setMounted(true);
    // 사용자 시스템 설정에 따라 다크모드 설정
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
  }, []);

  // SSR 중에는 테마를 적용하지 않음
  if (!mounted) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={roboto.className}>
          <div style={{ visibility: 'hidden' }}>{children}</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <title>Meta-Cog - 학습 메타인지 플랫폼</title>
        <meta name="description" content="학생들의 학습 과정을 추적하고 교사가 효과적으로 관리할 수 있는 메타인지 플랫폼" />
      </head>
      <body className={roboto.className}>
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
          <MuiThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            {children}
          </MuiThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
