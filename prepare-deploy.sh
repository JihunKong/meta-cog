#!/bin/bash

# 배포 준비 스크립트
echo "청해FLAME AWS Lightsail 배포 준비 스크립트"

# 이전 빌드 결과물 제거
echo "1. 이전 빌드 제거 중..."
rm -rf .next

# 프로젝트 빌드
echo "2. 프로젝트 빌드 중..."
npm run build

# 도커 이미지 빌드
echo "3. 도커 이미지 빌드 중..."
docker build -t meta-cog .

# 기본 테스트
echo "4. 로컬 서버 테스트를 위한 Docker Compose 준비 중..."
echo "   다음 명령어로 로컬 테스트를 실행하세요:"
echo "   docker-compose up"

echo "5. 배포 파일 준비 완료"
echo "   - AWS Lightsail 배포 가이드: lightsail-deploy-guide.md"
echo "   - Lightsail 컨테이너 설정: lightsail-container.json"
echo ""
echo "환경 변수 설정 확인:"
echo "- .env.production 파일의 NEXTAUTH_URL을 실제 배포 URL로 업데이트하세요."

# 실행 권한 부여
chmod +x prepare-deploy.sh 