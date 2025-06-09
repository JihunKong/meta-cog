const { chromium } = require('playwright');

async function testDailyGoals() {
  console.log('🚀 Playwright 테스트 시작...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 페이지 로드
    console.log('📄 페이지 로딩 중...');
    await page.goto('http://localhost:3000/dashboard/student');
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000);
    
    // 스크린샷 1: 초기 페이지
    await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
    console.log('📸 스크린샷 1 저장됨: screenshot-1-initial.png');
    
    // 목표 선언 탭 찾기 및 클릭
    console.log('🎯 목표 선언 탭 찾는 중...');
    
    // 탭들 확인
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`📋 발견된 탭 수: ${tabs.length}`);
    
    for (let i = 0; i < tabs.length; i++) {
      const tabText = await tabs[i].textContent();
      console.log(`탭 ${i + 1}: ${tabText}`);
      
      if (tabText && tabText.includes('목표 선언')) {
        console.log(`✅ 목표 선언 탭 발견! 클릭 중...`);
        await tabs[i].click();
        break;
      }
    }
    
    // 탭 클릭 후 대기
    await page.waitForTimeout(2000);
    
    // 스크린샷 2: 목표 선언 탭 클릭 후
    await page.screenshot({ path: 'screenshot-2-goals-tab.png', fullPage: true });
    console.log('📸 스크린샷 2 저장됨: screenshot-2-goals-tab.png');
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('DEBUG: 새로운 DailyGoalsFeed 컴포넌트 로딩됨')) {
      console.log('✅ DailyGoalsFeed 컴포넌트가 로딩됨');
    } else if (pageContent.includes('기본정보')) {
      console.log('❌ 여전히 기존 GoalsFeed가 로딩됨');
    } else {
      console.log('❓ 알 수 없는 상태');
    }
    
    console.log('📋 현재 페이지 제목들:');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    for (const heading of headings) {
      const text = await heading.textContent();
      if (text) console.log(`  - ${text}`);
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
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await browser.close();
    console.log('🏁 테스트 완료');
  }
}

testDailyGoals();