# Firebase Console 설정 가이드

Firebase 프로젝트의 보안 규칙과 인덱스를 설정하는 방법을 안내합니다.

## 1. Firebase 보안 규칙 설정

### 접속 방법
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `meta-cog-7d9d3` 프로젝트 선택
3. 좌측 메뉴 > **Firestore Database** 클릭
4. **규칙** 탭 선택

### 적용할 보안 규칙

다음 규칙을 복사하여 Firebase Console에 붙여넣으세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 기존 세션 및 사용자 규칙은 그대로 유지
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    match /student_names/{nameId} {
      allow read, write: if request.auth != null;
    }
    
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
```

### 규칙 게시 방법
1. 위 규칙을 복사하여 Firebase Console 규칙 편집기에 붙여넣기
2. **게시** 버튼 클릭
3. 확인 대화상자에서 **게시** 클릭

## 2. Firebase 인덱스 설정

### 접속 방법
1. Firebase Console > **Firestore Database**
2. **인덱스** 탭 선택
3. **복합 인덱스** 섹션에서 **인덱스 추가** 클릭

### 생성할 인덱스 목록

다음 인덱스들을 차례대로 생성하세요:

#### 1. goalDeclarations - 사용자별 목표 조회용
- **컬렉션 ID**: `goalDeclarations`
- **필드**:
  - `userId` (오름차순)
  - `declaredAt` (내림차순)
- **쿼리 범위**: 컬렉션

#### 2. goalDeclarations - 공개 목표 조회용
- **컬렉션 ID**: `goalDeclarations`
- **필드**:
  - `isPublic` (오름차순)
  - `declaredAt` (내림차순)
- **쿼리 범위**: 컬렉션

#### 3. goalSupports - 목표별 응원 조회용
- **컬렉션 ID**: `goalSupports`
- **필드**:
  - `goalId` (오름차순)
  - `createdAt` (내림차순)
- **쿼리 범위**: 컬렉션

#### 4. goalUpdates - 목표 업데이트 조회용
- **컬렉션 ID**: `goalUpdates`
- **필드**:
  - `goalId` (오름차순)
  - `createdAt` (내림차순)
- **쿼리 범위**: 컬렉션

#### 5. sessions - 리더보드용 (기존 있을 수 있음)
- **컬렉션 ID**: `sessions`
- **필드**:
  - `user_id` (오름차순)
  - `created_at` (내림차순)
- **쿼리 범위**: 컬렉션

### 인덱스 생성 방법
1. 각 인덱스마다 **인덱스 추가** 버튼 클릭
2. 위 정보대로 필드 설정
3. **만들기** 버튼 클릭
4. 인덱스 빌드 완료까지 대기 (수분 소요)

## 3. Firebase Authentication 설정

### 로그인 제공업체 활성화
1. Firebase Console > **Authentication**
2. **Sign-in method** 탭 선택
3. 필요한 제공업체 활성화:
   - **이메일/비밀번호** 활성화
   - **Google** (선택사항)

### 승인된 도메인 추가
1. **승인된 도메인** 섹션에서 도메인 추가:
   - `localhost` (개발용)
   - `your-vercel-domain.vercel.app` (프로덕션용)

## 4. 설정 확인

### 규칙 테스트
1. Firebase Console > **Firestore Database** > **규칙**
2. **규칙 플레이그라운드** 클릭
3. 다양한 시나리오로 테스트:
   - 인증된 사용자의 자신 데이터 접근
   - 공개 목표 읽기
   - 다른 사용자 데이터 접근 시도 (거부되어야 함)

### 인덱스 상태 확인
1. **인덱스** 탭에서 모든 인덱스가 **사용 설정됨** 상태인지 확인
2. **빌드 중**인 인덱스가 있다면 완료까지 대기

## 5. 문제 해결

### 규칙 오류가 발생하는 경우
- Firebase Console의 로그 확인
- 규칙 시뮬레이터에서 테스트
- 기존 데이터와 새 규칙의 호환성 확인

### 인덱스 오류가 발생하는 경우
- 콘솔에서 제안되는 인덱스 링크 클릭
- 자동 생성된 인덱스 활용
- 쿼리 패턴과 인덱스 일치 여부 확인

## 6. 성능 모니터링

### Firebase Performance 활성화
1. Firebase Console > **Performance**
2. **시작하기** 클릭
3. 웹 앱 성능 모니터링 활성화

### 사용량 모니터링
1. **사용량** 탭에서 Firestore 읽기/쓰기 현황 확인
2. 비용 관리를 위한 알림 설정

## ✅ 설정 완료 체크리스트

- [ ] 보안 규칙 적용 및 게시
- [ ] 5개 복합 인덱스 생성 완료
- [ ] Authentication 로그인 제공업체 활성화
- [ ] 승인된 도메인 추가
- [ ] 규칙 플레이그라운드 테스트 완료
- [ ] 모든 인덱스 빌드 완료 확인
- [ ] 성능 모니터링 활성화

모든 항목이 완료되면 리더보드와 목표 선언 시스템이 완전히 작동합니다! 🎉