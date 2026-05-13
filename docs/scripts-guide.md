# 스크립트 사용 가이드

> 최종 업데이트: 2026-05-13

---

## 활성 스크립트 목록

| 스크립트 | 방향 | 상태 |
|---------|------|------|
| `templates/build-guide.mjs` | MD → HTML | ✅ 완료 |
| `templates/html-to-md.mjs` | HTML → MD | ✅ 완료 |
| `scripts/md-to-pptx.mjs` | MD → PPTX | ✅ 완료 |
| `scripts/html-to-pptx.mjs` | HTML → PPTX | ✅ 완료 |
| `scripts/build-standalone.mjs` | HTML 번들 | ✅ 완료 |

---

## templates/build-guide.mjs — MD → HTML

```bash
node templates/build-guide.mjs <input.md> [output.html]
```

| 옵션 | 설명 |
|------|------|
| `<input.md>` | 변환할 Markdown 파일 |
| `[output.html]` | 출력 경로 (기본: `public/guides/<이름>.html`) |
| `--style <key>` | 색상 프리셋 강제 지정 (frontmatter보다 우선) |

```bash
# 예시
node templates/build-guide.mjs mddata/Supabase.md
node templates/build-guide.mjs mddata/Supabase.md public/guides/Supabase.html
node templates/build-guide.mjs mddata/Supabase.md --style ai-dev
```

**동작:** `config/styles.json` + `config/pptdesign.config.json`에서 색상·둥글기 읽어 인라인 CSS 생성.

---

## templates/html-to-md.mjs — HTML → MD

기존 HTML 가이드를 Markdown으로 역변환.

```bash
node templates/html-to-md.mjs <input.html> [output.md]
```

```bash
# 예시
node templates/html-to-md.mjs public/guides/Claude.html mddata/Claude.md
```

**동작:**
- cheerio로 HTML 파싱
- `.icon-grid`, `.feature-card`, `.tool-card` 등 → `:::` shortcode 블록으로 복원
- `<head><title>`, `:root` CSS 변수 → frontmatter로 추출

---

## scripts/html-to-pptx.mjs — HTML → PPTX

HTML 가이드를 PPTX로 변환하는 파이프라인 래퍼 (HTML → MD → PPTX 체인).

```bash
node scripts/html-to-pptx.mjs <input.html> [옵션]
```

| 옵션 | 설명 |
|------|------|
| `--out <path>` | 출력 .pptx 경로 (기본: `dist-pptx/<이름>.pptx`) |
| `--style <key>` | 색상 프리셋 강제 지정 |
| `--no-cover` | 표지 슬라이드 생성 안 함 |
| `--verbose` | 섹션·아이템 타입 상세 로그 |
| `--all` | glob 패턴으로 일괄 변환 |

```bash
# 예시
node scripts/html-to-pptx.mjs public/guides/Supabase.html
node scripts/html-to-pptx.mjs public/guides/Claude.html --style ai-chat --verbose
node scripts/html-to-pptx.mjs --all "public/guides/*.html"
```

**동작:** `html-to-md.mjs`로 MD 텍스트 생성 → 임시 파일 → `md-to-pptx.mjs`로 변환 → 임시 파일 삭제.

---

## scripts/md-to-pptx.mjs — MD → PPTX

Universal Schema(6대 표준 키) 기반 완성형 변환기.

```bash
node scripts/md-to-pptx.mjs <input.md> [옵션]
```

| 옵션 | 설명 |
|------|------|
| `--out <path>` | 출력 .pptx 경로 (기본: `dist-pptx/<이름>.pptx`) |
| `--style <key>` | 색상 프리셋 강제 지정 |
| `--no-cover` | 표지 슬라이드 생성 안 함 |
| `--verbose` | 섹션·아이템 타입 상세 로그 |
| `--all` | glob 패턴으로 일괄 변환 |

```bash
# 예시
node scripts/md-to-pptx.mjs mddata/Supabase.md
node scripts/md-to-pptx.mjs mddata/Supabase.md --style ai-dev --verbose
node scripts/md-to-pptx.mjs --all "mddata/*.md"
```

**지원 숏코드:** `icon-grid` · `feature-grid` · `tool-card` · `workflow` · `steps` · `compare-grid` · `plan-grid` · `compare-2col` · `bottom-list`

---

## scripts/build-standalone.mjs — Standalone HTML 번들

모든 가이드를 Shadow DOM으로 묶은 단일 HTML 파일 생성.

```bash
npm run build:standalone
# 또는
node scripts/build-standalone.mjs
```

출력: `public/standalone-guides-only.html`

---

## 설정 파일 (`config/`)

모든 JSON 설정 파일은 `config/` 폴더에서 관리합니다. 스크립트는 하드코딩 없이 이 폴더를 참조합니다.

| 파일 | 용도 | 참조 스크립트 |
|------|------|-------------|
| `styles.json` | 브랜드 색상 프리셋 10종 | build-guide, html-to-md, md-to-pptx |
| `shortcode-map.json` | CSS class → shortcode 매핑 규칙 | html-to-md |
| `pptdesign.config.json` | PPTX 레이아웃·팔레트·수치 | md-to-pptx, build-guide(radius) |

### config/styles.json

카테고리별 색상 프리셋. `style:` frontmatter 키로 선택.

```json
{
  "ai-chat":      { "brand": "#10A37F", "brandDark": "...", "brandLight": "...", ... },
  "ai-dev":       { "brand": "#D97757", ... },
  "knowledge":    { "brand": "#6366F1", ... },
  "productivity": { "brand": "#1565C0", ... },
  "creative":     { "brand": "#9B59B6", ... },
  "security":     { "brand": "#06B6D4", ... },
  "finance":      { "brand": "#D4A017", ... },
  "future":       { "brand": "#84CC16", ... },
  "enterprise":   { "brand": "#475569", ... },
  "media":        { "brand": "#E11D48", ... }
}
```

### config/pptdesign.config.json

PPTX 레이아웃 수치 설정. HTML 변환 시 둥글기(globalRadius) 값도 공유.

주요 섹션:

| 섹션 | 용도 |
|------|------|
| `slide` | 슬라이드 크기, 폰트, 여백 |
| `cover` | 표지 슬라이드 좌표 |
| `header` | 상단 헤더 높이·폰트 |
| `card` | 카드 패딩·폰트 크기 |
| `grid` | 그리드 간격·최소 너비 |
| `workflow` | 워크플로우 박스 크기 |
| `planGrid` | 요금제 그리드 |
| `bottomList` | 칩 목록 스타일 |
| `compare2col` | 2단 비교 여백 |
| `output` | 출력 디렉토리 설정 |

---

## 보관 위치

미완성·미사용 스크립트는 `temp/backup/`에 보관.

| 파일 | 이유 |
|------|------|
| `md-to-pptx_v1.mjs` | MD→PPTX 구버전 (v2로 대체) |
| `html-to-pptx.mjs` | HTML→PPTX 근사 렌더링 (미완성) |
| `html-to-pptx-hybrid.mjs` | Playwright 캡처 방식 (미완성) |
| `html-to-pptx-grok.js` | 실험적 구현 (미사용) |
| `html-to-pptx-image.mjs` | 이미지 캡처 방식 (미사용) |
| `merge_ppt.py` | Python PPT 병합 (미사용) |
| `pptx.config.json` | html-to-pptx 전용 구형 설정 |
