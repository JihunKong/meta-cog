/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    unoptimized: true
  },
  eslint: {
    // ESLint를 실행하지만 빌드를 중단하지 않음
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 체크를 무시하고 빌드 진행
    ignoreBuildErrors: true,
  },
  // 서버 컴포넌트에서 사용할 외부 패키지 지정
  serverExternalPackages: ['next-auth'],
  experimental: {
    // 서버 액션 설정
    serverActions: {
      allowedOrigins: ['localhost:3000', 'meta-cog.netlify.app']
    },
    // 캐시 관련 설정
    disableStaticServer: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // 서버 렌더링 모드 사용
  output: 'standalone',
};

module.exports = nextConfig; 