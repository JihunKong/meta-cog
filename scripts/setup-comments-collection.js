const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase 초기화
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되지 않았습니다.');
    console.log('다음 명령어로 실행해주세요:');
    console.log('FIREBASE_SERVICE_ACCOUNT=$(cat firebase-key.json) node scripts/setup-comments-collection.js');
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function setupCommentsCollection() {
  try {
    console.log('댓글 컬렉션 설정 시작...');

    // 테스트 댓글 생성 (컬렉션 및 인덱스 확인용)
    const testComment = {
      goalId: 'test-goal-id',
      userId: 'test-user-id',
      content: 'This is a test comment',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('dailyGoalComments').add(testComment);
    console.log('테스트 댓글 생성됨:', docRef.id);

    // 테스트 쿼리 실행 (인덱스 확인)
    try {
      const snapshot = await db
        .collection('dailyGoalComments')
        .where('goalId', '==', 'test-goal-id')
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();
      
      console.log('쿼리 성공! 인덱스가 이미 존재합니다.');
    } catch (error) {
      if (error.code === 9) {
        console.log('\n⚠️  인덱스가 필요합니다!');
        console.log('Firebase Console에서 다음 인덱스를 생성해주세요:');
        console.log('컬렉션: dailyGoalComments');
        console.log('필드 1: goalId (오름차순)');
        console.log('필드 2: createdAt (오름차순)');
        console.log('\n또는 다음 링크를 사용하세요:');
        console.log(error.message);
      } else {
        throw error;
      }
    }

    // 테스트 댓글 삭제
    await docRef.delete();
    console.log('테스트 댓글 삭제됨');

    console.log('\n✅ 댓글 컬렉션 설정 완료!');

  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

setupCommentsCollection();