const { chromium } = require('playwright');
const path = require('path');

// 스크린샷을 저장할 디렉토리
const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

// 테스트 계정 정보
const TEST_ACCOUNTS = {
  student: {
    email: 'test@pof.com',
    password: 'test123'
  },
  teacher: {
    email: 'purusil@naver.com', 
    password: 'rhdwlgns85'
  }
};

async function captureScreenshots() {
  const browser = await chromium.launch({ 
    headless: false, // 디버깅을 위해 브라우저 표시
    slowMo: 500 // 각 동작 사이에 딜레이 추가
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2 // 고화질 스크린샷
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📸 스크린샷 캡처 시작...\n');
    
    // 1. 로그인 화면
    console.log('1. 로그인 화면 캡처 중...');
    await page.goto('https://meta-cog.vercel.app/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'login-screen.png'),
      fullPage: false
    });
    console.log('✅ 로그인 화면 캡처 완료\n');
    
    // 2. 학생 대시보드
    console.log('2. 학생 대시보드 캡처 중...');
    // 학생으로 로그인
    await page.fill('input[type="email"]', TEST_ACCOUNTS.student.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.student.password);
    await page.click('button:has-text("로그인")');
    await page.waitForURL('**/dashboard/**');
    await page.waitForLoadState('networkidle');
    // 데이터 로딩을 위해 충분한 시간 대기
    await page.waitForTimeout(5000);
    // 스피너가 사라질 때까지 대기
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'student-dashboard.png'),
      fullPage: false
    });
    console.log('✅ 학생 대시보드 캡처 완료\n');
    
    // 3. 목표 선언 광장
    console.log('3. 목표 선언 광장 캡처 중...');
    await page.click('button[role="tab"]:has-text("목표 선언")');
    await page.waitForTimeout(5000);
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'goals-plaza.png'),
      fullPage: false
    });
    console.log('✅ 목표 선언 광장 캡처 완료\n');
    
    // 4. 리더보드
    console.log('4. 리더보드 캡처 중...');
    await page.click('button[role="tab"]:has-text("리더보드")');
    await page.waitForTimeout(5000);
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'leaderboard.png'),
      fullPage: false
    });
    console.log('✅ 리더보드 캡처 완료\n');
    
    // 5. AI 조언
    console.log('5. AI 조언 화면 캡처 중...');
    await page.click('button[role="tab"]:has-text("AI 조언")');
    await page.waitForTimeout(5000);
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai-advice.png'),
      fullPage: false
    });
    console.log('✅ AI 조언 화면 캡처 완료\n');
    
    // 로그아웃
    await page.click('button[aria-label="로그아웃"]');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("로그아웃")');
    await page.waitForURL('**/login');
    await page.waitForTimeout(2000);
    
    // 6. 교사 대시보드
    console.log('6. 교사 대시보드 캡처 중...');
    // 교사로 로그인
    await page.fill('input[type="email"]', TEST_ACCOUNTS.teacher.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.teacher.password);
    // 교사 역할 선택 - 다양한 셀렉터 시도
    try {
      await page.click('label:has-text("교사")');
    } catch (e) {
      try {
        await page.click('input[value="teacher"]');
      } catch (e2) {
        await page.click('[name="role"][value="teacher"]');
      }
    }
    await page.click('button:has-text("로그인")');
    await page.waitForURL('**/dashboard/teacher');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'teacher-dashboard.png'),
      fullPage: false
    });
    console.log('✅ 교사 대시보드 캡처 완료\n');
    
    // 7. 학생 상세 정보 모달
    console.log('7. 학생 상세 정보 모달 캡처 중...');
    // 첫 번째 학생 카드 클릭
    const studentCard = await page.locator('.MuiCard-root').first();
    if (studentCard) {
      await studentCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'student-detail-modal.png'),
        fullPage: false
      });
      // 모달 닫기
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    console.log('✅ 학생 상세 정보 모달 캡처 완료\n');
    
    // 8. 세션 기록 다이얼로그 (학생 계정으로 다시 로그인)
    console.log('8. 세션 기록 다이얼로그 캡처 중...');
    // 로그아웃
    await page.click('button[aria-label="로그아웃"]');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("로그아웃")');
    await page.waitForURL('**/login');
    await page.waitForTimeout(2000);
    
    // 학생으로 다시 로그인
    await page.fill('input[type="email"]', TEST_ACCOUNTS.student.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.student.password);
    // 학생 역할이 기본값이므로 클릭 필요 없음
    await page.click('button:has-text("로그인")');
    await page.waitForURL('**/dashboard/student');
    await page.waitForTimeout(5000);
    await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // 새 세션 시작 버튼 클릭
    await page.click('button:has-text("새 세션 시작")');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'session-dialog.png'),
      fullPage: false
    });
    console.log('✅ 세션 기록 다이얼로그 캡처 완료\n');
    
    console.log('🎉 모든 스크린샷 캡처 완료!');
    
  } catch (error) {
    console.error('❌ 스크린샷 캡처 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
captureScreenshots().catch(console.error);