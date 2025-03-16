import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ESLint를 실행하지만 빌드를 중단하지 않음
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 체크를 무시하고 빌드 진행
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
