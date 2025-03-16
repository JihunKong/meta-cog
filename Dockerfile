FROM node:18-alpine

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# .env.production 파일이 없으면 .env.local 파일을 복사
RUN if [ ! -f .env.production ]; then cp -n .env.local .env.production || true; fi

# 애플리케이션 빌드
RUN npm run build

# 실행 명령
CMD ["npm", "start"]

EXPOSE 3000 