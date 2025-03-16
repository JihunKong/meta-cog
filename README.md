# 청해FLAME

청해FLAME은 학생들의 학습 현황을 관리하고 분석하는 교육 관리 플랫폼입니다.

## 주요 기능

- 학생 대시보드: 학습 계획, 달성률, AI 추천
- 교사 대시보드: 학생 현황 모니터링, 통계, 학습 계획 관리
- 관리자 기능: 사용자 관리, 데이터 관리, 시스템 설정

## 개발 환경 설정

```bash
# 저장소 복제
git clone <repository-url>
cd meta-cog

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## AWS Lightsail 배포 가이드

AWS Lightsail 컨테이너 서비스에 배포하기 위한 자세한 가이드는 [lightsail-deploy-guide.md](./lightsail-deploy-guide.md) 문서를 참조하세요.

주요 배포 단계:
1. Docker 이미지 빌드 및 테스트
2. AWS Lightsail 컨테이너 서비스 생성
3. 환경 변수 및 스토리지 설정
4. 배포 및 모니터링

## 기술 스택

- Frontend: React.js, Next.js, TailwindCSS
- Backend: Node.js, Next.js API Routes
- 데이터베이스: SQLite (Prisma ORM)
- 인증: NextAuth.js
- AI: Claude API

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Claude API
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database
DATABASE_URL="file:./dev.db"

# Admin Emails
ADMIN_EMAILS="admin@example.com"
```

## 라이센스

Copyright © 2023
