/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com', 'images.unsplash.com'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Netlify 특화 설정
  target: 'serverless',
  webpack: (config, { isServer }) => {
    // 외부 패키지를 위한 폴백 제공
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
  // Netlify에서 정적 페이지 생성 타임아웃 방지
  staticPageGenerationTimeout: 180,
  distDir: process.env.BUILD_DIR || '.next',
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', '@prisma/client'],
    optimizeCss: true,
  },
  env: {
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
