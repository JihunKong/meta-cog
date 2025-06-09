const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testGoalCollections() {
  console.log('🎯 목표 선언 컬렉션 테스트 시작...\n');

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

    const db = admin.firestore();

    // 필요한 컬렉션들 확인
    const collections = [
      'goalDeclarations',
      'goalSupports', 
      'goalUpdates',
      'userGoalStats'
    ];

    for (const collectionName of collections) {
      console.log(`📁 ${collectionName} 컬렉션 확인:`);
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`  ✅ 컬렉션 존재 (문서 수: ${snapshot.size})`);
      } catch (error) {
        console.log(`  ❌ 컬렉션 접근 오류:`, error.message);
      }
    }

    console.log('\n🧪 목표 선언 API 시뮬레이션:');
    
    // 테스트 목표 데이터
    const testGoal = {
      userId: 'WyQ7hhZS18gGYbxiYV383eYw9Ua2',
      title: '테스트 목표',
      description: '시스템 테스트용 목표입니다',
      subject: '수학',
      targetType: 'PROBLEMS',
      targetAmount: 50,
      targetUnit: '문제',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      difficulty: 'MEDIUM',
      isPublic: true,
      motivation: '실력 향상을 위해',
      reward: '맛있는 음식 먹기',
      status: 'DECLARED',
      progress: 0,
      actualAmount: 0,
      declaredAt: new Date(),
      updatedAt: new Date(),
      supportCount: 0,
      commentCount: 0
    };

    try {
      console.log('  📝 테스트 목표 생성 중...');
      const docRef = await db.collection('goalDeclarations').add(testGoal);
      console.log(`  ✅ 테스트 목표 생성 성공: ${docRef.id}`);
      
      // 바로 삭제
      await docRef.delete();
      console.log('  🗑️ 테스트 목표 삭제 완료');
      
    } catch (error) {
      console.log('  ❌ 목표 생성 테스트 실패:', error.message);
    }

    console.log('\n✅ 목표 시스템 테스트 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

testGoalCollections();