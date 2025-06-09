# Vercel 환경 변수 설정 가이드

Firebase 및 Supabase 인증을 위해 Vercel에 필요한 환경 변수를 설정하는 방법을 안내합니다.

## 필요한 환경 변수

### Firebase 환경 변수 (메인 시스템)
1. `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase Web API 키
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase 인증 도메인 (예: project-id.firebaseapp.com)
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase 프로젝트 ID
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase 스토리지 버킷 (예: project-id.appspot.com)
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase 메시징 센더 ID
6. `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase 앱 ID
7. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase Analytics 측정 ID
8. `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK 서비스 계정 키 (JSON 문자열)

### Supabase 환경 변수 (백업/보조 시스템)
1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 익명 사용자용 키 (클라이언트에서 사용)
3. `SUPABASE_SERVICE_ROLE_KEY` - 서비스 롤 키 (서버에서만 사용)

## Vercel 대시보드에서 환경 변수 설정하기

### 1. Firebase 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인합니다.
2. 해당 프로젝트를 선택합니다.
3. **Settings** > **Environment Variables** 메뉴로 이동합니다.
4. 다음 Firebase 환경 변수들을 추가합니다:

#### Firebase Web Config (클라이언트용)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA_cP-WYvEP5KTJ0NrIj8OnCANosK9zUY0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meta-cog-7d9d3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meta-cog-7d9d3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meta-cog-7d9d3.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=212530945963
NEXT_PUBLIC_FIREBASE_APP_ID=1:212530945963:web:4d58cce9f19ae338f37cee
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-K1TV9ZR1KV
```

#### Firebase Admin SDK (서버용 - 개별 환경변수 방식)
```
FIREBASE_PROJECT_ID=meta-cog-7d9d3
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@meta-cog-7d9d3.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHimqlbPDEy+xe\nst/4uh2HHWAVrmHtJKCXY3KbvA+t/lG7hyEYbDabeojD/YiGJRJSpwptI9qZ65Rn\nBxL2VXVrjaD+5x+8b2hxaRAVbuigWpUqasL58jPwaeuSQ0CVcWNgSMciqU+hg0Kk\nEi54Shk5uFZ9217iyF9GHzbatj3tdPYr5qeSRbypFMMOgk9S6LtDVvCu+STIiGF3\ngDUXLOXzZ59oPUt9+pFb+oSxm08I9hqu/WY72s+E7CRHgCsKUZv1VD6hsQ5OvuQZ\nWZ3/HneonNP/lONMWA4f7eMFa4hebEVLA6qLp7zC3ArSJ2tqfmfHyMsVbhngMIsb\nGJJqGaLhAgMBAAECggEAE6oJ4XyPa613AUwac14QC+Eyt2BEiUS7SMAFquBJIUn3\nTwY9ljUP2pmkQcBKBIJBwIBysBfA8rs7GD4jub/pPuypqYUoZP8LqWWDrsELzsWu\nfowf49bhFHezvem/wxp2AyaY7UsHLHENj7K0/qi6vKv0ZhnIy4uYjAYGd15PUwev\nhxI1JU8OMijnEfxafw1sNALwwTALvq99TsgDueF83FyoqVZtA1+1IKE4EAicf8r9\nyLYxVPy2fd7aEb0eIyAtpk/EKPB+Pfd47FrdV+BzVHc8/8lcuSub6nveEinEpIsT\nx7zCs06WQ2gHV0j7MLLXon9kPbKKz5kI7etyOedmEwKBgQD2NNX45G7Qp9CzzWGB\nkQUl7c3bSnA9YTfxkCp6j0AJj6rVuV3E/Y9TWPbTJoe5thBQQU2eJF7NsBML2tiO\n2OhP95IfzPN2RsHwLPtGAr9Jwfp+xYzb3RoN0NE6m7/3p3+1b+3/hVhv+WvGVFd/\n/BQS6uQBJMkgjLgo3or8SGA8OwKBgQDPemAgowKuhLNVUYV24BOI6Qqb5euLg6VX\nYIOrHbUj+zE4/GGVIsk0DKH1jTCyJOsUThipRCyS9iZfGEdLo7vU1zvZUXRbJjkg\nj+wKYq9RidwB0/hFzZs5wprcsZROP+c3xLUiCLxwhUAJ2tlQlF39r6VwN3IoeDNf\nmjjLsC1XkwKBgQDUgxaOFt5vy+ogyI35QCupaXHebooi8N9Q6pc/4pXrqs5SXAXM\nGvCziH7EEuXkLno2S6ercMlD0U8fVG7IHgGnxJGkUUt0M+8CWFErRQPHrl+BPRMw\nU9BBTJTMedNg+HsLKOnNPFPxkuCr9/Duz66kBYt4UUApkE0FOdHNoMswMQKBgQCA\nlf6Hm5+o23NtmDWYRC23N38suaVu9Or/KUDRR3shTqfmAnzT+hgq2v1xeszIS5sq\nHXCpTyg0+Ls1So29Mj/SHIbqG9J6P0k+hhQrJ5gyd7dTprSDRndCp/pkduZMTMyX\nQqFj83geYGcc9Hakux85f6eP0b09mal1QdabXpfrYwKBgEksb1YAgcgwTKDd0cCv\n0ppqRc6jD936BJaOM2Q+E1ZqNbuSp/L3wop25phX7K1cqe0NUvQnKEI0mBApA4ag\ny9xXiWmD5FOVycmbEBQQw7z8RRf59LEKk64cBWH97hIcJO+4Y8/+11W+B2VOCjjH\nrb8fUQ5LRYZe0OVylodg9AaB\n-----END PRIVATE KEY-----\n"
```

### 2. Supabase 환경 변수 설정 (백업용)

기존 Supabase 환경 변수들도 유지합니다:
```
NEXT_PUBLIC_SUPABASE_URL=https://ljrrinokzegzjbovssjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTg4MTQsImV4cCI6MjA1NzY5NDgxNH0.0Pfw3wLdvKperfxGpNTH1lytC_S1N8mK-xTmrRFBu-s
NEXT_PUBLIC_SUPABASE_DATABASE_URL=https://ljrrinokzegzjbovssjy.supabase.co
SUPABASE_JWT_SECRET=taUFtREY/7w8/vy8iYF/z7AxYMJ026Fcig693u5x38DPdIn7jWHs0VJvKxfYAd1uOPM+xahQRZ2d7NesqqzM7A==
SUPABASE_DATABASE_URL=https://ljrrinokzegzjbovssjy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY
```

#### AI API 설정
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### 기타 설정
```
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

### 3. 환경 변수 추가 방법

1. 각 환경 변수마다 **Add New** 버튼을 클릭합니다.
2. **Name**에 변수 이름을 입력합니다.
3. **Value**에 해당 값을 입력합니다.
4. **Environment**에서 **Production**, **Preview**, **Development** 모두 선택합니다.
5. **Save** 버튼을 클릭합니다.
6. 모든 환경 변수를 추가한 후 **Deployments** 탭에서 **Redeploy**를 클릭하여 새로운 배포를 시작합니다.

## 중요 사항

### 보안 주의사항
1. `FIREBASE_SERVICE_ACCOUNT_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`는 **절대 클라이언트 측 코드에서 참조하지 않아야 합니다**. 서버 측에서만 사용해야 합니다.
2. 환경 변수 이름에 `NEXT_PUBLIC_` 접두사가 있는 것만 클라이언트에서 접근 가능합니다.
3. Firebase 서비스 계정 키는 JSON 형태로 입력해야 하며, 줄바꿈을 제거하고 하나의 문자열로 만들어야 합니다.

### 배포 후 확인사항
1. 환경 변수 설정 후에는 반드시 **새로 배포**를 해야 변경사항이 적용됩니다.
2. 개발 환경에서는 `.env.local` 파일에 동일한 환경 변수를 설정해야 합니다.
3. Vercel에서는 환경 변수 변경 후 자동으로 재배포가 트리거되지 않으므로 수동으로 재배포해야 합니다.

## Firebase 설정 값 가져오는 방법

### Firebase Console에서 Web Config 가져오기
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **프로젝트 설정** (⚙️) > **일반** 탭
4. **내 앱** 섹션에서 웹 앱 선택
5. **Firebase SDK snippet** > **구성** 선택
6. `firebaseConfig` 객체의 값들을 해당 환경 변수에 복사

### Firebase Admin SDK 서비스 계정 키 생성
1. Firebase Console > **프로젝트 설정** > **서비스 계정** 탭
2. **새 비공개 키 생성** 클릭
3. 다운로드된 JSON 파일의 내용을 한 줄로 만들어서 `FIREBASE_SERVICE_ACCOUNT_KEY`에 설정

## 설정 확인하기

배포 후 브라우저 개발자 콘솔에서 다음을 확인하세요:

### Firebase 연결 확인
```javascript
// 콘솔에서 실행
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '설정됨' : '미설정',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '설정됨' : '미설정'
});
```

### Supabase 연결 확인
```javascript
// 콘솔에서 실행  
console.log('Supabase 환경:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정'
});
```

모든 값이 '설정됨'으로 표시되면 정상적으로 환경 변수가 설정된 것입니다. 