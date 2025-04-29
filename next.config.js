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

  distDir: '.next',
  // Netlify 배포를 위한 추가 설정
  trailingSlash: false,
  // 배포를 위한 추가 설정
  // 서버 사이드 렌더링을 지원하는 플랫폼에 배포하는 것이 좋습니다.
};

module.exports = nextConfig;
