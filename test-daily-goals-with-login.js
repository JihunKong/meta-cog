const { chromium } = require('playwright');

async function testDailyGoalsWithLogin() {
  console.log('🚀 Playwright 테스트 시작 (로그인 포함)...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 로그인 페이지로 이동
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // 로그인 페이지 스크린샷
    await page.screenshot({ path: 'screenshot-login.png', fullPage: true });
    console.log('📸 로그인 페이지 스크린샷 저장됨');
    
    // 이메일과 비밀번호 입력 필드 찾기
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('✅ 로그인 폼 발견');
      
      // 테스트 계정 정보 (기존에 있던 학생 계정)
      await emailInput.fill('김서윤@pof.com');
      await passwordInput.fill('password');
      
      // 로그인 버튼 클릭
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인")');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('🔑 로그인 시도...');
        
        // 로그인 후 대기
        await page.waitForTimeout(3000);
        
        // 현재 URL 확인
        const currentUrl = page.url();
        console.log('📍 현재 URL:', currentUrl);
        
        if (currentUrl.includes('/dashboard/student')) {
          console.log('✅ 학생 대시보드로 자동 리디렉션됨');
        } else {
          console.log('🔄 학생 대시보드로 수동 이동...');
          await page.goto('http://localhost:3000/dashboard/student');
          await page.waitForTimeout(2000);
        }
        
        // 대시보드 스크린샷
        await page.screenshot({ path: 'screenshot-dashboard.png', fullPage: true });
        console.log('📸 대시보드 스크린샷 저장됨');
        
        // 목표 선언 탭 찾기
        console.log('🎯 목표 선언 탭 찾는 중...');
        
        const tabs = await page.locator('[role="tab"]').all();
        console.log(`📋 발견된 탭 수: ${tabs.length}`);
        
        for (let i = 0; i < tabs.length; i++) {
          const tabText = await tabs[i].textContent();
          console.log(`탭 ${i + 1}: ${tabText}`);
          
          if (tabText && tabText.includes('목표 선언')) {
            console.log(`✅ 목표 선언 탭 발견! 클릭 중...`);
            await tabs[i].click();
            await page.waitForTimeout(2000);
            break;
          }
        }
        
        // 목표 선언 탭 클릭 후 스크린샷
        await page.screenshot({ path: 'screenshot-goals-tab.png', fullPage: true });
        console.log('📸 목표 선언 탭 스크린샷 저장됨');
        
        // 페이지 내용 확인
        const pageContent = await page.textContent('body');
        
        if (pageContent.includes('DEBUG: 새로운 DailyGoalsFeed 컴포넌트 로딩됨')) {
          console.log('✅ DailyGoalsFeed 컴포넌트가 로딩됨');
        } else if (pageContent.includes('기본정보')) {
          console.log('❌ 여전히 기존 GoalsFeed가 로딩됨');
        } else if (pageContent.includes('오늘의 목표를 선언하고')) {
          console.log('✅ DailyGoalsFeed의 헤더 텍스트 발견');
        } else {
          console.log('❓ 알 수 없는 상태');
        }
        
        console.log('📋 현재 페이지 제목들:');
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        for (const heading of headings) {
          const text = await heading.textContent();
          if (text && text.trim()) console.log(`  - ${text.trim()}`);
        }
        
        console.log('📝 입력 필드들:');
        const inputs = await page.locator('input, textarea').all();
        for (let i = 0; i < inputs.length; i++) {
          const placeholder = await inputs[i].getAttribute('placeholder');
          const label = await inputs[i].getAttribute('aria-label');
          if (placeholder || label) {
            console.log(`  - ${placeholder || label}`);
          }
        }
        
      } else {
        console.log('❌ 로그인 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ 로그인 폼을 찾을 수 없음');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

testDailyGoalsWithLogin();