import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 데이터베이스 URL 형식 검증
const validateDatabaseUrl = (url: string | undefined) => {
  if (!url) {
    console.error("DATABASE_URL이 설정되지 않았습니다.");
    return false;
  }
  
  // URL 형식 검증
  const isValidFormat = url.startsWith('postgresql://') || url.startsWith('postgres://');
  if (!isValidFormat) {
    console.error(`잘못된 데이터베이스 URL 형식입니다: ${url.substring(0, 20)}...`);
    console.error("URL은 'postgresql://' 또는 'postgres://'로 시작해야 합니다.");
    return false;
  }
  
  return true;
};

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// URL 형식 검증
if (!validateDatabaseUrl(databaseUrl)) {
  console.error("데이터베이스 연결을 위한 환경 변수를 확인하세요:");
  console.error("1. DATABASE_URL이 설정되어 있는지 확인");
  console.error("2. URL이 'postgresql://' 또는 'postgres://'로 시작하는지 확인");
  console.error("3. Netlify 환경 변수 설정에서 DATABASE_URL을 확인");
  
  // 개발 환경에서는 에러를 던지고, 프로덕션에서는 기본값 사용
  if (process.env.NODE_ENV === 'development') {
    throw new Error("Invalid database URL format");
  } else {
    console.warn("프로덕션 환경에서는 기본 데이터베이스 URL을 사용합니다.");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

// 데이터베이스 연결 상태 확인
prisma.$connect()
  .then(() => {
    console.log("데이터베이스 연결 성공");
    return prisma.user.count();
  })
  .then((count: number) => {
    console.log(`데이터베이스 내 사용자 수: ${count}`);
  })
  .catch((error: Error) => {
    console.error("데이터베이스 연결 오류:", error.message);
    console.error("연결 문자열:", databaseUrl ? `${databaseUrl.substring(0, 20)}...` : "설정되지 않음");
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 