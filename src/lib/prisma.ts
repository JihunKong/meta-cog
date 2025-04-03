import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

// 데이터베이스 연결 상태 확인
prisma.$connect()
  .then(() => {
    console.log("데이터베이스 연결 성공");
    // 연결 확인을 위해 간단한 쿼리 실행
    return prisma.user.count();
  })
  .then((count: number) => {
    console.log(`데이터베이스 내 사용자 수: ${count}`);
  })
  .catch((error: Error) => {
    console.error("데이터베이스 연결 오류:", error.message);
    console.error("연결 문자열 확인:", process.env.DATABASE_URL ? "설정됨" : "설정되지 않음");
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 