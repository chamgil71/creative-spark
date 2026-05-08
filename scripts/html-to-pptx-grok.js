import puppeteer from 'puppeteer';
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';

async function htmlToPowerPoint(input = 'ai_guide_standalone.html', outputFile = 'AI_가이드_허브_전체.pptx') {
  console.log('🚀 브라우저 실행 중...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const htmlContent = fs.readFileSync(input, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // 초기 렌더링 대기

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // 1. 홈 화면 캡처
  console.log('🏠 홈 화면 캡처 중...');
  let screenshot = await page.screenshot({ encoding: 'base64' });
  addSlide(pptx, screenshot, "AI 가이드 허브 - 홈");

  // 2. 사이드바 메뉴 항목들 찾아서 클릭하면서 캡처
  const menuItems = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('aside a[data-key], .sa-nav a[data-key]'));
    return links.map(link => ({
      key: link.getAttribute('data-key'),
      title: link.innerText.trim()
    })).filter(item => item.key);
  });

  console.log(`📋 발견된 메뉴: ${menuItems.length}개`);

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    console.log(`🔄 ${i+1}/${menuItems.length} ${item.title} 변환 중...`);

    // 메뉴 클릭
    await page.evaluate((key) => {
      const el = document.querySelector(`a[data-key="${key}"]`);
      if (el) el.click();
    }, item.key);

    // 콘텐츠 로드 대기
    await new Promise(r => setTimeout(r, 1200));

    // Shadow DOM 내부까지 포함해서 전체 캡처
    screenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: true 
    });

    addSlide(pptx, screenshot, item.title);
  }

  await pptx.writeFile({ fileName: outputFile });
  console.log(`\n🎉 변환 완료! → ${outputFile} (${menuItems.length + 1} 슬라이드)`);

  await browser.close();
}

function addSlide(pptx, base64Image, title) {
  const slide = pptx.addSlide();
  
  slide.addImage({
    data: `image/png;base64,${base64Image}`,
    x: 0, y: 0, w: '100%', h: '100%'
  });

  // 제목 오버레이 (편집 가능)
  slide.addText(title, {
    x: 0.8, y: 0.5, w: '85%', h: 1.5,
    fontSize: 32, bold: true, color: '1F2937',
    align: 'center',
    shadow: { type: 'outer', color: '000000', blur: 8 }
  });
}

// 실행
htmlToPowerPoint('scripts/ai_guide_standalone.html', 'AI_가이드_허브_전체.pptx') 
  .catch(err => console.error('❌ 오류:', err));

// 2. 당신의 AI 가이드 허브를 URL로 변환하고 싶다면
// htmlToPowerPoint('https://your-deployed-site.com', 'AI_가이드_허브.pptx');