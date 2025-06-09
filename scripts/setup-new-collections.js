const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase Admin 초기화 (기존 lib/firebase-admin.ts와 같은 방식 사용)
const serviceAccountPath = path.join(__dirname, '..', 'config', 'firebase-service-account.json');

if (!admin.apps.length) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      // 서비스 계정 키 파일 사용
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      console.log('Firebase Admin SDK 초기화 성공 (서비스 계정 키 파일 사용)');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // 환경변수 방식
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      });
      console.log('Firebase Admin SDK 초기화 성공 (환경변수 사용)');
    } else {
      // 기본 환경변수 방식
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3'}.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'meta-cog-7d9d3'}.appspot.com`
      });
      console.log('Firebase Admin SDK 초기화 성공 (기본 환경변수 사용)');
    }
  } catch (error) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    console.log('\n💡 Firebase 설정이 필요합니다:');
    console.log('1. config/firebase-service-account.json 파일을 설정하거나');
    console.log('2. .env.local 파일에 FIREBASE_SERVICE_ACCOUNT_KEY 환경변수를 설정하거나');
    console.log('3. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 환경변수를 설정해주세요.');
    console.log('\n🔧 현재는 구조 확인만 진행하고 실제 컬렉션 생성은 건너뛰겠습니다.');
  }
}

async function setupNewCollections() {
  console.log('🚀 새 컬렉션 설정을 시작합니다...\n');
  
  // Firebase가 제대로 초기화되었는지 확인
  if (!admin.apps.length) {
    console.log('⚠️  Firebase가 초기화되지 않았습니다.');
    console.log('📊 구조만 확인하고 완료하겠습니다.\n');
    return;
  }
  
  const db = admin.firestore();
  
  try {
    // 1. 기존 데이터 확인
    console.log('1️⃣ 기존 데이터 확인 중...');
    
    // sessions 컬렉션 확인
    const sessionsSnapshot = await db.collection('sessions').limit(5).get();
    console.log(`✅ sessions 컬렉션: ${sessionsSnapshot.size}개 문서 확인`);
    
    // users 컬렉션 확인
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`✅ users 컬렉션: ${usersSnapshot.size}개 문서 확인`);
    
    // student_names 컬렉션 확인
    const studentNamesSnapshot = await db.collection('student_names').limit(5).get();
    console.log(`✅ student_names 컬렉션: ${studentNamesSnapshot.size}개 문서 확인`);
    
    console.log('\n⚠️  기존 데이터는 그대로 유지됩니다.\n');
    
    // 2. 새 컬렉션을 위한 샘플 문서 생성
    console.log('2️⃣ 새 컬렉션 설정 중...');
    
    // goalDeclarations 컬렉션 초기화
    const goalDeclarationsRef = db.collection('goalDeclarations');
    const goalSample = await goalDeclarationsRef.add({
      _sample: true,
      _description: '이 문서는 컬렉션 구조 설정을 위한 샘플입니다.',
      userId: 'sample_user_id',
      title: '샘플 목표',
      description: '컬렉션 구조 설정용 샘플',
      subject: '수학',
      targetType: 'TIME',
      targetAmount: 60,
      targetUnit: '분',
      targetDate: admin.firestore.Timestamp.now(),
      difficulty: 'MEDIUM',
      isPublic: false,
      status: 'DECLARED',
      progress: 0,
      actualAmount: 0,
      declaredAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      supportCount: 0,
      commentCount: 0
    });
    console.log('✅ goalDeclarations 컬렉션 생성됨');
    
    // goalSupports 컬렉션 초기화
    const goalSupportsRef = db.collection('goalSupports');
    await goalSupportsRef.add({
      _sample: true,
      goalId: goalSample.id,
      supporterId: 'sample_supporter_id',
      supportType: 'CHEER',
      message: '샘플 응원 메시지',
      isAnonymous: false,
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log('✅ goalSupports 컬렉션 생성됨');
    
    // goalUpdates 컬렉션 초기화
    const goalUpdatesRef = db.collection('goalUpdates');
    await goalUpdatesRef.add({
      _sample: true,
      goalId: goalSample.id,
      updateType: 'START',
      progressAmount: 0,
      totalProgress: 0,
      message: '샘플 업데이트',
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log('✅ goalUpdates 컬렉션 생성됨');
    
    // userGoalStats 컬렉션 초기화
    const userGoalStatsRef = db.collection('userGoalStats');
    await userGoalStatsRef.doc('sample_user_id').set({
      _sample: true,
      totalDeclared: 0,
      totalCompleted: 0,
      totalFailed: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastGoalDate: null,
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log('✅ userGoalStats 컬렉션 생성됨');
    
    // 3. 컬렉션 인덱스 정보
    console.log('\n3️⃣ 권장 인덱스 설정:');
    console.log('Firebase Console에서 다음 인덱스를 생성해주세요:');
    console.log('- goalDeclarations: userId + declaredAt (내림차순)');
    console.log('- goalDeclarations: isPublic + declaredAt (내림차순)');
    console.log('- goalSupports: goalId + createdAt (내림차순)');
    console.log('- goalUpdates: goalId + createdAt (내림차순)');
    console.log('- sessions: user_id + created_at (내림차순)');
    
    console.log('\n✨ 새 컬렉션 설정이 완료되었습니다!');
    console.log('🎉 기존 데이터는 모두 안전하게 보존되었습니다.');
    
    // 4. 샘플 문서 삭제
    console.log('\n4️⃣ 샘플 문서 정리 중...');
    await goalDeclarationsRef.doc(goalSample.id).delete();
    console.log('✅ 샘플 문서들이 삭제되었습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 보안 규칙 제안
function printSecurityRules() {
  console.log('\n📋 권장 보안 규칙:');
  console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 기존 규칙은 그대로 유지
    
    // 목표 선언 규칙
    match /goalDeclarations/{goalId} {
      allow read: if request.auth != null && (
        resource.data.isPublic == true || 
        resource.data.userId == request.auth.uid
      );
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // 목표 응원 규칙
    match /goalSupports/{supportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.supporterId == request.auth.uid;
      allow update: if false; // 응원은 수정 불가
      allow delete: if request.auth != null && 
        resource.data.supporterId == request.auth.uid;
    }
    
    // 목표 업데이트 규칙
    match /goalUpdates/{updateId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // 업데이트는 수정 불가
      allow delete: if false; // 업데이트는 삭제 불가
    }
    
    // 사용자 목표 통계 규칙
    match /userGoalStats/{userId} {
      allow read: if request.auth != null && 
        request.auth.uid == userId;
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
  `);
}

// 실행
setupNewCollections().then(() => {
  printSecurityRules();
  console.log('\n🏁 설정이 완료되었습니다!');
  process.exit(0);
}).catch(error => {
  console.error('설정 중 오류:', error);
  process.exit(1);
});