import "./globals.css";

export const metadata = {
  title: "Meta-Cog - 학습 메타인지 플랫폼",
  description: "학생들의 학습 과정을 추적하고 교사가 효과적으로 관리할 수 있는 메타인지 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
