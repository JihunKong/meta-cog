# Netlify 환경 변수 설정 가이드

Supabase 인증을 위해 Netlify에 필요한 환경 변수를 설정하는 방법을 안내합니다.

## 필요한 환경 변수

1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 익명 사용자용 키 (클라이언트에서 사용)
3. `SUPABASE_SERVICE_ROLE_KEY` - 서비스 롤 키 (서버에서만 사용)

## Netlify 대시보드에서 환경 변수 설정하기

1. [Netlify 대시보드](https://app.netlify.com/)에 로그인합니다.
2. 해당 프로젝트를 선택합니다.
3. **Site settings** > **Build & deploy** > **Environment** 메뉴로 이동합니다.
4. **Environment variables** 섹션에서 **Edit variables** 버튼을 클릭합니다.
5. 각 환경 변수를 추가합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://ljrrinokzegzjbovssjy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTg4MTQsImV4cCI6MjA1NzY5NDgxNH0.0Pfw3wLdvKperfxGpNTH1lytC_S1N8mK-xTmrRFBu-s`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcnJpbm9remVnempib3Zzc2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjExODgxNCwiZXhwIjoyMDU3Njk0ODE0fQ.dT1-dsN3MUeigfKRaK97UBg_pV7Cx88rh_dnwxlHiLY`
6. **Save** 버튼을 클릭합니다.
7. **Deploys** 탭으로 이동하여 **Trigger deploy** > **Deploy site**를 클릭하여 새로운 배포를 시작합니다.

## 중요 사항

1. `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 측 코드에서 참조하지 않아야 합니다. 이 키는 서버 측에서만 사용해야 합니다.
2. 환경 변수 설정 후에는 반드시 새로 배포를 해야 변경사항이 적용됩니다.
3. 개발 환경에서는 `.env.local` 파일에 동일한 환경 변수를 설정해야 합니다.

## 설정 확인하기

배포 후에는 개발자 콘솔에서 다음과 같은 로그를 확인하세요:

```
Supabase 환경: {url: '설정됨', anonKey: '설정됨', serviceKey: '설정됨'}
```

서비스 키가 설정됨으로 표시되면 정상적으로 환경 변수가 설정된 것입니다. 