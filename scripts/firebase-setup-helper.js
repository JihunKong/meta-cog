console.log(`
🔥 Firebase 설정 도우미

Firebase Console에서 설정값을 가져오는 방법:

1️⃣ Firebase Console 접속
   https://console.firebase.google.com/

2️⃣ meta-cog-7d9d3 프로젝트 선택 (또는 해당 프로젝트)

3️⃣ 프로젝트 설정 페이지로 이동
   - 좌측 사이드바 상단의 ⚙️ (톱니바퀴) 아이콘 클릭
   - "프로젝트 설정" 선택

4️⃣ 일반 탭에서 웹 앱 설정 확인
   - "내 앱" 섹션에서 웹 앱을 찾습니다
   - 없다면 "앱 추가" > "웹" 클릭하여 새로 생성
   - "Firebase SDK snippet" > "구성" 선택
   
   다음과 같은 코드가 보일 것입니다:
   
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "meta-cog-7d9d3.firebaseapp.com",
     projectId: "meta-cog-7d9d3",
     storageBucket: "meta-cog-7d9d3.appspot.com",
     messagingSenderId: "123...",
     appId: "1:123...",
     measurementId: "G-..."
   };

5️⃣ 서비스 계정 탭에서 Admin SDK 키 생성
   - "서비스 계정" 탭 클릭
   - "새 비공개 키 생성" 버튼 클릭
   - JSON 파일이 다운로드됩니다

6️⃣ .env.local 파일 업데이트
   - 4단계에서 가져온 값들을 .env.local의 NEXT_PUBLIC_FIREBASE_* 변수에 복사
   - 5단계에서 다운로드한 JSON 파일 내용을 FIREBASE_SERVICE_ACCOUNT_KEY에 복사
   - JSON은 반드시 한 줄로 만들어야 합니다 (줄바꿈 제거)

7️⃣ 설정 확인
   npm run check-env

현재 .env.local 파일이 생성되었습니다. 위의 단계를 따라 실제 값들로 교체해주세요.
`);

// 현재 프로젝트 ID 추측
const fs = require('fs');
const path = require('path');

try {
  const firebaseConfigPath = path.join(__dirname, '..', 'src', 'lib', 'firebase.ts');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
    const projectIdMatch = firebaseConfig.match(/project_id['"]\s*:\s*['"]([^'"]+)['"]/);
    const authDomainMatch = firebaseConfig.match(/authDomain['"]\s*:\s*['"]([^'"]+)['"]/);
    
    if (projectIdMatch || authDomainMatch) {
      console.log('📋 감지된 Firebase 프로젝트 정보:');
      if (authDomainMatch) {
        const domain = authDomainMatch[1];
        const projectId = domain.split('.')[0];
        console.log(`   프로젝트 ID: ${projectId}`);
        console.log(`   Auth Domain: ${domain}`);
      }
    }
  }
} catch (error) {
  // 무시
}

console.log('\n💡 참고: Vercel에도 동일한 환경변수들을 설정해야 합니다.');
console.log('   Vercel Dashboard > Settings > Environment Variables');