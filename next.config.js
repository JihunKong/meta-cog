/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
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
    serverActions: true,
  },
  // 서버 컴포넌트에서 외부 패키지 사용 설정
  serverExternalPackages: ['next-auth'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig; 