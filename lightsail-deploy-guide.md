# AWS Lightsail 배포 가이드

이 가이드는 청해FLAME 애플리케이션을 AWS Lightsail 컨테이너 서비스에 배포하는 방법을 설명합니다.

## 사전 준비사항

1. [AWS 계정](https://aws.amazon.com/) 생성
2. [AWS CLI](https://aws.amazon.com/cli/) 설치
3. [Docker](https://www.docker.com/get-started) 설치

## 배포 단계

### 1. 이미지 빌드 및 테스트

로컬에서 Docker 이미지를 빌드하고 테스트합니다:

```bash
# Docker 이미지 빌드
docker build -t meta-cog .

# 로컬에서 테스트 실행
docker run -p 3000:3000 meta-cog
```

또는 docker-compose를 사용할 수 있습니다:

```bash
docker-compose up --build
```

### 2. AWS Lightsail 컨테이너 서비스 생성

1. [AWS Lightsail 콘솔](https://lightsail.aws.amazon.com/ls/webapp/home/containers)에 로그인
2. "컨테이너 서비스 생성" 버튼 클릭
3. 리전 선택 (예: 서울 또는 도쿄)
4. 서비스 크기 선택 (시작: Micro - 512MB RAM, 0.25 vCPU, $5/month)
5. 서비스 이름 지정 (예: meta-cog)
6. "컨테이너 서비스 생성" 버튼 클릭

### 3. 환경 설정

1. 생성된 컨테이너 서비스의 "배포" 탭 선택
2. "JSON 파일에서 이미지 수정/추가" 선택
3. `lightsail-container.json` 파일 업로드
4. Docker 이미지를 Amazon ECR이나 Docker Hub에 푸시하고 해당 이미지 URL 추가

### 4. 영구 스토리지 설정

1. "스토리지" 탭 선택
2. 데이터베이스를 위한 영구 스토리지 추가 (예: /data)

### 5. 환경 변수 설정

1. "배포" 탭에서 "환경 변수" 섹션 확인
2. 다음 중요 환경 변수 설정 (또는 이미지 내 .env.production 파일 사용):
   - `NEXTAUTH_URL`: 컨테이너 서비스의 퍼블릭 엔드포인트 URL
   - `DATABASE_URL`: `file:/data/dev.db`

### 6. 배포

1. "배포" 버튼 클릭
2. 배포 상태 모니터링

### 7. 도메인 설정 (선택사항)

1. 사용자 지정 도메인을 Lightsail 컨테이너 서비스에 연결
2. HTTPS 활성화

## 주의사항

1. Google OAuth가 작동하려면 OAuth 콘솔에서 리디렉션 URI를 새 도메인으로 업데이트해야 합니다.
2. `.env.production` 파일의 `NEXTAUTH_URL`을 실제 도메인이나 IP로 업데이트해야 합니다.
3. 처음 배포 후 관리자 계정을 설정하고 데이터베이스 초기화를 진행하세요.

## 유지 관리

- 데이터베이스 백업: 주기적으로 `/data` 볼륨 백업
- 로그 확인: Lightsail 콘솔에서 로그 확인
- 업데이트: 새 버전을 배포할 때 동일한 배포 과정 반복

## 문제 해결

- 500 에러: 로그 확인 후 환경 변수와 데이터베이스 연결 확인
- 인증 오류: Google OAuth 설정과 `NEXTAUTH_URL` 확인
- 컨테이너 시작 실패: Dockerfile과 환경 변수 설정 확인 