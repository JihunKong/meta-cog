/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    // ESLint를 실행하지만 빌드를 중단하지 않음
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 체크를 무시하고 빌드 진행
    ignoreBuildErrors: true,
  },
  // 정적 내보내기 설정
  output: 'standalone',
  // 정적 내보내기 과정에서 제외할 페이지
  experimental: {
    // 정적 내보내기 과정에서 동적 라우트를 제외
    excludeDefaultMomentLocales: true,
    // next-auth를 서버 컴포넌트에서 사용할 수 있도록 설정
    serverComponentsExternalPackages: ['next-auth'],
  },
  // 서버 컴포넌트에서 외부 패키지 사용 설정
  serverExternalPackages: ['next-auth'],
};

module.exports = nextConfig; 