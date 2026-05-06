# HTML → PPT 변환 구현 계획 및 분석 문서

> 작성일: 2026-05-06  
> 대상 파일: `scripts/html-to-pptx.mjs`

---

## 1. 기존 PPT 편집 버튼 에러 원인 분석

`src/lib/exportGuide.ts`의 `exportIframeToEditablePptx()` 함수에서 발생하는 에러의 근본 원인:

| # | 원인 | 상세 |
|---|------|------|
| 1 | **섹션 셀렉터 불일치** | 코드: `section.section` → 실제 HTML: `div.section` → `sections.length === 0` → body 전체를 1장으로 처리 |
| 2 | **카드 클래스 미인식** | `isCardEl()` 정규식이 실제 파일의 클래스(model-card, skill-item, block-card 등)와 불일치 |
| 3 | **`.section-inner` 없음** | Type B HTML에서 내부 래퍼가 없어 section-num(번호), section-header까지 파싱됨 |
| 4 | **색상 하드코딩** | `E.accent = "6366F1"` 인디고 고정 → HTML CSS 변수 무시 → 모든 파일에 동일 색상 |
| 5 | **blockHeight() 추정 실패** | grid/flex 레이아웃 높이를 텍스트 길이로만 추정 → 복잡한 카드 레이아웃에서 오버플로우 |

---

## 2. HTML 파일 구조 분석 결과

샘플 분석 대상: `Claude.html`, `Chatgpt.html`, `notion.html`, `obsidian.html`

### 두 가지 HTML 패턴

| 항목 | Type A (notion, obsidian) | Type B (claude, chatgpt) |
|------|--------------------------|--------------------------|
| **섹션 태그** | `<section class="section">` | `<div class="section">` |
| **내부 래퍼** | `<div class="section-inner">` | 없음 |
| **제목 요소** | `<h2 class="section-title">` | `<h2>` inside `.section-header` |
| **번호 요소** | `<div class="section-num"><div class="num">1</div><span class="label">Blocks</span></div>` | `<div class="section-num">1</div>` |
| **마무리 섹션** | `<section class="done-section">` | 없음 |
| **대표 파일** | notion.html, obsidian.html | claude.html, chatgpt.html |

### 파일별 CSS 변수 → 색상 매핑 결과

| 파일 | `--brand` / 주 색상 변수 | 배경 | 보더 |
|------|-------------------------|------|------|
| Claude.html | `--brand: #D97757` | `--bg: #FDF8F5` | `--border: #F0D9CC` |
| Chatgpt.html | `--brand: #10A37F` | `--bg: #F7FBF9` | `--border: #C8E6DF` |
| notion.html | `--accent: #0A85D1` (**brand 없음**) | `--bg: #F7F6F3` | `--border: #E3E2DF` |
| obsidian.html | `--purple: #7C3AED` (**brand 없음**) | `--bg: #FAFAF9` | `--border: #E9D5FF` |

→ `cssVarMapping.brand: ["--brand", "--purple", "--accent", "--black"]` 우선순위로 자동 처리

### 카드 클래스 목록 (파일별)

| 파일 | 카드 클래스 |
|------|------------|
| Claude | model-card, project-card, skill-item, integration-item, tip-box, prompt-box, system-prompt-demo |
| ChatGPT | plan-card, gpt-tool, mt-item, memory-item, memory-demo, tip-box, prompt-box |
| Notion | block-card, view-card, ai-card, ai-feature, shortcut-group, tip-box |
| Obsidian | concept-card, feature-item, plugin-card, tip-box |

### 그리드 클래스 목록 (파일별)

| 파일 | 그리드 클래스 |
|------|-------------|
| Claude | grid-2, grid-3, skill-grid, integration-grid |
| ChatGPT | plan-grid, gpt-tool-grid, memory-items |
| Notion | block-grid, view-grid, ai-features, shortcut-grid |
| Obsidian | concept-grid, plugin-grid, ai-features |

---

## 3. 신규 스크립트 설계

### 폴더 구조

```
templates/          ← 가이드 제작 도구 (기존, 변경 없음)
  build-guide.mjs
  html-to-md.mjs
  styles.json
  template.md
  README.md

scripts/            ← 변환 유틸 스크립트 (신규)
  html-to-pptx.mjs  ← 메인 변환 스크립트
  pptx.config.json  ← 전체 파라미터 설정 (주석 포함)
  README.md

dist-pptx/          ← 출력 폴더 (자동 생성)
```

### `html-to-pptx.mjs` 모듈 구조

```
loadConfig(configPath?)           → config 객체 (JSON5 주석 제거 파싱)
parseCLI(argv)                    → { positional, out, style, config, verbose, all }
stripComments(str)                → 주석 제거 JSON 문자열
deepMerge(base, override)         → 병합 객체

extractCssVars(html, mapping)     → { brand, brandLight, ... }
  resolveColor(value, varMap)     → hex | null  (var() 재귀 해석)
buildColorPalette(css, defaults)  → 최종 8종 색상 팔레트
applyStylePreset(config, preset)  → styles.json 프리셋 주입

parseSections($, config)          → SectionData[]
  parseSection($, el, config)     → { title, blocks }
  walkEl($, root, config, seen)   → Block[]
  isCardEl(el, cardClasses)       → boolean
  isGridEl(el, gridClasses)       → boolean
  extractGridItem($, el)          → GridItem
  extractCardText($, el)          → { title?, body }
  parseTable($, el)               → Block(table)
  normalize(str)                  → string
  shouldSkip(el)                  → boolean

blockHeight(block, cfg)           → number (인치)

buildPptx(sections, title, sub, colors, cfg, args)
  drawCoverSlide(pres, title, sub, colors, cfg)
  drawSlideHeader(slide, title, suffix, colors, cfg)
  drawPageNumber(slide, cur, total, colors, cfg)
  drawBlock(slide, block, x, y, w, colors, cfg)    → used height
  drawGridBlock(slide, block, x, y, w, colors, cfg) → used height
  drawCardItem(slide, item, x, y, w, h, colors, cfg)

main()  → async void
```

### Block 타입

```javascript
// kind: "h3" | "p" | "list" | "card" | "grid" | "table" | "code" | "quote"

// grid 타입 (신규): 가로 배치 전용
// { kind: "grid", items: GridItem[] }
// GridItem: { emoji?: string, title?: string, body: string }
```

---

## 4. CSS 변수 → 색상 팔레트 변환 흐름

```
HTML <style> 태그
    ↓ :root { } 블록 파싱
varMap: { "--brand": "#D97757", "--bg": "#FDF8F5", ... }
    ↓ cssVarMapping 우선순위 순 매핑
cssColors: { brand: "D97757", bg: "FDF8F5", ... }
    ↓ buildColorPalette()
colors: {
  bgDark:     "2D1B10"  (hero gradient 첫 번째 색)
  accent:     "D97757"  (brand → accent)
  accentLight:"FDF0EB"  (brandLight)
  accentDark: "B85F3F"  (brandDark)
  title:      "1A1A2E"  (text → title)
  body:       "4B5575"  (text-2 → body)
  cardBg:     "FDF0EB"  (brandLight → cardBg)
  cardBorder: "F0D9CC"  (border)
  ...
}
```

---

## 5. 섹션 파싱 알고리즘

```
1. config.ignoreSelector 요소 제거 (nav, footer, .back-top 등)

2. config.sectionSelectors 순서로 querySelectorAll
   (section.hero, section.section, div.section, section.done-section)

3. 각 섹션마다:
   a. config.titleSelectors 우선순위로 제목 추출
      (h2.section-title → .section-header h2 → h1 → h2)
   b. config.innerSelectors로 내부 래퍼 탐색
      (.section-inner 있으면 그 안만 파싱, 없으면 섹션 전체)
   c. section-num, section-header, section-sub 요소 skip 처리
   d. walkEl() 재귀 순회:
      ├── gridClasses 매칭 → grid 블록 (가로 배치)
      ├── cardClasses 매칭 → card 블록
      ├── h3/h4 → h3 블록
      ├── p → p 블록
      ├── ul/ol → list 블록
      ├── table → table 블록
      ├── pre → code 블록
      ├── blockquote → quote 블록
      └── div 등 컨테이너 → 재귀
```

---

## 6. 그리드 가로 배치 좌표 계산

```
입력: items 배열, startX, startY, totalW (슬라이드 가용 폭)

cols = min(items.length, gridMaxCols)
rows = ceil(items.length / cols)

cardW = cardMinW (고정값, overflowBehavior: "warn" → 초과 시 경고만)
필요 폭 = cols × cardW + (cols-1) × gapX

각 카드 위치:
  col = idx % cols
  row = floor(idx / cols)
  x = startX + col × (cardW + gapX)
  y = startY + row × (cardH + gapY)

총 사용 높이 = rows × cardH + (rows-1) × gapY
```

---

## 7. CLI 사용 예시

```bash
# 기본 변환 (dist-pptx/Claude.pptx 생성)
node scripts/html-to-pptx.mjs public/guides/Claude.html

# 상세 로그 확인 (섹션/블록 파싱 과정 출력)
node scripts/html-to-pptx.mjs public/guides/Claude.html --verbose

# styles.json 프리셋으로 색상 지정 (HTML CSS 무시)
node scripts/html-to-pptx.mjs public/guides/notion.html --style knowledge

# 출력 경로 직접 지정
node scripts/html-to-pptx.mjs public/guides/Claude.html --out "output/Claude 가이드.pptx"

# 표지 슬라이드 없이 변환
node scripts/html-to-pptx.mjs public/guides/Claude.html --no-cover

# 모든 가이드 일괄 변환
node scripts/html-to-pptx.mjs --all "public/guides/*.html"

# 커스텀 설정 파일 사용
node scripts/html-to-pptx.mjs public/guides/Claude.html --config my-config.json
```

---

## 8. 향후 개선 사항

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| 브라우저 버튼 수정 | `src/lib/exportGuide.ts`의 `exportIframeToEditablePptx()` 함수를 이 스크립트의 로직으로 교체 | 중 |
| 자동 페이지 분할 | `overflowBehavior: "split"` 옵션 추가 — 높이 초과 시 자동으로 슬라이드 분할 | 중 |
| 이모지/이미지 처리 | hero-logo SVG, 아이콘 이미지를 슬라이드에 삽입 | 하 |
| 표 스타일 개선 | 짝수행 배경색 적용 (`tr:nth-child(even)`) | 하 |
| 배치 스크립트 | `npm run pptx` 명령 추가 (package.json scripts) | 하 |
