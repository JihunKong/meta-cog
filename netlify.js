// netlify.js - Netlify에서 Next.js 앱을 빌드하기 위한 사용자 정의 설정
const fs = require('fs');
const path = require('path');

// next.config.js 파일이 있는지 확인
const configPath = path.resolve(__dirname, 'next.config.js');
if (!fs.existsSync(configPath)) {
  console.error('next.config.js 파일을 찾을 수 없습니다.');
  process.exit(1);
}

// next.config.js 파일 불러오기
const nextConfig = require('./next.config.js');

// Netlify 전용 설정 추가
const netlifyConfig = {
  ...nextConfig,
  // 빌드시 경고 무시
  future: {
    ...nextConfig.future,
    webpack5: true,
  },
  // Netlify 환경에서 이미지 최적화 비활성화
  images: {
    ...nextConfig.images,
    unoptimized: true,
  },
  // API 경로 지원
  target: 'experimental-serverless-trace',
  // Netlify 서버리스 함수와 최적 호환
  webpack: (config, options) => {
    // 기존 webpack 설정이 있으면 적용
    if (typeof nextConfig.webpack === 'function') {
      config = nextConfig.webpack(config, options);
    }

    // 서버리스 환경을 위한 추가 설정
    if (!options.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
};

module.exports = netlifyConfig; 