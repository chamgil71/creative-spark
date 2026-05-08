# MD → PPTX 변환 가이드

Markdown 가이드 파일을 PowerPoint(.pptx)로 직접 변환합니다.  
HTML을 거치지 않고 MD → PPTX 단일 파이프라인으로 동작합니다.

---

## CLI 사용법

```bash
# 단일 파일
node scripts/md-to-pptx.mjs mddata/Supabase.md

# 출력 경로 지정
node scripts/md-to-pptx.mjs mddata/Supabase.md --out dist/Supabase.pptx

# 스타일 강제 지정 (frontmatter style: 보다 우선)
node scripts/md-to-pptx.mjs mddata/Supabase.md --style ai-dev

# 표지 슬라이드 제외
node scripts/md-to-pptx.mjs mddata/Supabase.md --no-cover

# 상세 로그 (섹션·아이템 목록, overflow 경고)
node scripts/md-to-pptx.mjs mddata/Supabase.md --verbose

# 일괄 변환
node scripts/md-to-pptx.mjs --all "mddata/*.md"

# npm 명령
npm run pptx:md -- mddata/Supabase.md
```

출력 기본 경로: `dist-pptx/<파일명>.pptx`

---

## 슬라이드 구조

```
MD 파일
  │
  ├── frontmatter        → 표지 슬라이드 (title, subtitle, logo, stats)
  ├── # 1. 섹션 제목    → 섹션 슬라이드 1
  │   ├── ## 카드 제목  →   카드 박스
  │   └── ::: steps     →   steps 그리드
  ├── # 2. 섹션 제목    → 섹션 슬라이드 2
  │   └── ...
  └── frontmatter.done   → 마무리 슬라이드 (선택)
```

---

## Shortcode → PPTX 매핑

shortcode 이름이 HTML 렌더러와 PPTX 렌더러를 모두 연결하는 식별자입니다.

| shortcode | HTML 클래스 | PPTX 렌더러 함수 |
|-----------|------------|-----------------|
| `icon-grid` | `.icon-grid > .icon-card` | `renderIconGrid()` |
| `feature-grid` | `.feature-grid > .feature-card` | `renderFeatureGrid()` |
| `steps` | `.step-list > .step-item` | `renderSteps()` |
| `compare-grid` | `.compare-grid > .compare-card` | `renderCompareGrid()` |

### 아이템 필드

| shortcode | 필드 |
|-----------|------|
| `icon-grid` | `icon`, `title`, `desc` |
| `feature-grid` | `tag`(선택), `icon`(선택), `title`, `desc` |
| `steps` | `num`(선택), `title`, `desc` |
| `compare-grid` | `title`, `desc`, `note`(선택) |

---

## 색상 설정 (templates/styles.json)

MD frontmatter의 `style:` 키로 색상 팔레트를 선택합니다.

```yaml
style: ai-dev   # ← 이 값이 styles.json 프리셋 키
```

| 키 | 색상 |
|------|------|
| `ai-chat` | 그린 `#10A37F` |
| `ai-dev` | 오렌지 `#D97757` |
| `knowledge` | 퍼플 `#6366F1` |
| `productivity` | 블루 `#1565C0` |
| `creative` | 마젠타 `#9B59B6` |
| `security` | 사이언 `#06B6D4` |
| `finance` | 골드 `#D4A017` |
| `future` | 네온 라임 `#84CC16` |
| `enterprise` | 슬레이트 `#475569` |
| `media` | 로즈 `#E11D48` |

---

## 디자인 설정 (scripts/pptdesign.config.json)

색상 이외의 모든 시각 설정은 이 파일에서 관리합니다.

```jsonc
{
  "slide": {
    "font":        "Malgun Gothic",   // 기본 한글 폰트
    "fontMono":    "Consolas",        // 코드 블록 폰트
    "marginX":     0.5,               // 좌우 여백 (인치)
    "bodyTopY":    1.25,              // 헤더 아래 콘텐츠 시작 Y
    "bodyBottomY": 7.05               // 슬라이드 하단 경계
  },
  "cover": {
    "titleFontSize":    40,           // 표지 큰 제목
    "subtitleFontSize": 16            // 표지 부제목
  },
  "header": {
    "h":             1.05,            // 헤더 바 높이
    "titleFontSize": 22               // 섹션 제목 폰트 크기
  },
  "card": {
    "titleSize":  13,                 // 카드 제목 (## 박스 제목)
    "bodySize":   11,                 // 본문 / 목록
    "h3Size":     13,                 // ### 소제목
    "codeSize":   10,                 // 코드 블록
    "radius":     0.08,               // 카드 모서리 반경
    "padX":       0.2,                // 카드 내부 좌우 패딩
    "padY":       0.18                // 카드 내부 상하 패딩
  },
  "grid": {
    "iconCardMinW":    1.8,           // icon-grid 최소 카드 폭
    "featureCardMinW": 2.6,           // feature-grid 최소 카드 폭
    "compareCardMinW": 2.2,           // compare-grid 최소 카드 폭
    "stepItemH":       0.68           // steps 항목 높이
  }
}
```

---

## 디자인 커스터마이징 가이드

| 바꾸고 싶은 것 | 수정 파일 |
|---------------|----------|
| 카드/텍스트 폰트 크기 | `pptdesign.config.json` → `card.titleSize`, `bodySize` 등 |
| 헤더 바 높이·폰트 | `pptdesign.config.json` → `header.h`, `titleFontSize` |
| 표지 레이아웃 | `pptdesign.config.json` → `cover.*` |
| 그리드 열 폭 | `pptdesign.config.json` → `grid.*MinW` |
| 브랜드 색상 | `templates/styles.json` → 해당 스타일 키 |
| 박스 형태·구조 변경 | `scripts/md-to-pptx.mjs` → `render*()` 함수 |

---

## 새 shortcode 추가 방법

`:::timeline` 을 예시로:

1. **`templates/build-guide.mjs`** — HTML 렌더러 추가
   ```js
   if (type === "timeline") {
     return `<div class="timeline">${items.map(it => `...`).join("")}</div>`;
   }
   ```

2. **`scripts/md-to-pptx.mjs`** — PPTX 렌더러 추가
   ```js
   function renderTimeline(slide, item, x, y, w, pal) { ... }

   // renderItem() 에 추가
   if (item.type === "timeline") return renderTimeline(slide, item, x, y, w, pal);
   ```

3. **`templates/html-to-md.mjs`** — 역변환 추가 (선택)
   ```js
   function timelineToMd($, el) { ... }
   ```

---

## 알려진 제한사항

- **Overflow 경고**: 섹션 콘텐츠가 슬라이드 높이(`bodyBottomY`)를 초과하면 `--verbose` 시 경고 출력. 슬라이드에는 그대로 그려지지만 잘릴 수 있음.
  - 해결: MD 섹션을 `---`로 나눠 내용 분산, 또는 `pptdesign.config.json`의 `bodyBottomY` 조정
- **CSS 효과 미지원**: HTML의 `box-shadow`, `::before` 등은 PPTX에서 근사 표현됨
- **폰트**: 한글 폰트(`Malgun Gothic`)는 PowerPoint에 해당 폰트가 설치된 환경에서만 정확히 렌더링됨
