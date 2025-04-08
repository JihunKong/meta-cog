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
  return `postgres://postgres:${serviceRoleKey}@db.${projectId}.supabase.co:5432/postgres`;
};

// 데이터베이스 URL 가져오기
const getDatabaseUrl = () => {
  // 1. 직접 설정된 DATABASE_URL 사용
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl?.startsWith('postgresql://') || databaseUrl?.startsWith('postgres://')) {
    return databaseUrl;
  }
  
  // 2. Supabase 연결 문자열 생성
  const supabaseUrl = createSupabaseConnectionString();
  if (supabaseUrl) {
    return supabaseUrl;
  }
  
  // 3. 개발 환경에서는 에러 발생
  if (process.env.NODE_ENV === 'development') {
    throw new Error("유효한 데이터베이스 URL을 찾을 수 없습니다.");
  }
  
  // 4. 프로덕션에서는 경고 로그만 출력하고 기본 URL 반환
  console.warn("데이터베이스 URL이 설정되지 않았습니다. 기본값을 사용합니다.");
  return databaseUrl || "";
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
    console.log("데이터베이스 연결 성공");
    return prisma.user.count();
  })
  .then((count: number) => {
    console.log(`데이터베이스 내 사용자 수: ${count}`);
  })
  .catch((error: Error) => {
    console.error("데이터베이스 연결 오류:", error.message);
    if (error.message.includes('password authentication failed')) {
      console.error("인증 실패: 데이터베이스 자격 증명을 확인하세요.");
    }
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 