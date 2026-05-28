import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const HTML_DIR = 'c:/ai/creative-spark/data/html_src1';
const CONFIG_DIR = 'c:/ai/creative-spark/config';

const SHORTCODE_MAP = JSON.parse(
  fs.readFileSync(path.join(CONFIG_DIR, 'shortcode-map.json'), 'utf8')
);

// 숏코드에 이미 매핑된 클래스 집합
const MAPPED_CLASSES = new Set();
for (const [type, rule] of Object.entries(SHORTCODE_MAP)) {
  if (type.startsWith('$')) continue;
  for (const cls of rule.htmlClasses || []) {
    MAPPED_CLASSES.add(cls);
  }
}

// 공용으로 제공되는 몇몇 CSS나 HTML 표준 클래스 및 레이아웃 요소 무시 목록
const IGNORE_CLASSES = new Set([
  'nav', 'nav-inner', 'nav-logo', 'nav-links', 'hero', 'hero-inner', 'hero-badge', 'hero-logo',
  'hero-stats', 'hero-stat', 'section', 'section-header', 'section-num', 'section-title',
  'card', 'card-title', 'back-top', 'logo-icon', 'active', 'pulse'
]);

const files = fs.readdirSync(HTML_DIR).filter(f => f.toLowerCase().endsWith('.html') || f.toLowerCase().endsWith('.htm'));

const analysisReport = [];

for (const file of files) {
  const fp = path.join(HTML_DIR, file);
  const html = fs.readFileSync(fp, 'utf8');
  const $ = load(html);

  // 1. <style> 태그 안에서 독특한 사용자 정의 스타일 규칙이 선언되어 있는지 파악
  const styleText = $('style').text();
  const customSelectors = [];
  
  // style 내용 중 클래스 셀렉터들 추출
  const matches = styleText.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || [];
  const selectors = new Set(matches.map(m => m.slice(1, -1).trim()));

  const uniqueCustomClasses = [];
  for (const sel of selectors) {
    if (!MAPPED_CLASSES.has(sel) && !IGNORE_CLASSES.has(sel)) {
      uniqueCustomClasses.push(sel);
    }
  }

  // 2. HTML 본문 내에서 숏코드로 매핑되지 않는 특이 구조 탐색
  const unmappedElements = [];
  $('[class]').each((_, el) => {
    const clsList = ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
    const tag = el.tagName.toLowerCase();
    for (const cls of clsList) {
      if (!MAPPED_CLASSES.has(cls) && !IGNORE_CLASSES.has(cls)) {
        unmappedElements.push({ tag, cls });
      }
    }
  });

  // 중복 정리
  const uniqueUnmappedElements = [];
  const seen = new Set();
  for (const item of unmappedElements) {
    const key = `${item.tag}.${item.cls}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueUnmappedElements.push(item);
    }
  }

  // 3. 특수 태그 구조 분석 (예: nested table, iframe, custom layout 등)
  const specialStructures = [];
  if ($('table').length > 0) specialStructures.push('table(비교표/데이터표)');
  if ($('iframe').length > 0) specialStructures.push('iframe(임베디드 비디오/웹페이지)');
  if ($('.model-timeline').length > 0) specialStructures.push('model-timeline(시간순/버전순 타임라인)');
  if ($('.memory-demo').length > 0) specialStructures.push('memory-demo(메모리 시각화 보드)');
  if ($('.shortcut-grid').length > 0) specialStructures.push('shortcut-grid(단축키 카드 그리드)');
  if ($('.sparkpage-demo').length > 0) specialStructures.push('sparkpage-demo(웹 브라우저 크롤링 요약 데모)');
  
  // 만약 uniqueCustomClasses나 uniqueUnmappedElements가 있다면 리포트에 기록
  if (uniqueCustomClasses.length > 0 || uniqueUnmappedElements.length > 0 || specialStructures.length > 0) {
    analysisReport.push({
      file,
      fp,
      customClasses: uniqueCustomClasses,
      unmappedClasses: uniqueUnmappedElements.map(x => `${x.tag}.${x.cls}`),
      specialStructures
    });
  }
}

const destJson = 'c:/ai/creative-spark/scratch/analysis_result.json';
fs.writeFileSync(destJson, JSON.stringify(analysisReport, null, 2), 'utf8');
console.log(`✅ 분석 완료 보고서 JSON 저장됨: ${destJson}`);

