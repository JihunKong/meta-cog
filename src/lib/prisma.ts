import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 데이터베이스 URL 형식 검증
const validateDatabaseUrl = (url: string | undefined) => {
  if (!url) return false;
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
};

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// URL 형식 검증
if (!validateDatabaseUrl(databaseUrl)) {
  console.error("잘못된 데이터베이스 URL 형식입니다. 'postgresql://' 또는 'postgres://'로 시작해야 합니다.");
  throw new Error("Invalid database URL format");
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
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 