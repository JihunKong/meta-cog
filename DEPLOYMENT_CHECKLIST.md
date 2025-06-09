# 🚀 배포 체크리스트

meta-cog 앱의 완전한 배포를 위한 단계별 가이드입니다.

## ✅ 완료된 작업들

### 1. 개발 환경 설정
- [x] Firebase 클라이언트 설정 완료
- [x] Firebase Admin SDK 설정 완료  
- [x] Supabase 연동 유지
- [x] AI API (Anthropic) 설정 완료
- [x] 로컬 환경변수 (.env.local) 설정 완료

### 2. 새로운 시스템 구현
- [x] 공정한 리더보드 시스템 개발
- [x] 목표 선언 및 응원 시스템 개발
- [x] Firebase 컬렉션 구조 설계 및 생성
- [x] API 엔드포인트 구현 완료
- [x] UI 컴포넌트 개발 완료

### 3. 데이터 보존
- [x] 기존 학생 학습 데이터 100% 보존 확인
- [x] sessions: 5개 문서 유지
- [x] users: 5개 문서 유지
- [x] student_names: 5개 문서 유지

### 4. 품질 보증
- [x] 빌드 테스트 성공
- [x] 환경변수 검증 스크립트 작성
- [x] 시스템 상태 확인 도구 제공

## 🔄 배포 단계

### 1단계: Vercel 환경변수 설정
📖 **가이드**: `VERCEL_ENV_SETUP.md` 참조

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 > Settings > Environment Variables
3. 다음 환경변수들을 모든 환경(Production, Preview, Development)에 추가:

```bash
# Firebase 클라이언트 설정
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA_cP-WYvEP5KTJ0NrIj8OnCANosK9zUY0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meta-cog-7d9d3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meta-cog-7d9d3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meta-cog-7d9d3.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=212530945963
NEXT_PUBLIC_FIREBASE_APP_ID=1:212530945963:web:4d58cce9f19ae338f37cee
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-K1TV9ZR1KV

# Firebase Admin SDK
FIREBASE_PROJECT_ID=meta-cog-7d9d3
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@meta-cog-7d9d3.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY_HERE]\n-----END PRIVATE KEY-----\n"

# 기타 API 키들
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://ljrrinokzegzjbovssjy.supabase.co
[... 나머지 Supabase 환경변수들]
```

4. 환경변수 설정 후 **Deploy** 버튼으로 재배포

### 2단계: Firebase Console 설정
📖 **가이드**: `FIREBASE_SETUP_GUIDE.md` 참조

#### 보안 규칙 설정
1. [Firebase Console](https://console.firebase.google.com/) > meta-cog-7d9d3
2. Firestore Database > 규칙 탭
3. 제공된 보안 규칙 적용 및 게시

#### 인덱스 생성 (5개)
1. Firestore Database > 인덱스 탭
2. 다음 복합 인덱스들 생성:
   - `goalDeclarations`: userId + declaredAt(desc)
   - `goalDeclarations`: isPublic + declaredAt(desc)  
   - `goalSupports`: goalId + createdAt(desc)
   - `goalUpdates`: goalId + createdAt(desc)
   - `sessions`: user_id + created_at(desc)

#### Authentication 설정
1. Authentication > Sign-in method
2. 이메일/비밀번호 활성화
3. 승인된 도메인에 Vercel 도메인 추가

### 3단계: 배포 확인

#### 빌드 테스트
```bash
npm run build
# 성공적으로 완료되어야 함
```

#### 시스템 검증
```bash
npm run final-check
# 모든 항목이 ✅ 상태여야 함
```

#### 배포 후 테스트
1. 학생 로그인 테스트
2. 기존 학습 데이터 접근 확인
3. 새 리더보드 표시 확인
4. 목표 선언 기능 테스트

## 🎯 핵심 기능 검증

### 학생 대시보드
- [ ] 기존 학습 세션 데이터 정상 표시
- [ ] 새 리더보드 탭 작동
- [ ] 목표 선언 탭 작동
- [ ] 통계 및 캘린더 정상 작동

### 교사 대시보드  
- [ ] 개선된 리더보드 표시
- [ ] 학생 상세 정보 접근
- [ ] 피드백 기능 정상 작동

### 리더보드 시스템
- [ ] 공정한 점수 계산 (성취도 제외)
- [ ] 일관성, 품질, 참여도, 연속성 점수 표시
- [ ] 하루 최대 3세션 제한 적용

### 목표 선언 시스템
- [ ] 목표 작성 및 공개/비공개 설정
- [ ] 응원 및 댓글 기능
- [ ] 진행률 업데이트 기능

## ⚠️ 주의사항

### 데이터 안전
- 기존 학생 데이터는 절대 수정되지 않음
- 새 컬렉션만 추가됨
- 백업이 자동으로 유지됨

### 성능 최적화
- Firebase 인덱스 생성 완료 후 사용
- 리더보드 쿼리 최적화됨
- 캐싱 전략 적용됨

### 보안
- Firebase 보안 규칙로 데이터 보호
- 사용자별 접근 권한 제어
- API 키 서버 측에서만 사용

## 🎉 배포 완료 후

### 모니터링
1. Firebase Console에서 사용량 확인
2. Vercel Analytics에서 성능 모니터링
3. 학생 및 교사 피드백 수집

### 추가 개선사항
- 알림 시스템 구현
- 모바일 앱 연동
- 고급 통계 분석

## 📞 지원

### 문제 발생 시
1. `npm run final-check`로 시스템 상태 확인
2. Firebase Console에서 로그 확인
3. Vercel Dashboard에서 배포 로그 확인

### 유용한 명령어
```bash
npm run check-env      # 환경변수 확인
npm run firebase-help  # Firebase 설정 도움말  
npm run final-check    # 전체 시스템 상태 확인
npm run build         # 프로덕션 빌드 테스트
```

---

**🚀 준비 완료!** 이 체크리스트를 따라하면 학생들의 공정한 학습 경쟁과 목표 달성을 지원하는 완전한 시스템이 배포됩니다.