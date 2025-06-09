const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 환경 변수 설정 확인...\n');

// Firebase 환경 변수 확인
console.log('📱 Firebase 설정:');
const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

let firebaseOk = true;
let hasFirebaseAdminConfig = false;

firebaseVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ 설정됨' : '❌ 미설정';
  const displayValue = value ? 
    (varName.includes('SERVICE_ACCOUNT') ? '[JSON 객체]' : value.substring(0, 20) + '...') : 
    'undefined';
  
  console.log(`  ${varName}: ${status} (${displayValue})`);
  
  // Firebase Admin 설정 체크 (JSON 방식 또는 개별 환경변수 방식)
  if (varName === 'FIREBASE_SERVICE_ACCOUNT_KEY' && value) {
    hasFirebaseAdminConfig = true;
  }
  if (varName.startsWith('NEXT_PUBLIC_FIREBASE_') && !value) {
    firebaseOk = false;
  }
});

console.log('\n💾 Supabase 설정:');
const supabaseVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let supabaseOk = true;
supabaseVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ 설정됨' : '❌ 미설정';
  const displayValue = value ? value.substring(0, 30) + '...' : 'undefined';
  
  console.log(`  ${varName}: ${status} (${displayValue})`);
  if (!value) supabaseOk = false;
});

// Firebase Admin 설정 검증
console.log('\n🔧 Firebase Admin SDK 검증:');
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length === 0) {
      console.log('  ✅ 서비스 계정 키 형식이 올바릅니다 (JSON 방식)');
      console.log(`  📋 프로젝트 ID: ${serviceAccount.project_id}`);
      console.log(`  📧 클라이언트 이메일: ${serviceAccount.client_email}`);
    } else {
      console.log(`  ❌ 서비스 계정 키에 누락된 필드: ${missingFields.join(', ')}`);
      firebaseOk = false;
    }
  } catch (error) {
    console.log('  ❌ 서비스 계정 키 JSON 파싱 오류:', error.message);
    firebaseOk = false;
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  console.log('  ✅ Firebase Admin SDK 개별 환경변수 방식으로 설정됨');
  console.log(`  📋 프로젝트 ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`  📧 클라이언트 이메일: ${process.env.FIREBASE_CLIENT_EMAIL}`);
  console.log(`  🔑 Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? '설정됨' : '미설정'}`);
  hasFirebaseAdminConfig = true;
} else {
  console.log('  ❌ Firebase Admin SDK 설정이 없습니다');
  console.log('  💡 FIREBASE_SERVICE_ACCOUNT_KEY (JSON) 또는');
  console.log('     FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY 필요');
}

// Firebase 전체 설정 상태 업데이트
if (!hasFirebaseAdminConfig) {
  firebaseOk = false;
}

// 최종 결과
console.log('\n📊 설정 요약:');
console.log(`Firebase: ${firebaseOk ? '✅ 완료' : '❌ 미완료'}`);
console.log(`Supabase: ${supabaseOk ? '✅ 완료' : '❌ 미완료'}`);

if (firebaseOk && supabaseOk) {
  console.log('\n🎉 모든 환경 변수가 올바르게 설정되었습니다!');
  console.log('💡 이제 Firebase 컬렉션 설정을 진행할 수 있습니다:');
  console.log('   node scripts/setup-new-collections.js');
} else {
  console.log('\n⚠️  일부 환경 변수가 누락되었습니다.');
  console.log('📖 설정 가이드: VERCEL_ENV_SETUP.md 파일을 참조하세요.');
}

console.log('\n🔗 도움말:');
console.log('- Firebase Console: https://console.firebase.google.com/');
console.log('- Supabase Dashboard: https://app.supabase.com/');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');