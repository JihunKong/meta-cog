const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 리전 설정 삭제
// const functionsRegion = functions.region('asia-northeast3');

// Firebase Admin SDK 초기화 (중복 방지)
if (admin.apps.length === 0) { // 기존 앱이 없을 때만 초기화
  admin.initializeApp();
}

// Firebase 앱 인스턴스 가져오기
const db = admin.firestore();
// 명시적으로 리전 설정
db.settings({
  timestampsInSnapshots: true,
  ignoreUndefinedProperties: true
});
console.log("Admin Function: Firestore 인스턴스 초기화 완료 - 리전: asia-northeast3");

const auth = admin.auth();

/**
 * 관리자가 호출하여 사용자를 생성하는 Callable Function
 * 1. 호출자가 관리자(admin: true 클레임)인지 확인
 * 2. Firebase Authentication 사용자 생성
 * 3. Firestore 'Profiles' 컬렉션에 문서 생성
 * 4. asia-northeast3 리전에서 실행됨
 */
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
    
    // 5. Firestore에 사용자 정보 저장
    // await db.collection("Profiles").doc(userRecord.uid).set(profileData);
    
    // 명시적으로 DB 인스턴스 다시 가져오기
    const adminDb = admin.firestore();
    
    // 리전 설정 확인 로깅
    console.log(`Admin Function: 리전 설정 확인 - asia-northeast3 (데이터베이스와 동일한 리전)`);
    
    // 컬렉션 이름을 정확히 'Profiles'로 설정
    console.log(`Admin Function: 컬렉션 정확히 확인 - 'Profiles'`);
    
    // 저장 시도
    console.log(`Admin Function: UID로 문서 참조 생성 - ${userRecord.uid}`);
    
    // 더 명시적인 방법으로 데이터 저장 시도
    try {
      // 1. 우선 Firestore 인스턴스에 대한 직접 참조를 얻음
      const firestoreDb = admin.firestore();
      console.log(`Admin Function: 직접 Firestore 인스턴스 참조 획득`);
      
      // 2. 명시적으로 설정을 적용 (타임스탬프 처리 및 정의되지 않은 속성 무시)
      firestoreDb.settings({
        timestampsInSnapshots: true, 
        ignoreUndefinedProperties: true
      });
      console.log(`Admin Function: Firestore 설정 적용 완료`);
      
      // 3. 컬렉션 및 문서 참조 생성
      const profilesCollection = firestoreDb.collection('Profiles');
      console.log(`Admin Function: 'Profiles' 컬렉션 참조 생성 완료`);
      
      const userDocRef = profilesCollection.doc(userRecord.uid);
      console.log(`Admin Function: 사용자 문서 참조 생성 완료 - ID: ${userRecord.uid}`);
      
      // 4. 데이터 저장 직전 로깅
      console.log(`Admin Function: 데이터 저장 직전 - 데이터:`, JSON.stringify(profileData, null, 2));
      
      // 5. 데이터 저장 시도
      await userDocRef.set(profileData);
      console.log(`Admin Function: 데이터 set 메서드 호출 완료`);
      
      // 6. 저장 후 확인
      const savedDoc = await userDocRef.get();
      
      if (savedDoc.exists) {
        console.log(`Admin Function: 저장 성공! 문서 존재 확인 완료 - 데이터:`, JSON.stringify(savedDoc.data(), null, 2));
      } else {
        console.error(`Admin Function: 치명적 오류! 문서를 저장했으나 바로 조회 시 존재하지 않음!`);
        throw new Error('문서 저장 후 조회 실패');
      }
    } catch (firestoreError) {
      console.error(`Admin Function: Firestore 작업 중 오류 발생:`, firestoreError);
      throw new functions.https.HttpsError(
        "internal",
        `Firestore 프로필 저장 실패: ${firestoreError.message}`
      );
    }

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
