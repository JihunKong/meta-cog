// 필요한 Firebase Admin SDK 모듈 가져오기
const admin = require('firebase-admin');

// 서비스 계정 키 파일 경로 자동 감지
let serviceAccount;
try {
  serviceAccount = require('./config/firebase-service-account.json');
} catch (e1) {
  try {
    serviceAccount = require('./firebase-service-account.json');
  } catch (e2) {
    console.error('[오류] firebase-service-account.json 파일을 찾을 수 없습니다. 프로젝트 루트 또는 config/ 폴더에 위치시켜 주세요.');
    process.exit(1);
  }
}

// Firebase Admin SDK 초기화
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  if (!/already exists/i.test(error.message)) {
    console.error('Firebase Admin SDK 초기화 오류:', error);
    process.exit(1);
  }
}


// 관리자 권한을 부여할 사용자의 UID (purusil55@gmail.com)
const uid = 'G8jyYJyDrffUtkkcpP08NrrP08Z2';

// 커스텀 클레임 설정
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`성공: 사용자 ${uid} 에게 관리자 클레임이 설정되었습니다.`);
    // 성공 시 정상 종료
    process.exit(0);
  })
  .catch((error) => {
    console.error('오류: 커스텀 클레임 설정 중 문제가 발생했습니다:', error);
    process.exit(1); // 오류 시 종료
  }); 