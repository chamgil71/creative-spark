# scripts/ — HTML → PPT 변환 도구

HTML 가이드 파일을 PowerPoint(.pptx)로 변환하는 Node.js CLI 스크립트입니다.

---

## 빠른 시작

```bash
# 단일 파일 변환
node scripts/html-to-pptx.mjs public/guides/Claude.html

# 출력 경로 지정
node scripts/html-to-pptx.mjs public/guides/Claude.html --out dist/Claude.pptx

# styles.json 색상 프리셋 적용
node scripts/html-to-pptx.mjs public/guides/notion.html --style knowledge

# 모든 가이드 일괄 변환
node scripts/html-to-pptx.mjs --all "public/guides/*.html"

# 상세 로그 출력
node scripts/html-to-pptx.mjs public/guides/Claude.html --verbose
```

출력 파일은 기본적으로 `dist-pptx/` 폴더에 저장됩니다.

---

## 옵션

| 옵션 | 설명 |
|------|------|
| `--out <path>` | 출력 .pptx 파일 경로 |
| `--style <key>` | `config/styles.json` 색상 프리셋 사용 |
| `--config <path>` | 커스텀 설정 파일 경로 |
| `--all` | 위치 인수를 glob 패턴으로 처리 |
| `--no-cover` | 표지 슬라이드 생성 안 함 |
| `--verbose` | 섹션/블록 파싱 상세 로그 출력 |

**`--style` 가능한 값:**

| 키 | 설명 | 브랜드 색상 |
|---|---|---|
| `ai-chat` | AI 챗봇 (초록) | #10A37F |
| `ai-dev` | AI 개발 도구 (오렌지) | #D97757 |
| `knowledge` | 노트·지식 관리 (퍼플) | #6366F1 |
| `productivity` | 생산성 유틸 (블루) | #1565C0 |
| `creative` | 크리에이티브 AI (마젠타) | #9B59B6 |

---

## 설정 파일 (`pptx.config.json`) 주요 항목

### 섹션 구분 방식 변경

```jsonc
// 기본값 — section.section / div.section 둘 다 지원
"sectionSelectors": ["section.hero", "section.section", "div.section", "section.done-section"]

// h2 태그 기준으로 나누고 싶다면
"sectionSelectors": ["h2"]
```

### 그리드 레이아웃 설정

```jsonc
"grid": {
  "cardMinW": 2.8,        // 카드 최소 폭 (인치)
  "cardMaxCols": 4,       // 최대 열 수
  "cardH": 1.6,           // 카드 고정 높이
  "overflowBehavior": "warn"  // "allow" 또는 "warn"
}
```

### 색상 소스 변경

```jsonc
// HTML CSS 변수 자동 추출 (기본값)
"colorSource": "html"

// styles.json 프리셋 사용
"colorSource": "styles-json",
"styleKey": "knowledge"
```

### 새 카드 클래스 추가

HTML 파일에 새로운 카드 클래스가 생기면:
```jsonc
"cardClasses": [
  "model-card", "project-card", ...,
  "my-new-card-class"   // ← 여기에 추가
]
```

---

## 파일 구조

```
scripts/
  html-to-pptx.mjs   ← 메인 변환 스크립트
  pptx.config.json   ← 전체 파라미터 설정 (주석 포함)
  README.md          ← 이 파일
```

**의존성 (package.json에 이미 포함):**
- `cheerio` — HTML 파싱
- `pptxgenjs` — PPT 생성

---

## HTML 파일 구조 패턴

이 스크립트는 두 가지 HTML 패턴을 자동으로 지원합니다:

| | Type A | Type B |
|---|---|---|
| 대표 파일 | notion.html, obsidian.html | claude.html, chatgpt.html |
| 섹션 태그 | `<section class="section">` | `<div class="section">` |
| 내부 래퍼 | `.section-inner` 있음 | 없음 |
| 제목 | `h2.section-title` | `.section-header h2` |
