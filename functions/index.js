/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https"); // 사용 안 함
// const logger = require("firebase-functions/logger"); // 사용 안 함
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Firebase Admin SDK 초기화 (한 번만 실행)
try {
  // 서비스 계정을 사용하여 완전한 관리자 권한으로 초기화
  admin.initializeApp();
  console.log("Admin SDK initialized with full admin privileges");
} catch (e) {
  console.log("Admin SDK already initialized or init failed:", e);
}

// Firebase 앱 인스턴스 가져오기
const db = admin.firestore();
console.log("Admin Function: Firestore 인스턴스 초기화 완료");
const auth = admin.auth();
console.log("Admin Function: Auth 인스턴스 초기화 완료");

// 필요한 함수를 src/index.js 에서 가져옴
const {createUserByAdmin} = require("./src/index");
const {generateLeaderboard} = require("./src/leaderboard-aggregator");

/**
 * 관리자가 호출하여 사용자를 생성하는 Callable Function
 * 1. 호출자가 관리자(admin: true 클레임)인지 확인
 * 2. Firebase Authentication 사용자 생성
 * 3. Firestore 'Profiles' 컬렉션에 문서 생성
 */
/*
exports.createUserByAdmin = functions.https.onCall(async (data, context) => {
  // 1. 관리자 권한 확인
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "함수를 호출하려면 인증이 필요합니다.",
    );
  }
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "이 기능을 사용할 권한이 없습니다.",
    );
  }

  // 2. 입력 데이터 유효성 검사
  if (!data) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "요청 데이터가 누락되었습니다.",
    );
  }
  // eslint-disable-next-line max-len
  const {email, password, name, school, role, grade, classNum, studentNum} = data;
  if (!email || !password || !name || !school || !role) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        // eslint-disable-next-line max-len
        "필수 정보(이메일, 비밀번호, 이름, 학교, 역할)가 누락되었습니다.",
    );
  }
  if (role === "student" && (!grade || !classNum || !studentNum)) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "학생 역할은 학년, 반, 번호 정보가 필수입니다.",
    );
  }

  try {
    // 3. Firebase Authentication 사용자 생성
    console.log(`Admin Function: Auth 계정 생성 시도 - ${email}`);
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });
    console.log(`Admin Function: Auth 계정 생성 성공 - ${userRecord.uid}`);

    // 4. Firestore 'Profiles' 컬렉션에 저장할 데이터 준비
    console.log(`Admin Function: 프로필 데이터 준비 시작`);
    const profileData = {
      email: email,
      name: name,
      school: school,
      role: role,
      created_at: new Date().toISOString(),
    };
    if (role === "student") {
      profileData.grade = grade;
      profileData.classNum = classNum;
      profileData.studentNum = studentNum;
    }

    // --- Firestore 쓰기 전 상세 로깅 추가 ---
    const targetDocPath = `Profiles/${userRecord.uid}`;
    console.log(`Admin Function: Firestore 저장 시도 - 경로: ${targetDocPath}`);
    // eslint-disable-next-line max-len
    console.log(`Admin Function: Firestore 저장 시도 - 데이터:`, JSON.stringify(profileData, null, 2));
    try {
      // --- ----------------------------- ---
      // 5. Firestore에 사용자 정보 저장
      console.log(`Admin Function: Firestore 쓰기 직전 - UID: ${userRecord.uid}`);
      // 명시적으로 DB 인스턴스 다시 가져오기
      const adminDb = admin.firestore();
      
      // 컬렉션 이름을 정확히 'Profiles'로 설정
      console.log(`Admin Function: 컬렉션 정확히 확인 - 'Profiles'`);
      const profilesRef = adminDb.collection('Profiles');
      const docRef = profilesRef.doc(userRecord.uid);
      await docRef.set(profileData);
      
      console.log(`Admin Function: Firestore 저장 성공 - ${targetDocPath}`);
    } catch (firestoreWriteError) {
      // eslint-disable-next-line max-len
      console.error(`Admin Function: Firestore 쓰기 오류 발생! 경로: ${targetDocPath}`, firestoreWriteError);
      console.error(`Admin Function: 오류 세부정보:`, JSON.stringify(firestoreWriteError, null, 2));
      // Firestore 쓰기 실패 시 구체적인 오류 throw
      throw new functions.https.HttpsError(
          "internal",
          `Firestore 프로필 저장 실패: ${firestoreWriteError.message}`,
      );
    }
    // --- --------------------------------- ---

    // 6. 성공 결과 반환
    return {success: true, message: `사용자(${email}) 생성이 완료되었습니다.`};
  } catch (error) {
    console.error("Admin Function: 사용자 생성 중 오류 발생:", error);
    // Firebase Auth 오류 코드에 따른 구체적인 오류 메시지 반환
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError(
          "already-exists",
          "이미 사용 중인 이메일 주소입니다.",
      );
    } else if (error.code === "auth/invalid-password") {
      throw new functions.https.HttpsError(
          "invalid-argument",
          // eslint-disable-next-line max-len
          `비밀번호는 6자 이상이어야 합니다. (오류: ${error.message})`,
      );
    }
    // 기타 오류 처리
    throw new functions.https.HttpsError(
        "internal",
        // eslint-disable-next-line max-len
        `사용자 생성 중 서버 오류 발생: ${error.message}`,
    );
  }
});
*/

// src/index.js 파일에서 가져온 함수 내보내기
exports.createUserByAdmin = createUserByAdmin;

// 다른 함수들이 있다면 여기에 추가로 export 합니다.
// 예: exports.anotherFunction = require("./src/another").anotherFunction;

// 테스트용 간단한 함수 추가
exports.testFunction = functions.https.onCall(async (data, context) => {
  console.log("테스트 함수가 호출되었습니다!");
  
  try {
    // 테스트 컬렉션에 간단한 문서 추가 시도
    const testDoc = {
      timestamp: new Date().toISOString(),
      message: "테스트 성공"
    };
    
    console.log("테스트 문서 생성 시도:", JSON.stringify(testDoc));
    
    // Firestore 인스턴스 다시 가져오기
    const testDb = admin.firestore();
    
    // 테스트 컬렉션에 문서 추가
    await testDb.collection("TestCollection").add(testDoc);
    
    console.log("테스트 문서 생성 성공!");
    
    return {
      success: true,
      message: "테스트 함수가 성공적으로 실행되었습니다."
    };
  } catch (error) {
    console.error("테스트 함수 오류:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * 스케줄된 리더보드 자동 집계 함수
 * 매일 오전 1시에 자동 실행
 */
exports.scheduledLeaderboardUpdate = functions.pubsub
  .schedule('0 1 * * *') // 매일 오전 1시 (UTC)
  .timeZone('Asia/Seoul') // 한국 시간
  .onRun(async (context) => {
    console.log('⏰ 스케줄된 리더보드 업데이트 시작:', new Date().toISOString());
    
    try {
      const result = await generateLeaderboard();
      console.log('✅ 스케줄된 리더보드 업데이트 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ 스케줄된 리더보드 업데이트 실패:', error);
      throw error;
    }
  });

/**
 * 수동 리더보드 집계 함수 (HTTP 호출 가능)
 * 교사나 관리자가 즉시 리더보드를 업데이트할 때 사용
 */
exports.updateLeaderboard = functions.https.onCall(async (data, context) => {
  console.log('🔧 수동 리더보드 업데이트 요청');
  
  // 인증된 사용자만 접근 가능
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '리더보드 업데이트 권한이 없습니다.'
    );
  }
  
  try {
    const result = await generateLeaderboard();
    console.log('✅ 수동 리더보드 업데이트 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 수동 리더보드 업데이트 실패:', error);
    throw new functions.https.HttpsError(
      'internal',
      `리더보드 업데이트 실패: ${error.message}`
    );
  }
});

/**
 * 즉시 리더보드 집계 함수 (HTTP 트리거)
 * API 엔드포인트로 직접 호출 가능
 */
exports.generateLeaderboardNow = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  console.log('🚀 즉시 리더보드 생성 요청');
  
  try {
    const result = await generateLeaderboard();
    console.log('✅ 즉시 리더보드 생성 완료:', result);
    
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 즉시 리더보드 생성 실패:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
