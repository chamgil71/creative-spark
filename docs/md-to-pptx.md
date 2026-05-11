# MD → PPTX 파이프라인 완전 가이드

Markdown 파일 하나로 PowerPoint를 생성하는 파이프라인입니다.  
HTML 변환 없이 MD → PPTX 단일 경로로 동작하며, 모든 디자인 수치는 JSON 파일로 제어합니다.

---

## 1. 파일 관계도

```
[작성자]
  └─ guides/*.md  ←──── template.md 참고해 작성
       │
       ▼
scripts/md-to-pptx.mjs          ← 변환 엔진 (메인)
  ├── scripts/pptdesign.config.json  ← 레이아웃·치수·팔레트 (모든 수치)
  └── templates/styles.json          ← 브랜드 색상 프리셋 10종
       │
       ▼
  dist-pptx/*.pptx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[별도 파이프라인 — md-to-pptx와 무관]

templates/build-guide.mjs  ──→  dist-guide/*.html
scripts/pptx.config.json   ──→  scripts/html-to-pptx.mjs (HTML→PPTX)
```

---

## 2. 파일별 역할

| 파일 | 역할 | md-to-pptx와 관계 |
|------|------|-------------------|
| `templates/template.md` | shortcode 문법 참조 / 가이드 작성 시작점 | 작성자 참고용 (런타임 불필요) |
| `scripts/pptdesign.config.json` | PPTX 레이아웃 치수·고정 팔레트 전체 | md-to-pptx.mjs가 읽음 |
| `templates/styles.json` | 브랜드 색상 프리셋 10종 | md-to-pptx.mjs가 읽음 |
| `scripts/md-to-pptx.mjs` | MD→PPTX 변환기 (메인) | 위 두 파일에만 의존 |
| `templates/build-guide.mjs` | MD→HTML 변환기 (별도 파이프라인) | md-to-pptx와 **무관** |
| `scripts/pptx.config.json` | html-to-pptx.mjs 전용 설정 | md-to-pptx와 **무관** |

---

## 3. 독립 이동 시 복사 파일

다른 프로젝트나 서버로 이동할 때 아래 **3개 파일**만 복사하면 동작합니다.

```
scripts/
  md-to-pptx.mjs          ← 변환 엔진 (외부 의존 없음)
  pptdesign.config.json    ← 레이아웃·팔레트 설정
templates/
  styles.json              ← 색상 프리셋
```

**npm 패키지 의존성** (이동 후 `npm install` 필요):

```
pptxgenjs   — PPTX 생성
gray-matter — frontmatter 파싱
marked      — Markdown 토큰화
```

**Node.js 18+** 필요 (ES Module, `node:fs`, `node:path` 사용).

> `build-guide.mjs`는 필요 없습니다. `md-to-pptx.mjs`는 shortcode 파서를 내부에 직접 포함하고 있습니다.

---

## 4. CLI 사용법

```bash
# 단일 파일
node scripts/md-to-pptx.mjs guides/MyGuide.md

# 출력 경로 지정
node scripts/md-to-pptx.mjs guides/MyGuide.md --out dist/MyGuide.pptx

# 스타일 강제 지정 (frontmatter style: 보다 우선)
node scripts/md-to-pptx.mjs guides/MyGuide.md --style enterprise

# 표지 슬라이드 제외
node scripts/md-to-pptx.mjs guides/MyGuide.md --no-cover

# 상세 로그 (섹션·아이템 목록, overflow 경고)
node scripts/md-to-pptx.mjs guides/MyGuide.md --verbose

# 일괄 변환
node scripts/md-to-pptx.mjs --all "guides/*.md"

# npm 단축 명령
npm run pptx:md -- guides/MyGuide.md
```

출력 기본 경로: `dist-pptx/<파일명>.pptx`  
접미사 변경: `pptdesign.config.json` → `output.suffix` (예: `"-v2"` → `MyGuide-v2.pptx`)

---

## 5. 설정값 제어 구조 (하드코딩 없음)

`md-to-pptx.mjs` 내에 하드코딩된 수치나 색상이 없습니다. 변경하고 싶은 항목에 따라 수정 파일이 다릅니다:

| 변경 항목 | 수정 파일 | 수정 키 |
|----------|-----------|---------|
| 브랜드 색상 추가/변경 | `templates/styles.json` | 새 스타일 오브젝트 추가 |
| 폰트 (한글/코드) | `pptdesign.config.json` | `slide.font`, `slide.fontMono` |
| 슬라이드 여백 | `pptdesign.config.json` | `slide.marginX`, `bodyTopY` |
| 카드 패딩·반경 | `pptdesign.config.json` | `card.padX`, `card.padY`, `card.radius` |
| 글자 크기 | `pptdesign.config.json` | `card.titleSize`, `card.bodySize` 등 |
| 그리드 열 폭 | `pptdesign.config.json` | `grid.*MinW` |
| 표지 레이아웃 | `pptdesign.config.json` | `cover.*` |
| 코드블록 색상 | `pptdesign.config.json` | `palette.codeBg`, `palette.codeText` |
| 마무리 슬라이드 | `pptdesign.config.json` | `done.*` |
| PPTX 출력 경로 | `pptdesign.config.json` | `output.dir`, `output.suffix` |

---

## 6. Frontmatter 필드

```yaml
---
title: 도구 이름 완전 활용 가이드    # 표지 큰 제목 (필수)
subtitle: 한 줄 요약 설명            # 표지 부제목
style: ai-chat                        # 색상 프리셋 키 (기본: ai-chat)
badge: NEW · 2026                    # 표지 배지 텍스트
logo: 🤖                              # 표지 로고 이모지
heroCta:
  label: 공식 사이트 열기
  url: https://example.com
stats:
  - value: "무료"
    label: "시작 가능"
  - value: "한국어"
    label: "지원"
done:
  title: 이제 시작해보세요
  subtitle: 핵심 기능을 하나씩 눌러보며 워크플로우를 완성해보세요.
  ctaLabel: 공식 사이트 방문
  ctaUrl: https://example.com
footer:
  - 이 가이드는 공식 문서를 기반으로 작성되었습니다.
---
```

---

## 7. 색상 프리셋 (templates/styles.json)

| 키 | 이름 | 브랜드 색 |
|----|------|-----------|
| `ai-chat` | AI 챗봇 (그린) | `#10A37F` |
| `ai-dev` | AI 개발 도구 (오렌지) | `#D97757` |
| `knowledge` | 노트·지식관리 (퍼플) | `#6366F1` |
| `productivity` | 생산성 유틸 (블루) | `#1565C0` |
| `creative` | 크리에이티브 AI (마젠타) | `#9B59B6` |
| `security` | 보안·인프라 (사이언) | `#06B6D4` |
| `finance` | 재테크·금융 (골드) | `#D4A017` |
| `future` | 퓨처 AI (네온 라임) | `#84CC16` |
| `enterprise` | 엔터프라이즈 (슬레이트) | `#475569` |
| `media` | 미디어·콘텐츠 (로즈) | `#E11D48` |

각 프리셋이 제공하는 색상 키: `brand`, `brandDark`, `brandDeep`, `brandLight`, `brandMid`, `border`, `bg`

새 프리셋 추가 예시:
```json
"my-style": {
  "label": "커스텀 (딥퍼플)",
  "brand": "#7C3AED",
  "brandDark": "#6D28D9",
  "brandDeep": "#4C1D95",
  "brandLight": "#EDE9FE",
  "brandMid": "#C4B5FD",
  "border": "#DDD6FE",
  "bg": "#F5F3FF"
}
```

---

## 8. Shortcode 갤러리

shortcode는 MD 파일 내 `::: 타입` 블록으로 작성합니다.  
같은 이름이 HTML 렌더러(`build-guide.mjs`)와 PPTX 렌더러(`md-to-pptx.mjs`) 양쪽에 연결됩니다.

### icon-grid — 아이콘 박스 배열

아이콘 + 제목 + 설명을 정방형 카드로 나열합니다. 항목 수에 따라 열 수가 자동 계산됩니다.

| 필드 | 설명 |
|------|------|
| `icon` | 이모지 또는 문자 |
| `title` | 카드 제목 |
| `desc` | 한두 줄 설명 |

```markdown
::: icon-grid
- icon: ⚡
  title: 빠른 처리
  desc: 반복 작업을 자동화합니다.
- icon: 🎨
  title: 쉬운 디자인
  desc: 템플릿으로 바로 시작할 수 있습니다.
:::
```

---

### feature-grid — 설명형 카드 배열

상단 액센트 바 + 태그 + 아이콘 + 제목 + 설명으로 구성된 카드입니다.

| 필드 | 설명 |
|------|------|
| `tag` | 상단 소형 태그 (선택) |
| `icon` | 이모지 (선택) |
| `title` | 카드 제목 |
| `desc` | 설명 |

```markdown
::: feature-grid
- tag: 핵심
  icon: 🧠
  title: AI 자동화
  desc: 초안, 편집, 요약을 자동 생성합니다.
- tag: 실전
  icon: 🧰
  title: 템플릿 활용
  desc: 자주 쓰는 형식을 저장해 반복 사용합니다.
:::
```

---

### steps — 번호 단계형 리스트

번호 박스 + 제목 + 설명의 순서 흐름을 세로로 나열합니다.

| 필드 | 설명 |
|------|------|
| `title` | 단계 제목 |
| `desc` | 단계 설명 |
| `num` | 번호 (선택, 생략 시 자동 부여) |

```markdown
::: steps
- title: 계정 만들기
  desc: 공식 사이트에서 이메일로 가입합니다.
- title: 새 프로젝트 만들기
  desc: 템플릿을 고르거나 빈 프로젝트에서 시작합니다.
:::
```

---

### compare-grid — 비교 카드 (note 칩 포함)

제목 + 설명 + 하단 note 칩으로 구성된 비교용 카드입니다.

| 필드 | 설명 |
|------|------|
| `title` | 카드 제목 |
| `desc` | 설명 |
| `note` | 하단 칩 텍스트 (선택) |

```markdown
::: compare-grid
- title: 초보자
  desc: 무료 플랜으로 시작합니다.
  note: 추천: 기본 워크플로우
- title: 팀 작업
  desc: 공유·권한 관리 플랜을 선택합니다.
  note: 추천: 팀 플랜
:::
```

---

### tool-card — 색상 헤더 도구 배너

브랜드 색상 배경의 수평 배너 카드입니다. `color`에 hex를 지정하면 적용됩니다.

| 필드 | 설명 |
|------|------|
| `icon` | 이모지 |
| `name` | 도구 이름 |
| `tagline` | 부제 (URL, 한 줄 설명) |
| `badge` | 우측 배지 텍스트 |
| `color` | 배경 hex 색상 |

```markdown
::: tool-card
- icon: 🎬
  name: Runway Gen-4
  tagline: runwayml.com · 영상 편집 특화 AI 플랫폼
  badge: 무료/Pro
  color: "#7C3AED"
:::
```

---

### workflow — 화살표 연결 수평 흐름

화살표(`→`)로 연결된 4~5단 순서도입니다.

| 필드 | 설명 |
|------|------|
| `icon` | 이모지 |
| `name` | 단계 이름 |
| `tool` | 사용 도구 (부제) |

```markdown
::: workflow
- icon: 💡
  name: 아이디어
  tool: Claude AI
- icon: ⚡
  name: 초안 생성
  tool: Gamma
- icon: 🎨
  name: 디자인
  tool: Canva
- icon: 📤
  name: 배포
  tool: 링크/PDF
:::
```

---

### plan-grid — 요금제·플랜 카드

Free/Pro/Enterprise 형태의 요금제 카드입니다. `featured: "true"`로 강조 스타일을 지정합니다.

| 필드 | 설명 |
|------|------|
| `title` | 플랜 이름 |
| `badge` | 상단 배지 |
| `featured` | `"true"` 로 설정하면 강조 |
| `features` | 기능 목록 (`\|` 구분) |
| `note` | 하단 가격/CTA |

```markdown
::: plan-grid
- title: Free
  badge: 무료
  features: 기본 기능 | 하루 10회 | 커뮤니티 지원
  note: 지금 바로 시작
- title: Pro
  badge: 추천
  featured: "true"
  features: 무제한 사용 | 우선 지원 | API 접근
  note: 월 $20
:::
```

---

### skill-list — 아이콘 가로 행 목록

아이콘 박스 + 제목 + 설명이 한 행으로 나열됩니다. 기능 목록, 연동 서비스 나열에 적합합니다.

| 필드 | 설명 |
|------|------|
| `icon` | 이모지 |
| `title` | 기능 이름 |
| `desc` | 짧은 설명 |

```markdown
::: skill-list
- icon: 📄
  title: 문서 자동화
  desc: 보고서·제안서를 한 번에 생성합니다
- icon: 🔗
  title: API 연동
  desc: REST API로 기존 시스템과 바로 연결됩니다
:::
```

---

### badge-grid — 조밀한 서비스 뱃지 그리드

많은 서비스·도구를 작은 카드로 빠르게 나열합니다.

| 필드 | 설명 |
|------|------|
| `icon` | 이모지 |
| `name` | 서비스 이름 |
| `type` | 카테고리 |

```markdown
::: badge-grid
- icon: 🗃️
  name: PostgreSQL
  type: 데이터베이스
- icon: 💬
  name: Slack
  type: 메시지
- icon: 📬
  name: SendGrid
  type: 이메일
:::
```

---

### columns — 2~5단 균등 배치

항목 수에 따라 2~5열로 균등하게 배치됩니다.

| 필드 | 설명 |
|------|------|
| `title` | 열 제목 |
| `desc` | 설명 |

```markdown
::: columns
- title: 개인 사용자
  desc: 직관적인 UI로 바로 시작할 수 있습니다.
- title: 팀·조직
  desc: 권한 관리와 공유 설정으로 협업합니다.
- title: 개발자
  desc: API로 기존 시스템에 통합합니다.
:::
```

---

### bottom-list — 본문 + 하단 칩 배치

상단에 제목·본문 설명을 넣고 하단에 핵심 요점을 칩(pill) 형태로 나열합니다.  
`points`는 `|`로 구분합니다.

| 필드 | 설명 |
|------|------|
| `title` | 제목 |
| `body` | 본문 설명 |
| `points` | 칩 텍스트 목록 (`\|` 구분) |

```markdown
::: bottom-list
- title: 이 도구를 선택해야 하는 이유
  body: 설정 없이도 강력한 기본값이 제공됩니다. 5분 안에 첫 결과를 만들 수 있습니다.
  points: 즉시 시작 | 무설정 기본값 | 5분 온보딩 | 무료 플랜 제공
:::
```

---

### compare-2col — 2단 비교

두 선택지를 나란히 비교합니다. 왼쪽은 강조 스타일, 오른쪽은 일반 스타일이 자동 적용됩니다.  
`items`는 `|`로 구분합니다.

| 필드 | 설명 |
|------|------|
| `col` | 열 제목 |
| `items` | 비교 항목 목록 (`\|` 구분) |
| `note` | 하단 결론 칩 |

```markdown
::: compare-2col
- col: 자체 호스팅
  items: 완전한 데이터 통제 | 비용 최적화 | 커스터마이징 자유
  note: 기술팀 보유 시 추천
- col: 클라우드 SaaS
  items: 즉시 사용 가능 | 자동 업데이트 | 전용 지원
  note: 빠른 시작에 추천
:::
```

---

### Shortcode 요약 표

| shortcode | 용도 | 주요 필드 |
|-----------|------|-----------|
| `icon-grid` | 아이콘 박스 배열 | icon, title, desc |
| `feature-grid` | 설명형 카드 배열 | tag, icon, title, desc |
| `steps` | 번호 단계형 리스트 | title, desc |
| `compare-grid` | 비교 카드 (note 칩) | title, desc, note |
| `tool-card` | 색상 헤더 도구 배너 | icon, name, tagline, badge, color |
| `workflow` | 화살표 수평 흐름 | icon, name, tool |
| `plan-grid` | 요금제·플랜 카드 | title, badge, featured, features, note |
| `skill-list` | 아이콘 가로 행 목록 | icon, title, desc |
| `badge-grid` | 조밀한 서비스 뱃지 그리드 | icon, name, type |
| `columns` | 2~5단 균등 배치 | title, desc |
| `bottom-list` | 본문 + 하단 칩 배치 | title, body, points(파이프 구분) |
| `compare-2col` | 2단 비교 + 하단 결론 | col, items(파이프 구분), note |

---

## 9. 새 가이드 작성 워크플로우

```
1. templates/template.md 를 복사해 guides/<새파일>.md 로 저장
2. frontmatter 수정: title, subtitle, style, stats, done
3. 섹션 추가: # 1. 섹션 제목 → ## 카드 제목 → ::: shortcode
4. 변환 실행: node scripts/md-to-pptx.mjs guides/<새파일>.md --verbose
5. dist-pptx/<새파일>.pptx 열어서 확인
```

**overflow 경고가 뜰 경우:**
- 섹션 내용을 `---`로 분리해 여러 슬라이드로 나누거나
- `pptdesign.config.json` → `slide.bodyBottomY`를 조금 늘리거나
- `card.bodySize`를 1pt 줄여 더 많은 내용이 들어가게 조정

---

## 10. 신규 Shortcode 추가 방법

`:::price-tag`를 예시로 단계별 설명합니다.

**Step 1. `pptdesign.config.json`에 레이아웃 수치 추가**

```jsonc
"priceTag": {
  "rowH": 0.65,
  "badgeW": 1.4
}
```

**Step 2. `scripts/md-to-pptx.mjs`에 렌더러 함수 추가**

```js
function renderPriceTag(slide, item, x, y, w, pal) {
  const cfg = D.priceTag;
  const font = D.slide.font;
  item.items.forEach((it, idx) => {
    const cy = y + idx * (cfg.rowH + D.card.gap);
    slide.addShape("roundRect", {
      x, y: cy, w, h: cfg.rowH, rectRadius: D.card.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    slide.addText(it.label || "", {
      x: x + 0.12, y: cy + 0.1, w: w - cfg.badgeW - 0.24, h: cfg.rowH - 0.2,
      fontSize: D.card.bodySize, color: pal.text, fontFace: font, valign: "middle",
    });
    slide.addText(it.price || "", {
      x: x + w - cfg.badgeW - 0.12, y: cy + 0.1, w: cfg.badgeW, h: cfg.rowH - 0.2,
      fontSize: D.card.titleSize, bold: true, color: pal.brand, fontFace: font, valign: "middle", align: "right",
    });
  });
  return item.items.length * (cfg.rowH + D.card.gap);
}
```

**Step 3. `renderItem()`에 case 추가**

```js
if (item.type === "price-tag") return renderPriceTag(slide, item, x, y, w, pal);
```

**Step 4. `itemH()`에 높이 추정 추가**

```js
if (item.type === "price-tag") return item.items.length * (D.priceTag.rowH + D.card.gap);
```

**Step 5. `templates/build-guide.mjs`에 HTML 렌더러 추가** (HTML 변환도 필요한 경우)

```js
if (type === "price-tag") {
  return `<div class="price-tag">${items.map(it =>
    `<div class="price-row"><span>${escapeHtml(it.label)}</span><strong>${escapeHtml(it.price)}</strong></div>`
  ).join("")}</div>`;
}
```

CSS도 함께 추가합니다.

**Step 6. `templates/template.md` shortcode 표에 항목 추가**

---

## 11. 출력 경로 규칙

기본 출력: `dist-pptx/<MD파일명>.pptx`

변경 방법:
- `--out <경로>`: 단일 파일에 직접 경로 지정
- `pptdesign.config.json` → `output.dir`: 기본 디렉토리 변경
- `pptdesign.config.json` → `output.suffix`: 파일명 접미사 추가 (예: `"-v2"`)

---

## 12. 트러블슈팅

**섹션 내용이 슬라이드를 벗어남 (Overflow)**
- `--verbose` 옵션으로 어느 섹션인지 확인
- 해결 1: 섹션을 `---`로 나눠 두 슬라이드에 분산
- 해결 2: `pptdesign.config.json` → `card.bodySize`를 `10`으로 줄임
- 해결 3: shortcode 항목 수를 줄임

**한글이 깨짐**
- PowerPoint에 `Malgun Gothic` 폰트가 없는 환경에서 발생
- `pptdesign.config.json` → `slide.font`를 설치된 한글 폰트로 변경

**`Cannot find module 'gray-matter'` 오류**
- `npm install` 실행 후 재시도

**`styles.json` 키를 찾을 수 없음**
- frontmatter의 `style:` 값이 `templates/styles.json`에 없는 경우
- 기본값 `ai-chat`으로 폴백됨 (오류 없이 변환됨)

---

## 부록: Python 스크립트 도입 검토

현재 파이프라인은 Node.js 기반(`pptxgenjs`)이며 MD → 신규 PPTX 생성에 최적화되어 있습니다.  
Python(`python-pptx`)은 기존 PPTX 파일을 열어 수정하는 데 강점이 있습니다.

| 시나리오 | python-pptx | pptxgenjs (현재) |
|---------|:-----------:|:----------------:|
| MD → 신규 PPTX 생성 | △ 장황 | ✅ 현재 방식 |
| 기존 PPTX 열어서 내용만 교체 | ✅ 가능 | ❌ 불가 |
| 특정 슬라이드만 선택·수정 | ✅ 가능 | ❌ 불가 |
| 회사 마스터 슬라이드 적용 | ✅ 가능 | ❌ 불가 |
| 표 셀 개별 접근 | ✅ 정밀 | △ 제한적 |
| 배치 처리 (다수 MD → 다수 PPTX) | ✅ 가능 | ✅ 가능 |
| 애니메이션·전환 효과 | ❌ 미지원 | ❌ 미지원 |

### 권장 구조 (현재 + Python 보완)

```
guides/*.md
    │
    ▼
scripts/md-to-pptx.mjs  →  dist-pptx/*.pptx   [현재 유지]
                                  │
                                  ▼ (선택적 후처리)
                          scripts/post-process.py
                          (python-pptx 기반)
                          · 회사 마스터 슬라이드와 병합
                          · 특정 슬라이드 교체
                          · 브랜드 템플릿 주입
                                  │
                                  ▼
                          dist-pptx/*-final.pptx
```

**Python 스크립트를 도입할 시점:**
- 회사 `.pptx` 마스터 템플릿 파일에 생성된 슬라이드를 주입해야 할 때
- 특정 슬라이드의 도형을 세밀하게 조정해야 할 때
- 이미 존재하는 PPTX의 특정 페이지만 자동으로 업데이트해야 할 때

**샘플 후처리 스크립트 골격:**

```python
from pptx import Presentation
import sys

src = sys.argv[1]    # md-to-pptx 출력 파일
tmpl = sys.argv[2]   # 회사 마스터 템플릿
out = sys.argv[3]    # 최종 출력

prs_src  = Presentation(src)
prs_tmpl = Presentation(tmpl)

# 마스터 슬라이드 레이아웃을 소스 PPTX에 적용하거나
# 특정 슬라이드를 복사하는 로직을 여기에 작성

prs_src.save(out)
```

필요 패키지: `pip install python-pptx`
