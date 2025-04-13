/** @type {import('next').NextConfig} */

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

// 환경 변수 설정
const NEXT_DISABLE_STATIC_GENERATION = process.env.NEXT_DISABLE_STATIC_GENERATION === 'true' || true;
const SKIP_STATIC_GENERATION = process.env.SKIP_STATIC_GENERATION === 'true' || true;

const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost', 'meta-cog.netlify.app', 'pure-ocean.netlify.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
    };
    return config;
  },
  transpilePackages: ['lucide-react', 'next-auth'],
  // Netlify 최적화 설정
  staticPageGenerationTimeout: 180,
  // 정적 생성 완전 비활성화
  output: 'standalone',
  // Next.js 15 빌드 오류 해결
  experimental: {
    // 정적 생성 비활성화
    disableStaticGeneration: NEXT_DISABLE_STATIC_GENERATION,
    // 서버 컴포넌트만 사용
    serverComponents: true,
    // 정적 페이지 생성 중 오류가 발생해도 빌드 계속 진행
    skipTrailingSlashRedirect: true,
    scrollRestoration: true,
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'meta-cog-dashboard.netlify.app']
    }
  },
  distDir: '.next',
  // Netlify 배포를 위한 추가 설정
  trailingSlash: false,
  // 페이지 정적 생성 옵션
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {
    // React 후크 오류 해결
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Netlify 배포를 위한 추가 설정
    optimizeCss: true,
    scrollRestoration: true
  }
};

module.exports = withBundleAnalyzer(nextConfig);
