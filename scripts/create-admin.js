// 관리자 사용자 생성 스크립트
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 환경 변수 확인
if (!process.env.DATABASE_URL) {
  console.error('환경 변수 DATABASE_URL이 설정되지 않았습니다.');
  console.error('Netlify에 환경 변수가, 로컬에는 .env.local 파일이 있어야 합니다.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('관리자 계정 생성 시작...');
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // 관리자 사용자 생성
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        email: 'admin@example.com',
        name: '관리자',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('관리자 사용자 생성 성공:', user);
  } catch (error) {
    console.error('관리자 사용자 생성 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 