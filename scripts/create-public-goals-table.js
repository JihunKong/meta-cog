const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function createPublicGoalsTable() {
  console.log('🎯 공개 목표 테이블 생성 시작...\n');

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

    // 기존 목표 선언 데이터 조회
    console.log('📋 기존 목표 선언 데이터 확인...');
    const goalsSnapshot = await db.collection('goalDeclarations').get();
    console.log(`발견된 목표 수: ${goalsSnapshot.size}`);

    // 공개 목표 데이터 생성
    const publicGoals = [];
    
    for (const goalDoc of goalsSnapshot.docs) {
      const goalData = goalDoc.data();
      
      if (goalData.isPublic) {
        // 작성자 정보 조회
        const authorDoc = await db.collection('users').doc(goalData.userId).get();
        const authorData = authorDoc.data();
        
        const publicGoal = {
          originalId: goalDoc.id,
          title: goalData.title,
          description: goalData.description || '',
          subject: goalData.subject,
          targetType: goalData.targetType,
          targetAmount: goalData.targetAmount,
          targetUnit: goalData.targetUnit,
          targetDate: goalData.targetDate,
          difficulty: goalData.difficulty,
          motivation: goalData.motivation || '',
          status: goalData.status,
          progress: goalData.progress || 0,
          actualAmount: goalData.actualAmount || 0,
          
          // 작성자 정보 (비식별화)
          authorId: goalData.userId,
          authorName: authorData?.name || '익명',
          authorSchool: authorData?.school || '',
          authorGrade: authorData?.grade || '',
          
          // 통계 정보
          supportCount: goalData.supportCount || 0,
          commentCount: goalData.commentCount || 0,
          viewCount: 0,
          
          // 날짜 정보
          declaredAt: goalData.declaredAt,
          startedAt: goalData.startedAt || null,
          completedAt: goalData.completedAt || null,
          updatedAt: goalData.updatedAt,
          
          // 메타 정보
          isVisible: true,
          isPromoted: false,
          lastSyncAt: new Date()
        };
        
        publicGoals.push(publicGoal);
      }
    }

    console.log(`\n📤 ${publicGoals.length}개의 공개 목표를 publicGoals 컬렉션에 저장...`);
    
    const batch = db.batch();
    
    publicGoals.forEach((goal, index) => {
      const docRef = db.collection('publicGoals').doc();
      batch.set(docRef, goal);
    });
    
    await batch.commit();
    console.log('✅ 공개 목표 테이블 생성 완료');

    // 샘플 데이터 추가 (테스트용)
    console.log('\n📝 샘플 목표 데이터 추가...');
    const sampleGoals = [
      {
        originalId: 'sample1',
        title: '수학 문제집 완주하기',
        description: '수학 실력 향상을 위해 문제집을 끝까지 풀어보겠습니다.',
        subject: '수학',
        targetType: 'PAGES',
        targetAmount: 200,
        targetUnit: '페이지',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        difficulty: 'MEDIUM',
        motivation: '수학 성적을 올리고 싶어서',
        status: 'IN_PROGRESS',
        progress: 35,
        actualAmount: 70,
        
        authorId: 'sample_user_1',
        authorName: '김학생',
        authorSchool: '완도고등학교',
        authorGrade: '2',
        
        supportCount: 5,
        commentCount: 2,
        viewCount: 15,
        
        declaredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedAt: null,
        updatedAt: new Date(),
        
        isVisible: true,
        isPromoted: true,
        lastSyncAt: new Date()
      },
      {
        originalId: 'sample2',
        title: '영어 단어 1000개 암기',
        description: '토익 시험 준비를 위해 영어 단어를 열심히 외우겠습니다.',
        subject: '영어',
        targetType: 'CUSTOM',
        targetAmount: 1000,
        targetUnit: '단어',
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        difficulty: 'HARD',
        motivation: '토익 점수를 올리고 싶어서',
        status: 'DECLARED',
        progress: 0,
        actualAmount: 0,
        
        authorId: 'sample_user_2',
        authorName: '이학생',
        authorSchool: '완도고등학교',
        authorGrade: '3',
        
        supportCount: 3,
        commentCount: 1,
        viewCount: 8,
        
        declaredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
        
        isVisible: true,
        isPromoted: false,
        lastSyncAt: new Date()
      }
    ];

    for (const sampleGoal of sampleGoals) {
      await db.collection('publicGoals').add(sampleGoal);
    }
    
    console.log('✅ 샘플 목표 데이터 추가 완료');
    console.log('\n🎉 공개 목표 시스템 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createPublicGoalsTable();