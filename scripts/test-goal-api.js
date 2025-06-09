const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testGoalApi() {
  console.log('🧪 목표 API 로직 테스트...');

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

    // API 파라미터 시뮬레이션
    const userId = 'WyQ7hhZS18gGYbxiYV383eYw9Ua2';
    const filter = 'all'; // all, my, public, friends
    const limit = 20;
    const offset = 0;

    console.log('API 파라미터:', { userId, filter, limit, offset });

    let goals = [];

    console.log('새로운 쿼리 로직 시작...');

    // 복합 인덱스 문제를 피하기 위해 간단한 쿼리 사용
    if (filter === 'my') {
      // 내 목표만 조회
      const myQuery = db.collection('goalDeclarations')
        .where('userId', '==', userId);
      
      const mySnapshot = await myQuery.get();
      goals = mySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 클라이언트 사이드 정렬
      goals.sort((a, b) => {
        const dateA = a.declaredAt?.toDate?.() || new Date(a.declaredAt);
        const dateB = b.declaredAt?.toDate?.() || new Date(b.declaredAt);
        return dateB.getTime() - dateA.getTime();
      });
      
    } else {
      // 모든 공개 목표 조회 (정렬 없이)
      console.log('공개 목표 조회 중...');
      let publicQuery = db.collection('goalDeclarations')
        .where('isPublic', '==', true);

      const publicSnapshot = await publicQuery.get();
      let publicGoals = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`공개 목표 수: ${publicGoals.length}`);
      
      // 클라이언트 사이드에서 정렬
      publicGoals.sort((a, b) => {
        const dateA = a.declaredAt?.toDate?.() || new Date(a.declaredAt);
        const dateB = b.declaredAt?.toDate?.() || new Date(b.declaredAt);
        return dateB.getTime() - dateA.getTime();
      });

      // 내 목표도 함께 보여주기 (all 필터의 경우)
      if (filter === 'all' && userId) {
        console.log('내 목표도 함께 조회...');
        const myQuery = db.collection('goalDeclarations')
          .where('userId', '==', userId);
        
        const mySnapshot = await myQuery.get();
        const myGoals = mySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`내 목표 수: ${myGoals.length}`);
        
        // 중복 제거 후 합치기
        const allGoals = [...publicGoals];
        myGoals.forEach(myGoal => {
          if (!allGoals.find(goal => goal.id === myGoal.id)) {
            allGoals.push(myGoal);
          }
        });
        
        // 다시 정렬
        allGoals.sort((a, b) => {
          const dateA = a.declaredAt?.toDate?.() || new Date(a.declaredAt);
          const dateB = b.declaredAt?.toDate?.() || new Date(b.declaredAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        goals = allGoals;
      } else {
        goals = publicGoals;
      }
      
      // 페이징 적용
      goals = goals.slice(offset, offset + limit);
    }

    console.log(`최종 목표 수: ${goals.length}`);

    if (goals.length > 0) {
      console.log('\n📝 조회된 목표들:');
      
      const finalGoals = await Promise.all(goals.map(async (goalData) => {
        console.log(`문서 ID: ${goalData.id}`);
        console.log(`원본 데이터:`, {
          title: goalData.title,
          userId: goalData.userId,
          subject: goalData.subject,
          status: goalData.status,
          isPublic: goalData.isPublic,
          declaredAt: goalData.declaredAt
        });
        
        // 작성자 정보 조회
        const userDoc = await db.collection('users').doc(goalData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        
        console.log(`작성자 정보:`, userData ? {
          name: userData.name,
          school: userData.school
        } : '사용자 정보 없음');
        
        const goalResult = {
          id: goalData.id,
          ...goalData,
          author: {
            id: goalData.userId,
            name: userData?.name || '익명',
            school: userData?.school || ''
          },
          declaredAt: goalData.declaredAt?.toDate?.() || goalData.declaredAt,
          targetDate: goalData.targetDate?.toDate?.() || goalData.targetDate,
          deadlineTime: goalData.deadlineTime?.toDate?.() || goalData.deadlineTime,
          updatedAt: goalData.updatedAt?.toDate?.() || goalData.updatedAt
        };

        console.log(`변환된 결과:`, {
          id: goalResult.id,
          title: goalResult.title,
          author: goalResult.author,
          declaredAt: goalResult.declaredAt
        });
        
        return goalResult;
      }));

      console.log(`\n최종 결과: ${finalGoals.length}개 목표`);
      return {
        success: true,
        goals: finalGoals,
        hasMore: goals.length === limit
      };
    } else {
      console.log('조회된 목표가 없습니다.');
      return {
        success: true,
        goals: [],
        hasMore: false
      };
    }

  } catch (error) {
    console.error('❌ API 테스트 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

testGoalApi().then(result => {
  console.log('\n🎯 최종 API 응답:');
  console.log(JSON.stringify(result, null, 2));
});