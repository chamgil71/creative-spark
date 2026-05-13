# Creative Spark — 프로젝트 구조 상세 문서

> 최초 작성: 2026-05-06 / 최종 업데이트: 2026-05-08  
> 기준 브랜치: main

---

## 1. 프로젝트 전체 트리 구조

```
C:\ai\creative-spark\
│
├── index.html                 ← 진입점 HTML (SPA 껍데기)
├── vite.config.ts             ← Vite 빌드 설정
├── package.json               ← 의존성 (pptxgenjs, html2canvas 포함)
│
├── mddata/                    ← 가이드 콘텐츠 원본 (Markdown)
│   ├── Supabase.md
│   └── ... (신규 가이드 MD 파일)
│
├── public/                    ← 빌드 시 dist/로 그대로 복사되는 정적 파일
│   ├── guides/                ← 서비스용 가이드 HTML (생성 산출물 + 기존 수동 파일 혼재)
│   │   ├── CapCut.html        ← build-guide.mjs 생성 (styles.json 기반)
│   │   ├── Supabase.html      ← build-guide.mjs 생성
│   │   ├── Chatgpt.html       ← 수동 작성 (마이그레이션 대상)
│   │   └── ... (30개+)
│   ├── vibecoding/            ← 별도 연재 가이드 시리즈
│   │   └── ... (9개)
│   ├── standalone.html        ← 독립 실행형 버전 (React 없이 동작)
│   ├── favicon.ico
│   └── robots.txt
│
├── src/                       ← React 앱 소스
│   ├── main.tsx               ← React 앱 마운트 진입점
│   ├── App.tsx                ← 라우터 설정
│   ├── index.css              ← 전역 CSS + Tailwind 변수 정의
│   │
│   ├── pages/
│   │   ├── Index.tsx          ← "/" 루트: 가이드 목록 허브
│   │   ├── GuideViewer.tsx    ← "/guide/:slug": 가이드 뷰어 (내보내기 버튼 포함)
│   │   └── NotFound.tsx       ← 404 페이지
│   │
│   ├── data/
│   │   ├── guides.ts          ← 가이드 메타데이터 타입 및 카테고리 정의
│   │   └── guides.json        ← 가이드 데이터 (slug, title, file, 카테고리)
│   │
│   ├── lib/
│   │   ├── exportGuide.ts     ← PPT(이미지/편집)·PDF 내보내기 핵심 로직
│   │   └── utils.ts           ← cn() 유틸
│   │
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   │
│   └── components/
│       ├── NavLink.tsx
│       └── ui/                ← shadcn/ui 컴포넌트 (40+ 파일)
│
├── templates/                 ← 가이드 제작 도구 (MD ↔ HTML 변환)
│   ├── build-guide.mjs        ← MD → HTML 변환기 (shortcode 포함)
│   ├── html-to-md.mjs         ← HTML → MD 역변환기 (shortcode 복원)
│   ├── styles.json            ← 5가지 카테고리 색상 프리셋
│   ├── template.md            ← 새 가이드 작성 템플릿
│   ├── CapCut.md              ← 예시 가이드 원고
│   ├── Supabase.md            ← 역변환 예시
│   └── README.md
│
├── scripts/                   ← 변환 유틸 스크립트
│   ├── build-standalone.mjs   ← standalone.html 빌드 (Shadow DOM 격리)
│   ├── html-to-pptx.mjs       ← HTML → PPTX 변환 CLI
│   ├── pptx.config.json       ← PPTX 변환 파라미터 설정
│   └── STANDALONE.md          ← standalone 빌드 사용법
│
├── docs/                      ← 프로젝트 문서
│   ├── project-structure.md   ← 이 파일
│   └── plan.md                ← 개발 현황 및 로드맵 (구현 완료 + 미완료 항목)
│
└── dist/                      ← npm run build 결과물 (배포 폴더)
    ├── index.html
    ├── guides/
    └── assets/
```

---

## 2. 콘텐츠 제작 → 서비스 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│ 1단계: 콘텐츠 제작 (권장: MD 기반)                               │
│                                                                 │
│  방법A) Markdown 작성 (신규 표준)                               │
│  mddata/MyGuide.md                                              │
│       │                                                         │
│       │ node templates/build-guide.mjs                         │
│       ▼                                                         │
│  public/guides/MyGuide.html ← styles.json 색상 자동 적용        │
│                                                                 │
│  방법B) 기존 HTML에서 역추출 후 재편집                           │
│  public/guides/OldGuide.html                                    │
│       │                                                         │
│       │ node templates/html-to-md.mjs                          │
│       ▼                                                         │
│  templates/OldGuide.md  →  검수  →  build-guide.mjs 재빌드      │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2단계: 프로덕션 빌드                                             │
│                                                                 │
│  npm run build  →  vite build                                   │
│  public/ → dist/ 그대로 복사                                    │
│  src/ → TypeScript 컴파일 + Tailwind + 번들 → dist/assets/      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 화면 라우팅 흐름

```
"/"  ───────────────→ Index.tsx
                        ├── guides.json에서 categories 로드
                        ├── 히어로 (검색창)
                        └── 카테고리별 가이드 카드 그리드
                             └── 카드 클릭 → /guide/{slug}로 이동

"/guide/supabase" ──→ GuideViewer.tsx
                        ├── slug → guides.json에서 file: "Supabase.html" 조회
                        ├── 헤더 버튼: [PPT(이미지)] [PPT(편집)] [PDF] [새탭]
                        ├── 좌측 사이드바 (전체 가이드 목록)
                        └── <iframe src="/guides/Supabase.html">
```

---

## 4. templates/ 도구 사용법

```bash
# 1. 새 가이드 작성
cp templates/template.md mddata/NewGuide.md
# mddata/NewGuide.md 편집 (frontmatter의 style, title 등 설정)

# 2. HTML 생성
node templates/build-guide.mjs mddata/NewGuide.md public/guides/NewGuide.html

# 스타일 강제 지정
node templates/build-guide.mjs mddata/NewGuide.md --style knowledge

# 3. guides.json에 등록 (카테고리 배열에 추가)
# { slug: "newguide", title: "New Guide", subtitle: "...", file: "NewGuide.html" }

# 4. 빌드
npm run build

# 역방향: 기존 HTML 편집
node templates/html-to-md.mjs public/guides/Claude.html templates/Claude.md
# → 검수 후 build-guide.mjs 재빌드
```

---

## 5. scripts/ — 변환 도구

### build-standalone.mjs

`public/standalone.html`을 생성하는 스크립트.

```bash
npm run build:standalone
```

- `src/data/guides.json`에서 가이드 목록 읽어 좌측 메뉴 생성
- 각 가이드 HTML을 Shadow DOM으로 삽입해 스타일 충돌 방지
- 다크/라이트 테마 전환 + `localStorage` 저장
- `print` 미디어에서 메뉴/내비 자동 숨김

### html-to-pptx.mjs

`public/guides/*.html`을 편집 가능한 `.pptx`로 변환하는 CLI 스크립트.

```bash
# 단일 파일
node scripts/html-to-pptx.mjs public/guides/Supabase.html

# styles.json 프리셋 적용
node scripts/html-to-pptx.mjs public/guides/Supabase.html --style ai-dev

# 모든 가이드 일괄 변환
node scripts/html-to-pptx.mjs --all "public/guides/*.html"

# 상세 로그
node scripts/html-to-pptx.mjs public/guides/Supabase.html --verbose
```

변환 흐름:
```
HTML → cheerio 파싱
     → CSS :root 변수 추출 → 색상 팔레트
     → sectionSelectors로 섹션 분할
     → walkEl() 재귀: grid/card/h3/p/ul/table/pre/blockquote → Block[]
     → pptxgenjs로 슬라이드 생성 → dist-pptx/*.pptx
```

---

## 6. 브라우저 내보내기 (`src/lib/exportGuide.ts`)

### PPT (이미지) — `exportIframeToPptx`

| 항목 | 내용 |
|------|------|
| 방식 | html2canvas로 각 섹션 캡처 → JPEG 이미지 → pptxgenjs 슬라이드 |
| 편집 | 불가 |
| 디자인 보존 | 최상 (픽셀 캡처) |

### PPT (편집) — `exportIframeToEditablePptx`

| 항목 | 내용 |
|------|------|
| 방식 | iframe DOM 순회 → pptxgenjs 네이티브 객체 조립 |
| 편집 | 가능 (텍스트, 표, 도형 모두) |
| 디자인 보존 | 보통 (근사 렌더링) |

HTML → Block 파싱 규칙:

| HTML | PPT 출력 |
|------|---------|
| `.card`, `.feature-card` 등 | `addShape("roundRect")` + 내부 텍스트 |
| `h3`, `h4` | 소제목 텍스트 (28pt Bold) |
| `p` | 본문 텍스트 (13pt) |
| `ul` / `ol` | bullet / 번호 목록 |
| `table` | `addTable` (헤더 강조) |
| `pre` | 다크 배경 + Consolas 11pt |
| `blockquote` | 좌측 컬러바 + 이탤릭 |

색상 상수 (고정):
- 표지 배경 `#0F172A`, 액센트 `#6366F1`, 카드 배경 `#F8FAFC`
- 폰트: Malgun Gothic (한글), Consolas (코드)

### PDF — `printGuideIframe`

| 항목 | 내용 |
|------|------|
| 방식 | `window.print()` (jsPDF 미사용) |
| 디자인 보존 | 최상 (CSS 그대로) |
| 텍스트 검색 | 가능 |
| 페이지 크기 | A4, 여백 12mm |

---

## 7. 세 가지 내보내기 비교

| 항목 | PPT (이미지) | PPT (편집) | PDF |
|------|------------|-----------|-----|
| 라이브러리 | html2canvas + pptxgenjs | pptxgenjs | window.print() |
| 텍스트 편집 | 불가 | 가능 | 불가 |
| 디자인 충실도 | 최상 | 보통 | 최상 |
| 텍스트 검색 | 불가 | 가능 | 가능 |
| 용도 | 발표용 슬라이드 | 수정·재활용 | 문서 배포·보관 |
