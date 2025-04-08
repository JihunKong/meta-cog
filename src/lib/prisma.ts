import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Supabase 연결 URL 생성
const createSupabaseConnectionString = () => {
  const projectId = "ljrrinokzegzjbovssjy";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error("Supabase 서비스 롤 키가 설정되지 않았습니다.");
    return null;
  }

  // Supabase Direct Connection URL 형식 사용
  return `postgresql://postgres:${serviceRoleKey}@db.${projectId}.supabase.co:5432/postgres`;
};

// 데이터베이스 URL 가져오기
const getDatabaseUrl = () => {
  // 1. Supabase 연결 문자열 생성
  const supabaseUrl = createSupabaseConnectionString();
  if (supabaseUrl) {
    return supabaseUrl;
  }
  
  // 2. 직접 설정된 DATABASE_URL 사용
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl?.startsWith('postgresql://') || databaseUrl?.startsWith('postgres://')) {
    return databaseUrl;
  }
  
  throw new Error("유효한 데이터베이스 URL을 찾을 수 없습니다.");
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

// 데이터베이스 연결 상태 확인
prisma.$connect()
  .then(() => {
    console.log("✅ Supabase PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.");
  })
  .catch((error) => {
    console.error("❌ Supabase PostgreSQL 데이터베이스 연결 실패:", error);
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 