const { chromium } = require('playwright');

async function testDailyGoalsFinal() {
  console.log('🚀 Playwright 테스트 시작 (최종 버전)...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 로그인 페이지로 이동
    console.log('🔐 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // 이메일과 비밀번호 입력 필드를 정확한 방법으로 찾기
    const emailInput = page.getByRole('textbox', { name: '이메일' });
    const passwordInput = page.getByRole('textbox', { name: '비밀번호' });
    
    console.log('✅ 로그인 폼 발견');
    
    // 테스트 계정 정보
    await emailInput.fill('2201@pof.com');
    await passwordInput.fill('password');
    
    console.log('📝 계정 정보 입력 완료');
    
    // 로그인 버튼 클릭
    const loginButton = page.getByRole('button', { name: '로그인' });
    await loginButton.click();
    console.log('🔑 로그인 버튼 클릭...');
    
    // 로그인 후 리디렉션 대기
    await page.waitForTimeout(5000);
    
    console.log('현재 URL:', page.url());
    
    // 수동으로 대시보드로 이동
    await page.goto('http://localhost:3000/dashboard/student');
    await page.waitForTimeout(5000);
    
    // 대시보드 스크린샷
    await page.screenshot({ path: 'screenshot-dashboard-final.png', fullPage: true });
    console.log('📸 로그인된 대시보드 스크린샷 저장됨');
    
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 목표 선언 탭 찾기 (더 넓은 범위로)
    console.log('🎯 목표 선언 탭 찾는 중...');
    
    const allElements = await page.locator('*:has-text("목표")').all();
    console.log(`📋 "목표" 포함 요소 수: ${allElements.length}`);
    
    for (let i = 0; i < allElements.length; i++) {
      const text = await allElements[i].textContent();
      console.log(`목표 관련 요소 ${i + 1}: ${text?.trim()}`);
      
      if (text && text.includes('🎯 목표 선언')) {
        console.log(`✅ 목표 선언 탭 발견! 클릭 중...`);
        await allElements[i].click();
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    // Tab 역할을 가진 요소들도 확인
    const tabElements = await page.locator('[role="tab"]').all();
    console.log(`📋 Tab role 요소 수: ${tabElements.length}`);
    
    for (let i = 0; i < tabElements.length; i++) {
      const text = await tabElements[i].textContent();
      console.log(`Tab ${i + 1}: ${text?.trim()}`);
      
      if (text && text.includes('목표 선언')) {
        console.log(`✅ 목표 선언 탭 발견! 클릭 중...`);
        await tabElements[i].click();
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    // 목표 선언 탭 클릭 후 스크린샷
    await page.screenshot({ path: 'screenshot-goals-tab-final.png', fullPage: true });
    console.log('📸 목표 선언 탭 클릭 후 스크린샷 저장됨');
    
    // 페이지 내용 확인
    const bodyText = await page.locator('body').textContent();
    
    console.log('📄 페이지 내용 분석:');
    if (bodyText.includes('DEBUG: 새로운 DailyGoalsFeed 컴포넌트 로딩됨')) {
      console.log('✅ DailyGoalsFeed 컴포넌트가 로딩됨');
    }
    if (bodyText.includes('기본정보')) {
      console.log('❌ 기존 GoalsFeed의 "기본정보" 텍스트 발견');
    }
    if (bodyText.includes('오늘의 목표를 선언하고')) {
      console.log('✅ DailyGoalsFeed의 "오늘의 목표를 선언하고" 텍스트 발견');
    }
    if (bodyText.includes('목표 선언 광장')) {
      console.log('✅ "목표 선언 광장" 헤더 텍스트 발견');
    }
    if (bodyText.includes('동기와 보상')) {
      console.log('❌ 기존 폼의 "동기와 보상" 텍스트 발견');
    }
    
    console.log('📋 현재 페이지 제목들:');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    for (const heading of headings) {
      const text = await heading.textContent();
      if (text && text.trim()) console.log(`  - ${text.trim()}`);
    }
    
    console.log('📝 텍스트 입력 필드들:');
    const textInputs = await page.locator('input[type="text"], textarea').all();
    for (let i = 0; i < Math.min(textInputs.length, 3); i++) {
      const placeholder = await textInputs[i].getAttribute('placeholder');
      if (placeholder) {
        console.log(`  - ${placeholder}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    await page.screenshot({ path: 'screenshot-error-final.png', fullPage: true });
    console.log('📸 오류 상황 스크린샷 저장됨');
  } finally {
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

testDailyGoalsFinal();