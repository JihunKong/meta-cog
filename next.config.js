/** @type {import('next').NextConfig} */

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'meta-cog.netlify.app'],
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
    optimizeCss: {
      inline: true,
      critters: {
        logLevel: 'error',
        preload: 'media',
        inlineFonts: true,
      },
    },
    serverActions: {
      allowedOrigins: ['localhost:3000', 'meta-cog.netlify.app'],
    },
    disableStaticServer: true,
  },
  serverExternalPackages: ['next-auth'],
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
  transpilePackages: ['lucide-react'],
};

module.exports = withBundleAnalyzer(nextConfig);
