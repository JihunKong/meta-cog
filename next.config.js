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
    serverActions: {
      allowedOrigins: ['localhost:3000', 'meta-cog.netlify.app']
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // 정적 내보내기 대신 서버 렌더링 사용
  output: 'standalone',
};

module.exports = nextConfig; 