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
      parsedUrl.pathname === '/postgres' &&
      (parsedUrl.port === '5432' || parsedUrl.port === '')
    );
  } catch {
    return false;
  }
}

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

// 개발 환경에서는 환경 변수가 없을 수 있으므로 경고만 표시
if (!databaseUrl) {
  console.warn('SUPABASE_DATABASE_URL 환경 변수가 설정되지 않았습니다. 개발 환경에서는 일부 기능이 작동하지 않을 수 있습니다.');
} else if (!validateDatabaseUrl(databaseUrl)) {
  console.warn(
    '유효하지 않은 Supabase 데이터베이스 URL입니다. URL은 postgresql://로 시작하고, supabase.co를 포함하며, 포트는 5432여야 합니다.'
  );
}

// Prisma 클라이언트 설정
const prismaClientSingleton = () => {
  // 개발 환경에서 데이터베이스 URL이 없는 경우 더미 URL 사용
  const dbUrl = databaseUrl || 'postgresql://dummy:dummy@localhost:5432/dummy';
  
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma =
  globalForPrisma.prisma ??
  prismaClientSingleton();

// 데이터베이스 연결 상태 확인 (개발 환경에서는 실제 연결을 시도하지 않음)
if (process.env.NODE_ENV !== 'development' || databaseUrl) {
  prisma.$connect()
    .then(() => {
      console.log("✅ Supabase PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.");
    })
    .catch((error) => {
      console.error("❌ Supabase PostgreSQL 데이터베이스 연결 실패:", error);
    });
} else {
  console.log("⚠️ 개발 환경에서 데이터베이스 연결을 건너뜁니다. 환경 변수가 설정되지 않았습니다.");
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 