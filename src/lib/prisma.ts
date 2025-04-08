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

// 데이터베이스 URL 검증 함수
function validateDatabaseUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === 'postgresql:' &&
      parsedUrl.hostname.includes('supabase.co') &&
      parsedUrl.pathname === '/postgres'
    );
  } catch {
    return false;
  }
}

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (!validateDatabaseUrl(databaseUrl)) {
  throw new Error(
    '유효하지 않은 Supabase 데이터베이스 URL입니다. URL은 postgresql://로 시작하고 supabase.co를 포함해야 합니다.'
  );
}

// Prisma 클라이언트 설정
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma =
  globalForPrisma.prisma ??
  prismaClientSingleton();

// 데이터베이스 연결 상태 확인
prisma.$connect()
  .then(() => {
    console.log("✅ Supabase PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.");
  })
  .catch((error) => {
    console.error("❌ Supabase PostgreSQL 데이터베이스 연결 실패:", error);
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 