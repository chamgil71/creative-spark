# 스크립트 통합 사용 가이드

본 지침서는 마크다운(.md) 기반 콘텐츠의 포맷 변환, 인덱싱 동기화, 정적 HTML 출판, 프레젠테이션(PPTX) 자동 생성, PPT형 횡 슬라이드 HTML 및 Standalone 독립 번들러 등 프로젝트 내부의 모든 활성 스크립트 분류 및 사용법을 다룹니다.

기존 `templates/` 폴더 내에 흩어져 있던 개별 컴파일 도구들은 가시성과 관리 편의를 위하여 **`scripts/` 폴더로 일괄 통합 및 정리**되었습니다.

---

## 1. 활성 스크립트 분류 체계

### 1) 핵심 변환 도구 (Core Converters)
| 스크립트 명칭 | 입력 ──→ 출력 | 용도 및 성격 |
|:---|:---|:---|
| **`scripts/build-guide.mjs`** | 마크다운(.md) ──→ 가이드 HTML | 6대 표준 키 및 18종 숏코드 기반의 가이드 문서 생성 |
| **`scripts/build-presentation.mjs`** | 마크다운(.md) ──→ 횡 슬라이드 HTML | **[신설]** PPT 슬라이드처럼 횡으로 한 장씩 넘기는 뷰어 HTML 생성 |
| **`scripts/html-to-md.mjs`** | 가이드 HTML ──→ 마크다운(.md) | 기존 HTML 콘텐츠의 숏코드 구문 역변환 복원 |
| **`scripts/md-to-pptx.mjs`** | 마크다운(.md) ──→ PPTX 슬라이드 | PPTXGenJS를 이용해 16:9 슬라이드 파일 자동 빌드 |
| **`scripts/html-to-pptx.mjs`** | 가이드 HTML ──→ PPTX 슬라이드 | HTML → MD 역변환 복원 후 PPTX로 변환하는 연쇄 처리 |

### 2) 파이프라인 및 인프라 유틸리티 (Pipeline & Infrastructure Utilities)
| 스크립트 명칭 | 역할 | 연계 기동 프로세스 |
|:---|:---|:---|
| **`scripts/sync-guides-index.mjs`** | 인덱스 목록 및 스타일 동기화 | `md_src/` 하위 디렉토리를 자동 스캔하여 `guides.json` 인덱스 생성 |
| **`scripts/build-publish.mjs`** | 정적 리소스 퍼블리셔 | 전체 마크다운 가이드와 시리즈의 일괄 컴파일 수행 |
| **`scripts/build-standalone.mjs`** | Standalone 오프라인 번들러 | 모든 가이드와 시리즈 데이터를 Shadow DOM 단일 HTML로 병합 |

---

## 2. 핵심 변환 도구 상세 사용법

### 1) scripts/build-guide.mjs (MD → 가이드 HTML)
단일 마크다운 파일을 고품질 컴포넌트 마크업이 내장된 HTML로 변환합니다.

```bash
# 기본 사용법 (출력 생략 시 public/guides/<이름>.html로 자동 지정)
node scripts/build-guide.mjs md_src/guides/Supabase.md

# 출력 폴더 또는 경로 커스텀 지정
node scripts/build-guide.mjs md_src/guides/Supabase.md public/my-folder

# 스타일 프리셋 강제 오버라이드
node scripts/build-guide.mjs md_src/guides/Supabase.md --style ai-dev
```
* **폴더 자동 판단**: 출력값에 파일명이 아닌 `public/my-folder` 처럼 폴더명만 기재할 경우, 자동으로 입력 파일명을 결합하여 `public/my-folder/Supabase.html` 경로에 파일을 저장합니다.

---

### 2) scripts/build-presentation.mjs (MD → PPT형 횡 슬라이드 HTML) [NEW]
마크다운 문서를 전체 화면 크기의 슬라이드 형태로 변환하며, 횡 스크롤(한 장씩 스냅핑) 뷰어가 내장된 PPT형 HTML 파일을 생성합니다. 단일 파일 변환은 물론, 여러 파일/폴더 전체 병합 및 Glob 컴파일도 지원합니다.

#### A. 단축 명령어 및 단일 파일 변환
`package.json`에 구성된 단축 스크립트(`npm run build:slide`)를 활용하여 인자를 간편하게 주입할 수 있습니다.
```bash
# 기본 사용법 (출력 생략 시 public/presentation/<이름>.html로 자동 지정)
npm run build:slide -- md_src/guides/Cursor.md

# 출력 폴더 또는 특정 HTML 파일 경로 커스텀 지정
npm run build:slide -- md_src/guides/Cursor.md public/presentation/cursor-deck.html
```

#### B. 다중 파일 및 폴더 전체 병합
여러 마크다운 파일들의 목록을 인자로 지정하여 하나의 연속된 슬라이드로 묶거나, 마크다운 파일들이 들어있는 폴더명을 지정하여 폴더 내의 모든 가이드 문서를 이름순으로 한데 묶어 하나의 HTML 슬라이드로 컴파일할 수 있습니다.
```bash
# 여러 개별 파일 묶어 병합 슬라이드 생성
npm run build:slide -- md_src/guides/Cursor.md md_src/guides/Claude.md public/presentation/combined.html

# 폴더 전체 스캔 병합 슬라이드 생성 (폴더 내 *.md 파일을 이름순으로 자동 정합)
npm run build:slide -- md_src/guides public/presentation/all-guides.html
```

#### C. Glob 패턴 컴파일
와일드카드 패턴을 큰따옴표로 감싸서 넘기면, 해당 조건에 맞는 모든 문서를 탐색하여 하나의 슬라이드로 합쳐냅니다.
```bash
# md_src 폴더 하위 전체 가이드를 매치하여 빌드하고 claude 스타일 프리셋 강제 적용
npm run build:slide -- "md_src/**/*.md" --out public/presentation/all.html --style claude
```

* **뷰어 특징 및 연동 스키마**:
  * **다이내믹 브랜드 컬러 트랜지션**: 여러 파일이 하나로 병합되더라도, 각 슬라이드가 기반한 개별 마크다운 파일의 `style` 프리셋 속성에 따라 가로로 넘길 때마다 브랜드 테마 컬러가 유연하고 자연스럽게 전환됩니다.
  * **CSS Scroll Snap**: 브라우저 기본 스크롤 동작을 가로로 정밀하게 제어하여 한 페이지씩 딱딱 붙는 횡 슬라이드를 구성합니다.
  * **단축키 내비게이션**: 키보드 `ArrowRight` / `ArrowLeft` / `Space` / `PageDown` / `PageUp` / `Home` / `End` 키로 슬라이드를 직관적으로 제어할 수 있습니다.
  * **진행도 인디케이터**: 하단에 병합된 슬라이드 전체 개수를 분모로 하는 실시간 프로그레스 바(`progress-bar`) 및 슬라이드 번호 인디케이터가 자동으로 계산되어 표시됩니다.
  * **컴포넌트 지원**: 가이드 문서에서 쓰던 모든 그리드, 에디터 박스, 깃 플로우 등 29종 숏코드를 동일하게 화면에 최적화하여 출력합니다.
  * **TOC 사이드바** `[NEW]`: 왼쪽 접이식 목차 패널이 자동 생성됩니다. 각 슬라이드의 페이지 번호와 제목이 목록으로 표시되며, 항목 클릭 시 해당 슬라이드로 이동합니다.

#### TOC 사이드바 조작법

| 동작 | 방법 |
|------|------|
| 열기 / 닫기 | 좌측 상단 ☰ 버튼 클릭, 또는 키보드 `T` |
| 슬라이드 이동 | TOC 항목 클릭 (이동 후 자동 닫힘) |
| 오버레이로 닫기 | TOC 바깥 어두운 영역 클릭 |
| 현재 위치 표시 | 현재 슬라이드 항목에 왼쪽 컬러 바 + 강조 스타일 자동 표시 |
| 인쇄/PDF | 사이드바 자동 숨김 (`@media print`) |

커버 슬라이드(`#` 헤딩)는 TOC에서 굵게 브랜드 컬러로 구분 표시됩니다.

---

### 3) scripts/html-to-md.mjs (HTML → MD 역변환)
HTML 문서의 소스 코드와 컴포넌트를 파싱하여 마크다운 숏코드 규격의 텍스트로 환원합니다.

```bash
node scripts/html-to-md.mjs public/guides/Claude.html md_src/guides/Claude.md
```

---

### 4) scripts/md-to-pptx.mjs (MD → PPTX 프레젠테이션)
6대 표준 키 스키마를 기준으로 마크다운 숏코드 블록을 16:9 슬라이드 PPTX 파일로 빌드합니다.

```bash
# 단일 파일 변환
node scripts/md-to-pptx.mjs md_src/guides/Supabase.md

# 전체 일괄 변환 (--all 사용)
node scripts/md-to-pptx.mjs --all "md_src/guides/*.md"
```

---

## 3. 파이프라인 및 인프라 유틸리티 상세 사용법

### 1) scripts/sync-guides-index.mjs (목록 및 스타일 동기화)
`md_src/guides/` 및 새로 추가되는 모든 시리즈 하위 디렉토리를 스캔하여 `src/data/guides.json`을 자동 업데이트합니다.

```bash
npm run sync:guides
```
* **동작 특징**: 기존 `guides.json` 내부의 수동 정렬 순서 및 커스텀 메타데이터(`label`, `description`, `color` 등)를 완전히 보존하며 신규 등록된 파일만 덧붙입니다.

### 2) scripts/build-publish.mjs (일괄 퍼블리셔)
웹 브라우저 서비스에 필요한 전체 가이드 HTML 및 컬렉션 정적 리소스, PPTX 슬라이드를 최신화합니다.

```bash
npm run build:publish
```
* **동작 순서**:
  1. `sync-guides-index.mjs` 동기화 자동 선행 기동.
  2. `md_src/` 안의 전체 카테고리 폴더 자동 발견 및 `public/` 정적 HTML 일괄 컴파일.
  3. 쇼케이스 마크다운의 HTML/PPTX 동시 최신화.
  4. 로컬용 오프라인 단일 파일 `public/standalone.html` 생성.

### 3) scripts/build-standalone.mjs (Standalone 번들러)
모든 정적 가이드와 컬렉션들을 Shadow DOM 캡슐화 기법을 사용하여 CSS 오염 없이 하나의 오프라인 통합 HTML 파일로 묶어냅니다.

```bash
npm run build:standalone
```
* **출력 경로**: `public/standalone.html` 및 배포 빌드 시 `dist/standalone.html`로 이중 저장됩니다.
* ** Windows 락 프리 보증**: Vite 개발 서버 기동 중의 파일 잠금 오류를 방지하기 위해 파일 unlink 기법이 선 도입되어 있습니다.
