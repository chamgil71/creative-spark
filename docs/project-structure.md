# Creative Spark — 프로젝트 구조 상세 문서

> 최초 작성: 2026-05-06 / 최종 업데이트: 2026-05-06  
> 기준 브랜치: main

---

## 1. 프로젝트 전체 트리 구조

```
C:\ai\creative-spark\
│
├── index.html                 ← 진입점 HTML (SPA 껍데기)
├── vite.config.ts             ← Vite 빌드 설정
├── package.json               ← 의존성 (pptxgenjs, html2canvas, jspdf 포함)
│
├── data/                      ← 원본 가이드 HTML (수동 작성·관리)
│   ├── Chatgpt.html
│   ├── Claude.html
│   ├── ClaudeCode.html
│   ├── Gemini.html
│   └── ... (19개)
│
├── public/                    ← 빌드 시 dist/로 그대로 복사되는 정적 파일
│   ├── guides/                ← 서비스용 가이드 HTML (data/에서 가져와 관리)
│   │   ├── Chatgpt.html
│   │   ├── Claude.html
│   │   └── ... (23개)
│   ├── vibecoding/            ← 별도 연재 가이드 시리즈
│   │   ├── part01-concepts.html
│   │   └── ... (9개)
│   ├── standalone.html        ← 독립 실행형 버전 (React 없이 동작)
│   ├── placeholder.svg
│   ├── favicon.ico
│   └── robots.txt
│
├── src/                       ← React 앱 소스
│   ├── main.tsx               ← React 앱 마운트 진입점
│   ├── App.tsx                ← 라우터 설정
│   ├── index.css              ← 전역 CSS + Tailwind 변수 정의
│   ├── App.css
│   ├── vite-env.d.ts
│   │
│   ├── pages/                 ← 페이지 컴포넌트
│   │   ├── Index.tsx          ← "/" 루트: 가이드 목록 허브
│   │   ├── GuideViewer.tsx    ← "/guide/:slug": 가이드 뷰어 (PPT/PDF 버튼 포함)
│   │   └── NotFound.tsx       ← "*": 404 페이지
│   │
│   ├── data/
│   │   └── guides.ts          ← 가이드 메타데이터 정의 (slug, title, file명 매핑)
│   │
│   ├── lib/
│   │   ├── exportGuide.ts     ← PPT·PDF 내보내기 핵심 로직
│   │   └── utils.ts           ← cn() 유틸 (clsx + tailwind-merge)
│   │
│   ├── hooks/
│   │   ├── use-toast.ts       ← 토스트 상태 관리
│   │   └── use-mobile.tsx     ← 모바일 감지 훅
│   │
│   ├── components/
│   │   ├── NavLink.tsx        ← React Router NavLink 래퍼
│   │   └── ui/                ← shadcn/ui 컴포넌트 라이브러리 (40+ 파일)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       └── ... (40개 이상)
│   │
│   └── test/
│       ├── example.test.ts
│       └── setup.ts
│
├── templates/                 ← 가이드 제작 보조 도구 (콘텐츠 제작용)
│   ├── build-guide.mjs        ← Markdown → HTML 변환기
│   ├── html-to-md.mjs         ← HTML → Markdown 역변환기
│   ├── styles.json            ← 5가지 카테고리 색상 프리셋 (scripts/와 공유)
│   ├── template.md            ← 새 가이드 작성 템플릿
│   ├── guide-build.md         ← 빌드 가이드 문서
│   ├── Github.md              ← Github 가이드 원고 (MD 형태)
│   └── README.md
│
├── scripts/                   ← 변환 유틸 스크립트 (PPT 내보내기용)
│   ├── html-to-pptx.mjs       ← HTML → PPTX 변환 CLI 스크립트
│   ├── pptx.config.json       ← 전체 파라미터 설정 (한글 주석 포함)
│   └── README.md
│
├── docs/                      ← 프로젝트 문서
│   ├── project-structure.md   ← 이 파일 (구조 전체 설명)
│   └── html-to-pptx-plan.md  ← HTML 구조 분석 및 PPT 변환 구현 계획
│
├── dist-pptx/                 ← html-to-pptx.mjs 출력 폴더 (자동 생성)
│   ├── Claude.pptx
│   └── ... (변환된 PPT 파일들)
│
└── dist/                      ← npm run build 결과물 (배포 폴더)
    ├── index.html             ← 빌드된 HTML (스크립트 해시 포함)
    ├── favicon.ico
    ├── guides/                ← public/guides/ 그대로 복사
    ├── placeholder.svg
    └── assets/
        ├── index-[hash].js    ← 번들된 React 앱 전체
        ├── index-[hash].css   ← 번들된 Tailwind CSS
        ├── html2canvas-[hash].js
        ├── pptxgenjs-[hash].js
        └── ...
```

---

## 2. data → public → dist 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1단계: 콘텐츠 제작 (수동 or 스크립트)                               │
│                                                                     │
│  방법A) 직접 HTML 작성                                              │
│  data/Claude.html ──────────────────┐                              │
│                                     │ 수동 복사                    │
│  방법B) Markdown → HTML 변환        ▼                              │
│  templates/Github.md               public/guides/Claude.html       │
│       │                                                             │
│       │ node templates/build-guide.mjs Github.md                  │
│       ▼                                                             │
│  public/guides/Github.html ─────────┘                              │
│                                                                     │
│  방법C) 기존 HTML에서 역추출                                        │
│  public/guides/*.html                                               │
│       │                                                             │
│       │ node templates/html-to-md.mjs                              │
│       ▼                                                             │
│  templates/*.md (편집 후 방법B로 재빌드)                            │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2단계: 프로덕션 빌드                                                 │
│                                                                     │
│  npm run build  →  vite build                                       │
│                                                                     │
│  src/ (React 소스)                                                  │
│    └─── TypeScript 컴파일                                           │
│    └─── Tailwind CSS 생성                                           │
│    └─── 트리쉐이킹 + 번들링                                         │
│    └──→ dist/assets/index-[hash].js                                 │
│    └──→ dist/assets/index-[hash].css                                │
│    └──→ dist/index.html                                             │
│                                                                     │
│  public/ (정적 파일)                                                │
│    └─── 변환 없이 그대로 복사                                        │
│    └──→ dist/guides/*.html                                          │
│    └──→ dist/favicon.ico 등                                         │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    dist/ (배포 준비 완료)
```

> **핵심**: `data/` 폴더는 원본 보관용이고, **실제 서비스 파일은 `public/guides/`** 에 있습니다.
> Vite 빌드가 `public/` 전체를 `dist/`로 복사합니다.

---

## 3. index.html → 화면 표시 흐름

```
브라우저 접속
     │
     ▼
index.html (또는 dist/index.html)
  ├── <div id="root"></div>          ← React 마운트 포인트
  └── <script src="/src/main.tsx">   ← React 진입점 로드
              │
              ▼
         main.tsx
         createRoot(#root).render(<App />)
              │
              ▼
          App.tsx
    ┌─────────────────────────────────────┐
    │  QueryClientProvider               │  ← React Query 전역 설정
    │  TooltipProvider                   │  ← Radix UI Tooltip
    │  <Toaster /> <Sonner />            │  ← 알림 토스트
    │  BrowserRouter                     │  ← React Router
    │    <Routes>                        │
    │      path="/"         → Index      │
    │      path="/guide/:slug" → GuideViewer │
    │      path="*"         → NotFound   │
    └─────────────────────────────────────┘

URL 패턴에 따른 화면:

  "/"  ───────────────→ Index.tsx
                          ├── guides.ts에서 categories 데이터 로드
                          ├── 헤더 (카테고리 네비게이션)
                          ├── 히어로 섹션 (검색창)
                          └── 카테고리별 가이드 카드 그리드
                               └── 카드 클릭 → /guide/{slug}로 이동

  "/guide/claude" ───→ GuideViewer.tsx
                          ├── slug="claude" → guides.ts에서 메타 조회
                          │    → { file: "Claude.html" }
                          ├── 헤더 (PPT/PDF 버튼, 홈 버튼)
                          ├── 좌측 사이드바 (전체 가이드 목록)
                          ├── <iframe src="/guides/Claude.html">  ← 핵심!
                          └── 하단 이전/다음 네비게이션
```

---

## 4. src/components 각 파일 역할

### NavLink.tsx

```
React Router의 NavLink를 래핑한 커스텀 컴포넌트
  - activeClassName / pendingClassName prop 지원 (기존 방식 호환)
  - cn() 유틸로 isActive, isPending 상태에 따라 클래스 자동 합성
  - 현재 Index.tsx와 GuideViewer.tsx에서는 직접 사용하지 않음
    (두 페이지 모두 Link 컴포넌트를 직접 사용 중)
```

### ui/ 폴더 — shadcn/ui 컴포넌트 (40개)

Radix UI 프리미티브 위에 Tailwind CSS 스타일을 입힌 컴포넌트들.
외부 패키지가 아닌 **소스 파일이 직접 포함**되어 자유롭게 수정 가능.

```
접근성 기반 인터랙션 컴포넌트:
  accordion.tsx      ← 접기/펼치기 아코디언
  alert-dialog.tsx   ← 확인 다이얼로그 (삭제 확인 등)
  dialog.tsx         ← 일반 모달 다이얼로그
  drawer.tsx         ← 모바일 하단 슬라이드 패널
  popover.tsx        ← 팝오버 레이어
  tooltip.tsx        ← 마우스오버 툴팁
  hover-card.tsx     ← 호버 시 카드 표시
  context-menu.tsx   ← 우클릭 컨텍스트 메뉴
  dropdown-menu.tsx  ← 드롭다운 메뉴
  menubar.tsx        ← 상단 메뉴바
  navigation-menu.tsx← 네비게이션 메뉴
  command.tsx        ← 커맨드 팔레트 (⌘K 검색)
  sheet.tsx          ← 사이드 슬라이드 패널
  alert.tsx          ← 인라인 알림 박스
  collapsible.tsx    ← 단순 접기/펼치기

폼·입력 컴포넌트:
  button.tsx         ← 버튼 (variant: default/outline/ghost 등)
  input.tsx          ← 텍스트 입력창
  textarea.tsx       ← 여러 줄 입력창
  select.tsx         ← 드롭다운 선택
  checkbox.tsx       ← 체크박스
  radio-group.tsx    ← 라디오 버튼 그룹
  switch.tsx         ← 토글 스위치
  slider.tsx         ← 슬라이더
  form.tsx           ← react-hook-form 연동 폼 래퍼
  label.tsx          ← 폼 레이블
  input-otp.tsx      ← OTP 코드 입력

레이아웃·표시 컴포넌트:
  card.tsx           ← 카드 컨테이너 (Card, CardHeader, CardContent 등)
  badge.tsx          ← 뱃지/태그
  separator.tsx      ← 구분선 (hr)
  avatar.tsx         ← 사용자 아바타
  aspect-ratio.tsx   ← 비율 고정 컨테이너
  skeleton.tsx       ← 로딩 스켈레톤 UI
  progress.tsx       ← 진행률 바
  scroll-area.tsx    ← 커스텀 스크롤바 영역
  resizable.tsx      ← 크기 조절 패널
  table.tsx          ← 테이블 (Table, Thead, Tbody 등)
  tabs.tsx           ← 탭 패널
  carousel.tsx       ← 이미지/카드 캐러셀
  chart.tsx          ← Recharts 래퍼 차트

토스트·알림:
  toast.tsx          ← 토스트 알림 기반 컴포넌트
  toaster.tsx        ← Toaster (Radix Toast 기반)
  sonner.tsx         ← Sonner 토스트 래퍼
  use-toast.ts       ← 토스트 상태 훅

기타:
  breadcrumb.tsx     ← 브레드크럼 네비게이션
  pagination.tsx     ← 페이지네이션
  toggle.tsx         ← 토글 버튼
  toggle-group.tsx   ← 토글 버튼 그룹
  calendar.tsx       ← 날짜 캘린더
  sidebar.tsx        ← 사이드바 레이아웃 컴포넌트
```

### 현재 실제 사용 중인 컴포넌트 (핵심 의존 관계)

```
Index.tsx
  └── @/components/ui/input.tsx    ← 검색창
  └── @/components/ui/button.tsx   ← "탐색 시작" 버튼
  └── @/data/guides.ts             ← 카테고리/가이드 데이터

GuideViewer.tsx
  └── @/components/ui/button.tsx   ← PPT/PDF/홈 버튼
  └── @/data/guides.ts             ← slug → 파일명 조회
  └── @/lib/exportGuide.ts         ← 내보내기 로직
  └── @/hooks/use-toast.ts         ← 성공/실패 알림
```

---

## 5. templates/ 도구 사용법

```
새 가이드 추가 워크플로우:

1. templates/template.md 참고해 새 .md 파일 작성
       (frontmatter: title, style, badge, stats 등)

2. node templates/build-guide.mjs 내가쓴.md public/guides/새가이드.html
       → public/guides/ 에 HTML 파일 생성

3. src/data/guides.ts 에 슬러그·타이틀·파일명 등록
       → 앱에서 카드와 뷰어에 자동 반영

4. npm run build
       → dist/guides/새가이드.html 로 배포 준비 완료

역방향 (기존 HTML 수정 시):
  node templates/html-to-md.mjs public/guides/Claude.html templates/Claude-edit.md
  → 마크다운으로 편집 후 build-guide.mjs로 재빌드
```

---

## 6. scripts/ — HTML → PPT 변환 도구

`templates/`가 **콘텐츠 제작 도구**(MD→HTML)라면, `scripts/`는 **내보내기 도구**(HTML→PPTX)입니다.

### 파일별 역할

| 파일 | 역할 |
|------|------|
| `html-to-pptx.mjs` | HTML 가이드를 파싱해 편집 가능한 .pptx로 변환하는 CLI 스크립트 |
| `pptx.config.json` | 섹션 셀렉터·색상·카드 클래스·그리드 등 모든 파라미터 (한글 주석 포함) |
| `README.md` | 사용법 및 옵션 설명 |

### CLI 사용법

```bash
# 단일 파일 변환 (dist-pptx/Claude.pptx 생성)
node scripts/html-to-pptx.mjs public/guides/Claude.html

# 상세 로그 — 섹션/블록 파싱 과정 출력
node scripts/html-to-pptx.mjs public/guides/Claude.html --verbose

# styles.json 색상 프리셋 적용 (HTML CSS 무시)
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

### HTML 구조 패턴 자동 감지

가이드 HTML은 두 가지 패턴이 혼재하며, 스크립트가 자동으로 두 패턴을 모두 처리합니다:

| | Type A | Type B |
|---|---|---|
| 대표 파일 | notion.html, obsidian.html | claude.html, chatgpt.html |
| 섹션 태그 | `<section class="section">` | `<div class="section">` |
| 내부 래퍼 | `.section-inner` 있음 | 없음 |
| 제목 요소 | `h2.section-title` | `.section-header h2` |

### pptx.config.json 주요 설정 항목

| 항목 | 기본값 | 설명 |
|------|--------|------|
| `sectionSelectors` | `["section.section", "div.section", ...]` | 슬라이드 구분 기준 셀렉터 |
| `colorSource` | `"html"` | 색상 소스: `"html"` (CSS 변수 자동 추출) / `"styles-json"` |
| `cardClasses` | 19개 클래스 목록 | 카드 블록으로 인식할 CSS 클래스 |
| `gridClasses` | 13개 클래스 목록 | 그리드(가로 배치)로 인식할 CSS 클래스 |
| `grid.overflowBehavior` | `"warn"` | 슬라이드 폭 초과 시 처리: `"allow"` / `"warn"` |
| `grid.cardMaxCols` | `4` | 그리드 최대 열 수 |
| `output.dir` | `"dist-pptx"` | 출력 폴더 경로 |

### styles.json 프리셋 키

`--style <key>` 옵션으로 `templates/styles.json`의 색상 프리셋을 적용합니다:

| 키 | 브랜드 색상 | 적합한 파일 |
|---|---|---|
| `ai-chat` | #10A37F (초록) | Chatgpt, Grok 등 |
| `ai-dev` | #D97757 (오렌지) | Claude, Vscode 등 |
| `knowledge` | #6366F1 (퍼플) | Notion, Obsidian 등 |
| `productivity` | #1565C0 (블루) | Everything, Snipaste 등 |
| `creative` | #9B59B6 (마젠타) | 이미지·영상 AI 등 |

### 변환 흐름

```
public/guides/*.html
        │
        │ node scripts/html-to-pptx.mjs
        ▼
  1. HTML 파싱 (cheerio)
  2. CSS :root 변수 추출 → 색상 팔레트 결정
  3. sectionSelectors로 섹션 분할
  4. 각 섹션 내부 walkEl() 재귀 파싱
       ├── gridClasses → grid 블록 (가로 배치)
       ├── cardClasses → card 블록
       ├── h3/h4/p/ul/ol/table/pre/blockquote → 각 블록 타입
       └── 컨테이너 div → 재귀 순회
  5. pptxgenjs로 슬라이드 생성
       ├── 표지 슬라이드 (hero 정보)
       ├── 섹션별 슬라이드 (제목 헤더 + 블록 렌더링)
       └── 페이지 번호
  6. dist-pptx/*.pptx 저장
```

### 의존성

신규 설치 없이 기존 `package.json` 의존성만 사용:
- `cheerio` (devDependencies) — HTML 파싱
- `pptxgenjs` (dependencies) — PPT 생성

---

## 6. PPT (이미지) 내보내기

**버튼 위치**: `GuideViewer.tsx` 헤더 → `[PPT (이미지)]` 버튼  
**담당 함수**: `src/lib/exportGuide.ts` → `exportIframeToPptx()`  
**사용 라이브러리**: `html2canvas`, `pptxgenjs`

### 동작 원리

```
[PPT (이미지)] 버튼 클릭
       │
       ▼
GuideViewer.tsx :: handleExport("pptx")
       │
       ▼
exportGuide.ts :: exportIframeToPptx(iframe, title, fileName)
       │
       ├── 1. iframe.contentDocument 접근 (현재 열린 가이드 HTML DOM)
       │
       ├── 2. body 폭을 1280px로 강제 설정 (캡처 품질 고정)
       │       body.style.width = "1280px"
       │       body.style.maxWidth = "1280px"
       │
       ├── 3. 섹션 요소 수집
       │       querySelectorAll("section.hero, section.section, section.done-section")
       │       없으면 body 전체를 단일 섹션으로 처리
       │
       ├── 4. pptxgenjs 프레젠테이션 생성
       │       pres.layout = "LAYOUT_WIDE"  (16:9 비율)
       │
       ├── 5. 표지 슬라이드 생성 (텍스트 기반)
       │       배경: 진한 네이비(#0F172A)
       │       좌측 인디고 세로 바 + 가이드 제목 + "AI 가이드 허브" 부제
       │
       ├── 6. 각 섹션마다 반복:
       │       html2canvas(section, { scale: 1.5, windowWidth: 1280 })
       │         → Canvas 이미지로 캡처
       │       fitToSlide(canvas)
       │         → 16:9(1280×720px) 슬라이드에 맞게 리사이즈
       │         → 세로가 짧으면 상단 정렬 + 아래 흰 여백
       │         → 세로가 길면 추가 축소 + 가운데 정렬
       │         → JPEG(품질 0.9)로 dataURL 반환
       │       slide.addImage(dataUrl) → 슬라이드에 이미지로 삽입
       │       슬라이드 우하단에 "n / total" 페이지 번호 표시
       │
       ├── 7. body 폭 원복 (캡처 후 1280px 강제 해제)
       │
       └── 8. pres.writeFile({ fileName })
               → .pptx 파일 다운로드
```

### 특징 및 한계

| 항목 | 내용 |
|------|------|
| 출력 형식 | 각 섹션 → 이미지 1장씩 |
| 편집 가능 여부 | 불가 (이미지로 삽입됨) |
| 디자인 보존 | 매우 우수 (HTML 그대로 캡처) |
| 폰트·색상 | 원본 HTML과 100% 동일 |
| 텍스트 검색 | 불가 |
| 파일명 패턴 | `{가이드제목}-가이드.pptx` |

---

## 7. PPT (편집) 내보내기

**버튼 위치**: `GuideViewer.tsx` 헤더 → `[PPT (편집)]` 버튼  
**담당 함수**: `src/lib/exportGuide.ts` → `exportIframeToEditablePptx()`  
**사용 라이브러리**: `pptxgenjs`

### 동작 원리

```
[PPT (편집)] 버튼 클릭
       │
       ▼
GuideViewer.tsx :: handleExport("pptx-edit")
       │
       ▼
exportGuide.ts :: exportIframeToEditablePptx(iframe, title, fileName)
       │
       ├── 1. iframe.contentDocument 접근
       │
       ├── 2. 섹션 요소 수집
       │       querySelectorAll("section.hero, section.section, section.done-section")
       │       없으면 body 전체를 단일 섹션으로 처리
       │
       ├── 3. 표지 슬라이드 생성 (텍스트 기반)
       │       배경: #0F172A / 인디고 바 / 제목 / "편집 가능한 PPT" 부제
       │
       ├── 4. 각 섹션마다 parseSection() 호출
       │       → HTML DOM을 순회하며 Block 배열로 파싱
       │
       │   파싱 규칙 (HTML 요소 → Block 타입):
       │   ┌────────────────────────────────────────────────────┐
       │   │ .card, .feature-card, .tool-card 등 → "card"      │
       │   │ h3, h4                             → "h3"         │
       │   │ p                                  → "p"          │
       │   │ ul                                 → "list" (불릿) │
       │   │ ol                                 → "list" (번호) │
       │   │ table                              → "table"      │
       │   │ pre                                → "code"       │
       │   │ blockquote                         → "quote"      │
       │   │ .grid, .flex, .cards 등            → 자식 재귀 순회│
       │   └────────────────────────────────────────────────────┘
       │
       ├── 5. 슬라이드 레이아웃 계산
       │       각 Block의 blockHeight() 추정치 계산
       │       (텍스트 길이, 줄 수, 행 수 기반 인치 단위)
       │       Body 영역 (y: 1.3" ~ 7.0") 초과 시 → 새 슬라이드 자동 분할
       │       분할된 슬라이드: 제목에 "(2)", "(3)" 접미사 추가
       │
       ├── 6. drawSlideHeader() — 각 슬라이드 공통 헤더
       │       좌측 인디고 세로 바 (0.12" 폭)
       │       섹션 제목 텍스트 (Malgun Gothic 28pt Bold)
       │
       ├── 7. drawBlock() — Block 타입별 pptxgenjs 렌더링
       │
       │   "h3"    → addText(28pt Bold, 네이비)
       │   "p"     → addText(13pt, 슬레이트)
       │   "list"  → addText(bullet: true/number, 13pt)
       │   "card"  → addShape(roundRect 카드 배경) + addText(제목+본문)
       │   "table" → addTable(헤더행: 인디고 배경, 흰 텍스트)
       │   "code"  → addShape(roundRect 다크 배경) + addText(Consolas 11pt)
       │   "quote" → addShape(인디고 좌측 바) + addText(이탤릭)
       │
       ├── 8. drawPageNumber() — 슬라이드 우하단 "n / total" 표시
       │       (표지 제외, 본문 슬라이드에만)
       │
       └── 9. pres.writeFile({ fileName })
               → .pptx 파일 다운로드
```

### 색상 팔레트 (E 상수)

```
bgDark    #0F172A  ← 표지 배경
accent    #6366F1  ← 인디고 포인트 색 (바, 테이블 헤더)
title     #0F172A  ← 제목 텍스트
body      #334155  ← 본문 텍스트
muted     #64748B  ← 페이지 번호 등 보조 텍스트
cardBg    #F8FAFC  ← 카드 배경
cardBorder#E2E8F0  ← 카드 테두리
codeBg    #0F172A  ← 코드 블록 배경
codeText  #E2E8F0  ← 코드 텍스트
white     #FFFFFF  ← 슬라이드 배경
```

### 특징 및 한계

| 항목 | 내용 |
|------|------|
| 출력 형식 | HTML 구조를 pptx 네이티브 객체로 재조립 |
| 편집 가능 여부 | 가능 (텍스트, 표, 도형 모두 수정 가능) |
| 디자인 보존 | 보통 (HTML 완전 재현은 불가, 근사치 렌더링) |
| 폰트 | Malgun Gothic (한글), Consolas (코드) |
| 텍스트 검색 | 가능 |
| 자동 페이지 분할 | 지원 (블록 높이 추정 기반) |
| 파일명 패턴 | `{가이드제목}-가이드(편집).pptx` |

---

## 8. PDF 저장

**버튼 위치**: `GuideViewer.tsx` 헤더 → `[PDF]` 버튼  
**담당 함수**: `src/lib/exportGuide.ts` → `printGuideIframe()`  
**사용 API**: 브라우저 내장 `window.print()`

### 동작 원리

```
[PDF] 버튼 클릭
       │
       ▼
GuideViewer.tsx :: handleExport("pdf")
       │
       ▼
exportGuide.ts :: printGuideIframe(iframe, docTitle)
       │
       ├── 1. iframe.contentDocument / contentWindow 접근
       │
       ├── 2. 인쇄용 CSS 스타일 주입 (id: "__guide-print-style__")
       │       중복 방지: 이미 있으면 재주입 않음
       │
       │   주입되는 @media print 규칙:
       │   ┌────────────────────────────────────────────────────┐
       │   │ @page { size: A4; margin: 12mm; }                  │
       │   │ html, body {                                       │
       │   │   background: #fff;                                │
       │   │   -webkit-print-color-adjust: exact;               │
       │   │   print-color-adjust: exact;        ← 배경색 보존  │
       │   │ }                                                  │
       │   │ .section, .card, .model-card,                      │
       │   │ .feature-card, .tool-card, .tip-card,              │
       │   │ .step, table, pre, blockquote, figure {            │
       │   │   break-inside: avoid;              ← 요소 잘림 방지│
       │   │   page-break-inside: avoid;                        │
       │   │ }                                                  │
       │   │ h1, h2, h3 {                                       │
       │   │   break-after: avoid;               ← 제목 후 줄바꿈│
       │   │ }                                                  │
       │   └────────────────────────────────────────────────────┘
       │
       ├── 3. 문서 제목을 "{가이드제목} 가이드"로 임시 변경
       │       (PDF 파일명으로 사용됨)
       │
       ├── 4. iframe.contentWindow.focus()
       │       iframe.contentWindow.print()
       │         → 브라우저 인쇄 다이얼로그 오픈
       │
       ├── 5. 사용자가 대상을 "PDF로 저장" 선택 → PDF 파일 저장
       │
       └── 6. 1초 후 문서 제목 원복 (setTimeout)
```

### 인쇄 다이얼로그에서 PDF 저장하는 법

```
Chrome / Edge:
  대상 → "PDF로 저장" 선택
  → 저장 위치 지정 후 저장

Firefox:
  프린터 → "Microsoft PDF로 인쇄" 또는 "파일로 인쇄" 선택

macOS Safari:
  좌하단 PDF 버튼 → "PDF로 저장"
```

### 특징 및 한계

| 항목 | 내용 |
|------|------|
| 방식 | 브라우저 인쇄 API (jsPDF 미사용) |
| 디자인 보존 | 매우 우수 (CSS 색상, 배경, 폰트 완전 보존) |
| 텍스트 검색 | 가능 (텍스트 레이어 있음) |
| 페이지 크기 | A4, 여백 12mm |
| 페이지 분할 | 브라우저 자동 처리 (요소 잘림 최소화) |
| 직접 다운로드 | 불가 — 사용자가 인쇄 다이얼로그에서 선택 필요 |
| 파일명 | 브라우저가 문서 title로 자동 설정 |

---

## 9. 세 가지 내보내기 방식 비교표

| 항목 | PPT (이미지) | PPT (편집) | PDF |
|------|-------------|-----------|-----|
| 담당 함수 | `exportIframeToPptx` | `exportIframeToEditablePptx` | `printGuideIframe` |
| 핵심 라이브러리 | html2canvas + pptxgenjs | pptxgenjs | window.print() |
| 텍스트 편집 | 불가 | 가능 | 불가 |
| 디자인 충실도 | 최상 (픽셀 캡처) | 보통 (근사 렌더링) | 최상 (CSS 그대로) |
| 텍스트 검색 | 불가 | 가능 | 가능 |
| 파일 크기 | 큼 (JPEG 이미지) | 작음 | 보통 |
| 용도 | 발표용 슬라이드 | 수정·재활용 | 문서 배포·보관 |
| 자동 다운로드 | 즉시 다운로드 | 즉시 다운로드 | 인쇄 다이얼로그 경유 |
