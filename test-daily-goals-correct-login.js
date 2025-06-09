const { chromium } = require('playwright');

async function testDailyGoalsWithCorrectLogin() {
  console.log('🚀 Playwright 테스트 시작 (올바른 계정으로 로그인)...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 로그인 페이지로 이동
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // 이메일과 비밀번호 입력 필드 찾기
    const emailInput = page.locator('input:nth-of-type(1)'); // 첫 번째 입력 필드
    const passwordInput = page.locator('input:nth-of-type(2)'); // 두 번째 입력 필드
    
    console.log('✅ 로그인 폼 발견');
    
    // 테스트 계정 정보 (DB에서 확인한 계정)
    await emailInput.fill('2201@pof.com');
    await passwordInput.fill('password');
    
    console.log('📝 계정 정보 입력 완료');
    
    // 로그인 버튼 클릭
    const loginButton = page.locator('button:has-text("로그인")');
    await loginButton.click();
    console.log('🔑 로그인 버튼 클릭...');
    
    // 로그인 후 리디렉션 대기 (최대 10초)
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      console.log('✅ 대시보드로 리디렉션됨');
    } catch (e) {
      console.log('⚠️ 리디렉션 타임아웃, 현재 URL 확인');
      console.log('현재 URL:', page.url());
      
      // 수동으로 대시보드로 이동
      await page.goto('http://localhost:3000/dashboard/student');
      await page.waitForTimeout(3000);
    }
    
    // 대시보드 스크린샷
    await page.screenshot({ path: 'screenshot-dashboard-logged-in.png', fullPage: true });
    console.log('📸 로그인된 대시보드 스크린샷 저장됨');
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForSelector('h1, h4', { timeout: 10000 });
    
    // 목표 선언 탭 찾기
    console.log('🎯 목표 선언 탭 찾는 중...');
    
    // 탭 텍스트 출력
    const allTabs = await page.locator('button, [role="tab"]').all();
    console.log(`📋 전체 버튼/탭 수: ${allTabs.length}`);
    
    for (let i = 0; i < allTabs.length; i++) {
      const tabText = await allTabs[i].textContent();
      console.log(`요소 ${i + 1}: ${tabText?.trim()}`);
      
      if (tabText && (tabText.includes('목표 선언') || tabText.includes('🎯'))) {
        console.log(`✅ 목표 선언 탭 발견! 클릭 중...`);
        await allTabs[i].click();
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    // 목표 선언 탭 클릭 후 스크린샷
    await page.screenshot({ path: 'screenshot-goals-tab-clicked.png', fullPage: true });
    console.log('📸 목표 선언 탭 클릭 후 스크린샷 저장됨');
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('DEBUG: 새로운 DailyGoalsFeed 컴포넌트 로딩됨')) {
      console.log('✅ DailyGoalsFeed 컴포넌트가 로딩됨');
    } else if (pageContent.includes('기본정보')) {
      console.log('❌ 여전히 기존 GoalsFeed가 로딩됨');
    } else if (pageContent.includes('오늘의 목표를 선언하고')) {
      console.log('✅ DailyGoalsFeed의 헤더 텍스트 발견');
    } else if (pageContent.includes('목표 선언 광장')) {
      console.log('✅ 목표 선언 광장 텍스트 발견');
    } else {
      console.log('❓ 알 수 없는 상태');
      console.log('페이지 일부 내용:', pageContent.substring(0, 200));
    }
    
    console.log('📋 현재 페이지 제목들:');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    for (const heading of headings) {
      const text = await heading.textContent();
      if (text && text.trim()) console.log(`  - ${text.trim()}`);
    }
    
    console.log('📝 입력 필드들:');
    const inputs = await page.locator('input, textarea').all();
    for (let i = 0; i < Math.min(inputs.length, 5); i++) { // 처음 5개만
      const placeholder = await inputs[i].getAttribute('placeholder');
      const value = await inputs[i].inputValue();
      if (placeholder) {
        console.log(`  - Placeholder: ${placeholder}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    // 오류 발생 시에도 스크린샷 찍기
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
    console.log('📸 오류 상황 스크린샷 저장됨');
  } finally {
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

testDailyGoalsWithCorrectLogin();