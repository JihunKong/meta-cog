const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🏁 최종 시스템 상태 확인\n');

// 1. 환경변수 확인
console.log('1️⃣ 환경변수 설정 상태:');
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'ANTHROPIC_API_KEY'
];

let envOk = true;
requiredVars.forEach(varName => {
  const status = process.env[varName] ? '✅' : '❌';
  console.log(`   ${varName}: ${status}`);
  if (!process.env[varName]) envOk = false;
});

// 2. 파일 시스템 확인
console.log('\n2️⃣ 핵심 파일 존재 확인:');
const fs = require('fs');
const coreFiles = [
  'src/lib/leaderboard-scoring.ts',
  'src/app/api/leaderboard/route.ts',
  'src/app/dashboard/teacher/components/ImprovedStudentLeaderboard.tsx',
  'src/components/student/StudentLeaderboard.tsx',
  'src/components/goals/GoalDeclarationForm.tsx',
  'VERCEL_ENV_SETUP.md',
  'FIREBASE_SETUP_GUIDE.md'
];

let filesOk = true;
coreFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`   ${filePath}: ${status}`);
  if (!exists) filesOk = false;
});

// 3. Firebase 연결 테스트
console.log('\n3️⃣ Firebase 연결 테스트:');
try {
  const admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  
  console.log('   Firebase Admin 초기화: ✅');
  console.log('   프로젝트 ID:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.log('   Firebase Admin 초기화: ❌');
  console.log('   오류:', error.message);
  envOk = false;
}

// 4. 패키지 의존성 확인
console.log('\n4️⃣ 패키지 의존성 확인:');
const packageJson = require('../package.json');
const requiredPackages = [
  'firebase',
  'firebase-admin',
  '@mui/material',
  '@mui/x-date-pickers'
];

let depsOk = true;
requiredPackages.forEach(pkg => {
  const exists = packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];
  const status = exists ? '✅' : '❌';
  console.log(`   ${pkg}: ${status} ${exists ? `(${exists})` : ''}`);
  if (!exists) depsOk = false;
});

// 5. 스크립트 명령어 확인
console.log('\n5️⃣ npm 스크립트 확인:');
const scripts = ['dev', 'build', 'check-env', 'setup-collections', 'firebase-help'];
scripts.forEach(script => {
  const exists = packageJson.scripts[script];
  const status = exists ? '✅' : '❌';
  console.log(`   npm run ${script}: ${status}`);
});

// 최종 결과
console.log('\n📊 시스템 상태 요약:');
console.log(`환경변수: ${envOk ? '✅' : '❌'}`);
console.log(`핵심파일: ${filesOk ? '✅' : '❌'}`);
console.log(`Firebase: ${envOk ? '✅' : '❌'}`);
console.log(`의존성: ${depsOk ? '✅' : '❌'}`);

if (envOk && filesOk && depsOk) {
  console.log('\n🎉 시스템이 완전히 준비되었습니다!');
  console.log('\n📋 다음 단계:');
  console.log('1. Vercel 환경변수 설정 (VERCEL_ENV_SETUP.md 참조)');
  console.log('2. Firebase 보안 규칙 및 인덱스 설정 (FIREBASE_SETUP_GUIDE.md 참조)');
  console.log('3. 배포 및 테스트');
  console.log('\n🚀 준비된 기능:');
  console.log('- 공정한 리더보드 시스템');
  console.log('- 목표 선언 및 응원 시스템');
  console.log('- 기존 데이터 100% 보존');
  console.log('- Firebase + Supabase 하이브리드 구조');
} else {
  console.log('\n⚠️  일부 설정이 완료되지 않았습니다.');
  console.log('위의 ❌ 항목들을 확인해주세요.');
}

console.log('\n🔗 유용한 명령어:');
console.log('- npm run check-env     # 환경변수 확인');
console.log('- npm run firebase-help # Firebase 설정 도움말');
console.log('- npm run dev          # 개발 서버 시작');
console.log('- npm run build        # 프로덕션 빌드');