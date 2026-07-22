@AGENTS.md

# CLAUDE.md — Creative Spark 프로젝트 컨텍스트

> AI 어시스턴트(Claude Code 등)가 이 프로젝트에서 작업할 때 참조하는 핵심 컨텍스트 파일.

---

## 프로젝트 개요

**Creative Spark**는 Markdown → HTML 가이드 / 횡 슬라이드 HTML / PPTX 세 가지 출력을 자동 생성하는 콘텐츠 파이프라인 프로젝트.  
`md_src/` 하위에 숏코드(.md)를 작성하면 `scripts/` 빌더가 `public/` 에 HTML을 출력한다.

---

## 핵심 빌드 명령어

```bash
# 가이드 HTML 생성 (단일)
node scripts/build-guide.mjs md_src/claudeguide/ai-tools-guide.md

# 횡 슬라이드 HTML 생성 (단일)
node scripts/build-presentation.mjs md_src/claudeguide/ai-tools-guide.md

# PPTX 생성 (단일)
node scripts/md-to-pptx.mjs md_src/claudeguide/ai-tools-guide.md

# 전체 일괄 빌드 (React 포함)
npm run build

# 가이드 인덱스 동기화
npm run sync:guides
```

---

## 디렉토리 구조

```
creative-spark/
├── md_src/                  ← 숏코드 마크다운 원본 (작성 위치)
│   ├── claudeguide/         ← Claude·AI 도구 가이드 시리즈
│   ├── vibecoding/          ← 바이브코딩 시리즈
│   └── showcase/            ← 숏코드 쇼케이스 (문법 레퍼런스)
├── docs/                    ← 프로젝트 내부 문서
│   ├── ai-tools-guide.md    ← AI 도구 가이드 (plain markdown 원본)
│   └── myproject-guide.md   ← 내 프로젝트 운영 가이드
├── scripts/
│   ├── build-guide.mjs      ← MD → 가이드 HTML
│   ├── build-presentation.mjs ← MD → 횡 슬라이드 HTML
│   └── md-to-pptx.mjs       ← MD → PPTX
├── config/
│   ├── styles.json          ← 색상 프리셋 11종
│   ├── pptdesign.config.json ← PPTX 레이아웃 수치
│   └── htmldesign.config.json ← HTML 폰트 설정
└── public/
    ├── claudeguide/         ← 가이드 HTML 출력
    └── presentation/        ← 횡 슬라이드 HTML 출력
```

---

## 숏코드 타입 (29종)

| 타입 | 용도 |
|------|------|
| `feature-grid` | 특징·강점 카드 격자 |
| `icon-grid` | 아이콘 중심 카드 격자 |
| `compare-grid` | 항목 비교 격자 |
| `stat-grid` | 수치 지표 격자 |
| `badge-grid` | 배지형 격자 |
| `columns-grid` | 범용 다단 본문 |
| `plan-grid` | 요금제·플랜 비교 |
| `tool-list` / `tool-box` | 좌측 컬러 사이드바 도구 카드 |
| `step-list` | 번호 단계 목록 |
| `step-flow` / `flow` | 가로 흐름 시각화 |
| `git-flow` / `git-flow-strip` | 깃 브랜치 흐름 (양끝 10% 마진 적용) |
| `workflow-flow` / `workflow-strip` | 워크플로우 흐름 |
| `editor-box` | 코드 에디터 시뮬레이션 |
| `cmd-box` | 터미널 명령어 블록 |
| `console-box` | 콘솔 출력 블록 |
| `summary-box` / `bottom-list` | 요약 박스 (title에 `**bold**` 지원) |
| `alert-box` | 경고·팁 박스 (tip/warn/success/danger) |
| `compare-split` | 좌우 2열 비교 |
| `compare-diff` | Before/After 비교 |
| `faq-list` | 접이식 FAQ |
| `part-banner` | 시리즈 파트 헤더 |
| `chapter-list` | 챕터 목록 (TOC용) |
| `level-grid` | 레벨·난이도 스펙트럼 |
| `skill-list` | 스킬 목록 |
| `checkpoint-grid` | 체크포인트 격자 |
| `takeaway-banner` | 핵심 결론 배너 |
| `network-box` | 노드 네트워크 시각화 |
| `summary-bar` | 하단 수치 요약 바 |
| `slide-config` | 슬라이드별 배경/텍스트 색상 오버라이드 |

---

## 숏코드 작성 규칙

### 6대 표준 키
`icon` / `title` / `desc` / `tag` / `meta` / `note` / `color`
* **color**: 개별 고정 Hex 색상(예: `"#6366F1"`) 외에도 테마 의미론적 키워드(`"main"`, `"sub"`, `"deep"`, `"mid"`, `"light"`)를 지원하여 스타일 전환에 유연하게 대처 가능.

### 기본 문법
```md
::: shortcode-type cols=2
- icon: "🚀"
  title: "제목"
  desc: "설명 내용"
  tag: "태그"
  color: "sub"  # 또는 "#6366F1"
:::
```

### 멀티라인 desc (파이프 블록)
```md
- title: "항목"
  desc: |
    - 첫 번째 줄
    - 두 번째 줄
```

### meta 파이프 구분
```md
  meta: "항목1|항목2|항목3"
```

---

## 슬라이드 구조 규칙 (md_src 파일)

| 마크다운 | 슬라이드 역할 |
|----------|--------------|
| `#` 헤딩 | 커버 슬라이드 (그라디언트 배경) |
| `##` 헤딩 | 콘텐츠 슬라이드 |
| `---` | 슬라이드 구분선 |

---

## 스타일 프리셋 (11종)

| 키 | 용도 |
|----|------|
| `ai-chat` | Claude·AI 채팅 (초록 #10A37F) |
| `ai-dev` | 개발 도구 (오렌지 #D97757) |
| `knowledge` | 지식·문서 (보라) |
| `productivity` | 생산성 도구 |
| `creative` | 크리에이티브 |
| `security` | 보안 |
| `finance` | 금융 |
| `future` | 미래 기술 |
| `enterprise` | 엔터프라이즈 |
| `media` | 미디어 |

---

## 주요 설계 결정 및 주의사항

### renderInline() — 숏코드 title 내 마크다운 볼드 지원
`build-guide.mjs`, `build-presentation.mjs` 모두 `escapeHtml()` 직후 `renderInline()` 함수가 선언됨.  
`summary-box`의 `bl-title` 등 title 필드에서 `**bold**` → `<strong>` 변환에 사용.

### git-flow 양끝 마진
HTML: `.branch-line { padding: 0 10%; }`  
PPTX: `md-to-pptx.mjs`의 `renderWorkflow()` 에서 `isGitFlow` 시 `margin = w * 0.10` 적용.  
workflow-flow 타입에는 마진 미적용.

### 횡 슬라이드 TOC 사이드바
`build-presentation.mjs`가 생성하는 HTML에 왼쪽 접이식 TOC 사이드바 내장.  
- 햄버거 버튼(☰) 또는 키보드 `T`로 열기/닫기
- 항목 클릭 시 해당 슬라이드로 이동 후 자동 닫힘
- 현재 슬라이드 아이템에 활성 스타일(왼쪽 컬러 바) 표시
- 인쇄/PDF 출력 시 자동 숨김

### --brand CSS 변수 범위
각 `.slide` 요소에 인라인 `style`로 `--brand` 등 브랜드 색상 주입.  
`:root`에도 `mainStyle`(첫 번째 파일의 style 프리셋) 기반 기본값 선언 — TOC 사이드바 등 `position:fixed` 요소가 이를 참조.

### 콘텐츠 작성 이원화
- **`docs/*.md`** — plain markdown 레퍼런스 (GitHub 등에서 읽는 용)
- **`md_src/**/*.md`** — 숏코드 슬라이드 원본 (빌더 입력용)
두 파일 내용이 불일치하지 않도록 양쪽 동시 업데이트 원칙.

---

## 현재 주요 콘텐츠 파일

| md_src 경로 | docs 경로 | 설명 |
|-------------|-----------|------|
| `md_src/claudeguide/ai-tools-guide.md` | `docs/ai-tools-guide.md` | AI 도구 학습 가이드 (13챕터) |
| `md_src/claudeguide/myproject_guide.md` | `docs/myproject-guide.md` | 내 프로젝트 운영 가이드 |

---

## 최근 주요 변경 이력 (2026-06)

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-06-17 | 숏코드 내 테마 연동 색상 키워드(`main`/`sub`/`deep`/`mid`/`light`) 도입 및 PPTX/HTML 연동 |
| 2026-06-15 | `build-presentation.mjs`에 TOC 사이드바 추가 |
| 2026-06-15 | `ai-tools-guide.md` 섹션 2에 스킬·커넥터·플러그인(2-5~2-7) 추가 |
| 2026-06-12 | `ai-tools-guide.md` 목차 슬라이드 2장(chapter-list) 추가 |
| 2026-06-12 | git-flow 양끝 10% 마진 적용 (HTML 2종 + PPTX) |
| 2026-06-11 | `renderInline()` 추가 — summary-box title 내 bold 렌더링 |
| 2026-06-11 | `myproject_guide.md` 재구성 (AI 툴 설명 제거, 프로젝트 중심으로) |
| 2026-06-10 | `docs/myproject-guide.md` 신규 작성 (11개 프로젝트 가이드) |
