/** @type {import('next').NextConfig} */

const nextConfig = {
  // 기본 설정
  reactStrictMode: false,
  // 이미지 설정
  images: {
    unoptimized: true,
  },
  // 빌드 시 오류 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 정적 내보내기를 위한 설정
  output: 'export',
  distDir: '.next',
  // Netlify 배포를 위한 추가 설정
  trailingSlash: false,
};

module.exports = nextConfig;
