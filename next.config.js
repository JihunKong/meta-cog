/** @type {import('next').NextConfig} */

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com', 'avatar.vercel.sh'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', '@heroicons/react'],
    serverMinification: true,
    optimizeCss: true,
    turbotrace: {
      logLevel: 'error'
    }
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), 'react', 'react-dom'];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // 프로덕션에서만 적용되는 최적화
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        innerGraph: true,
        mangleExports: true,
      };
    }

    if (!isServer) {
      // 클라이언트 사이드에서 모듈을 분할하여 번들 크기 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        maxSize: 250000
      };
    }

    // 불필요한 패키지 번들링 제외
    if (isServer) {
      config.externals = [...config.externals, 'canvas', 'jsdom'];
    }
    
    // JSON 파일 최적화
    config.module.rules.push({
      test: /\.json$/,
      type: 'javascript/auto',
      use: ['json-loader']
    });

    return config;
  },
  transpilePackages: ['lucide-react'],
  output: 'standalone',
};

module.exports = withBundleAnalyzer(nextConfig);
