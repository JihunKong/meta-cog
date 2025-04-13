/** @type {import('next').NextConfig} */

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

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
    unoptimized: process.env.NODE_ENV === 'development' ? false : true,
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
