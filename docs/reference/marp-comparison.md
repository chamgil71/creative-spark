# 📚 Creative Spark vs Marp 비교 및 연동 가이드

본 문서는 마크다운 기반 프레젠테이션 및 가이드북 생성 도구인 **Marp**와 본 프로젝트인 **Creative Spark**의 특징을 비교하고, Marp의 강점(실시간 미리보기 등)을 Creative Spark에 도입하거나 연동하여 작업 효율을 극대화하는 방안을 설명합니다.

---

## 1. 두 프로젝트 핵심 비교 요약

| 비교 항목 | Marp (Marp for VS Code) | Creative Spark |
| :--- | :--- | :--- |
| **핵심 패러다임** | **Presentation-First** (가로형 발표 슬라이드 전용) | **Multi-format Publication** (반응형 웹북 + 횡형 슬라이드 + PPTX) |
| **슬라이드 구분** | `---` 기호로 강제 분할 | H1/H2 헤더 구조 기반 자동 분할 또는 숏코드 단위 분할 |
| **시각적 요소** | 표준 마크다운 문법 + 커스텀 CSS | **29종 컴포넌트형 숏코드** (`feature-grid`, `git-flow`, `editor-box` 등) |
| **PPTX 변환 방식** | HTML 화면 스크린샷 캡처 후 이미지 삽입 (**편집 불가능**) | `pptxgenjs` 기반 파워포인트 **네이티브 개체 생성** (**100% 편집 가능**) |
| **배포 환경** | HTML 슬라이더, PDF, PPTX(통이미지), PNG | React 웹북 패키지, 오프라인 단일 파일(`standalone.html`), 네이티브 PPTX |
| **미리보기 환경** | VS Code 내장 실시간 슬라이드 미리보기 제공 | React HMR 실시간 개발 서버 및 브라우저 기동 |

---

## 2. Marp의 장점(실시간 미리보기)을 Creative Spark로 가져오는 방안

Marp의 가장 큰 장점은 **VS Code 내에서 마크다운을 편집하는 즉시 슬라이드 형태로 분할된 실시간 미리보기**를 볼 수 있다는 점입니다. Creative Spark에서도 다음과 같은 연동 방안을 통해 유사한 개발 경험을 확보할 수 있습니다.

### 방법 A: VS Code 내장 Simple Browser + React HMR 연동 (권장)
Creative Spark의 로컬 React 실시간 개발 서버의 HMR(Hot Module Replacement) 기능과 VS Code의 내장 브라우저를 조합하는 방식입니다.

1. **로컬 개발 서버 실행**:
   ```bash
   npm run dev
   ```
2. **VS Code Simple Browser 열기**:
   * VS Code에서 `F1` 또는 `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`)를 눌러 명령 팔레트를 엽니다.
   * `Developer: Open Simple Browser`를 선택합니다.
   * 주소창에 `http://localhost:5173/presentation/all.html` (또는 작업 중인 특정 슬라이드 주소)를 입력합니다.
3. **듀얼 스크린 편집**:
   * 화면을 좌우로 분할하여 왼쪽에는 마크다운 에디터, 오른쪽에는 Simple Browser를 배치합니다.
   * 왼쪽 에디터에서 마크다운 내용을 수정하고 저장(`Ctrl+S`)하는 즉시, 오른쪽 브라우저 화면이 실시간으로 부드럽게 새로고침(HMR)되어 변경 사항을 바로 확인할 수 있습니다.

### 방법 B: VS Code Markdown Preview에 Creative Spark CSS 주입
VS Code에 기본으로 탑재된 마크다운 미리보기 기능에 Creative Spark의 레이아웃 스타일을 연결하여 숏코드 영역이 깨지지 않고 정렬되도록 구성하는 방법입니다.

1. **프로젝트 설정 파일 생성**:
   프로젝트 루트의 `.vscode/settings.json` 파일에 다음 설정을 추가하여 Creative Spark의 가이드 스타일시트를 내장 미리보기에 바인딩합니다.
   ```json
   {
     "markdown.styles": [
       "./src/index.css",
       "./public/guides/style.css" // 빌드된 CSS 경로가 존재할 경우
     ]
   }
   ```
2. 이렇게 설정하면 VS Code 기본 마크다운 미리보기(`Ctrl+K V`)창에서도 숏코드 격자 레이아웃이 깔끔하게 표시됩니다.

---

## 3. 마크다운 작성 및 변환 방법 비교

### 3.1 Marp 작성 및 변환 방법

#### 1) 마크다운 작성 규칙
Marp는 Frontmatter 영역에 `marp: true`를 반드시 선언해야 엔진이 기동하며, 슬라이드 간의 구분은 마크다운 수평선 구분 기호인 `---`를 사용합니다.

```markdown
---
marp: true
theme: gaia         # 기본 테마 (default, gaia, uncover 등)
_class: lead        # 현재 슬라이드 전용 클래스
paginate: true      # 페이지 번호 표시
header: "Marp 가이드"
footer: "Copyright © Marp"
---

# 1. 첫 번째 슬라이드 제목
Marp 마크다운 프레젠테이션 작성을 시작합니다.

- 첫 번째 특징
- 두 번째 특징

---

# 2. 두 번째 슬라이드 제목
수평선 기호(`---`)를 기준으로 슬라이드가 나뉩니다.
```

#### 2) 파일 변환 방법 (Marp CLI 사용)
Marp는 CLI 도구를 글로벌 또는 로컬에 설치하여 다양한 포맷으로 변환합니다.

*   **HTML 슬라이드 변환**:
    ```bash
    npx @marp-team/marp-cli slide.md -o output.html
    ```
*   **PDF 변환** (Chrome 브라우저 엔진이 설치되어 있어야 함):
    ```bash
    npx @marp-team/marp-cli slide.md --pdf -o output.pdf
    ```
*   **PPTX(통이미지 파워포인트) 변환**:
    ```bash
    npx @marp-team/marp-cli slide.md --pptx -o output.pptx
    ```

---

### 3.2 Creative Spark 작성 및 변환 방법

#### 1) 마크다운 작성 규칙 (컴포넌트 숏코드 지향)
Creative Spark는 H1(`#`)과 H2(`##`) 기반으로 발표 슬라이드 단위를 자동 파싱하며, 화면을 다차원적으로 분할하고 컴포넌트화하기 위해 **Universal Schema(6대 표준 키)** 기반의 숏코드를 활용합니다.

```markdown
---
title: "Creative Spark 실전"
subtitle: "IT 가이드북 제작을 위한 마크다운 포맷"
style: ai-chat      # config/styles.json에 정의된 브랜드 테마 키값
---

# 1. 시스템 아키텍처 및 특징
이 섹션은 첫 번째 대단원 슬라이드로 렌더링됩니다.

## 주요 제공 기능
H2 헤더는 개별 카드 또는 슬라이드 단위로 분할됩니다. 아래 숏코드는 바둑판 배열로 자동 렌더링됩니다.

::: feature-grid cols=3
- icon: "⚡"
  title: "초고속 렌더링"
  desc: "Vite 엔진 기반으로 빠른 화면 전환 속도를 제공합니다."
  tag: "성능"
- icon: "🎨"
  title: "테마 트랜지션"
  desc: "HSL 컬러 변수를 추적하여 브랜드 아이덴티티를 유지합니다."
  tag: "디자인"
- icon: "📦"
  title: "독립 배포"
  desc: "에셋이 100% 내장된 standalone 단일 파일 빌드가 가능합니다."
  tag: "배포"
:::
```

#### 2) 파일 변환 방법 (Node.js 파이프라인 스크립트 사용)
Creative Spark는 `package.json`에 미리 정의된 NPM 스크립트 도구를 실행하여 컴파일합니다.

*   **카테고리 색인 동기화**:
    마크다운 파일을 새로 추가한 후 목록에 반영하기 위해 인덱스를 갱신합니다.
    ```bash
    npm run sync:guides
    ```
*   **HTML 퍼블리싱 및 PPTX 일괄 출력**:
    `md_src/guides/*.md` 파일들을 HTML 가이드로 렌더링하고 `public/pptx/` 폴더에 각각의 **네이티브 편집 가능 PPTX** 파일을 생성합니다.
    ```bash
    npm run build:publish
    ```
*   **가로형 PPT HTML 슬라이드 생성**:
    웹 브라우저에서 가로로 넘겨보는 슬라이드 뷰어용 HTML 파일을 병합 컴파일합니다.
    ```bash
    npm run build:slide -- md_src/guides public/presentation/all.html
    ```
*   **React 웹북 및 Standalone 오프라인 패키지 빌드**:
    Vite 컴파일 및 에셋 일괄 캡슐화를 통해 무설치 단일 가동용 `standalone.html`을 생성합니다.
    ```bash
    npm run build
    ```

---

## 4. 종합 분석 및 사용 권장 시나리오

두 도구는 사용 환경과 최종 비즈니스 목적에 따라 선택적으로 활용하는 것이 바람직합니다.

*   **Marp 사용을 추천하는 시나리오**:
    *   간단하고 정형화된 발표 자료를 빠르게 만들어야 할 때.
    *   기존 슬라이드 템플릿(CSS)이 이미 견고하게 잡혀 있고, 텍스트 위주의 슬라이드를 구성할 때.
    *   VS Code 내에서 실시간으로 슬라이드 구조를 눈으로 바로바로 확인하며 작업하고 싶을 때.
*   **Creative Spark 사용을 추천하는 시나리오**:
    *   고객사 배포용 IT 매뉴얼, 개발 가이드북, 도구 분석집 등 **시각적 완성도가 극도로 높은 콘텐츠**를 기획할 때.
    *   텍스트 중심 슬라이드에서 벗어나 **다채로운 카드 뷰, 코드 하이라이터 에디터 뷰, 깃 흐름도 등의 인포그래픽**이 포함되어야 할 때.
    *   작성 완료된 슬라이드를 타 부서나 클라이언트에게 전달하여 **파워포인트에서 직접 텍스트나 레이아웃을 2차 편집/보완**할 수 있게 제공해야 할 때.
    *   인터넷 환경이 제한된 폐쇄망 서버나 로컬 오프라인 환경에 단 하나의 HTML 파일로 전체 메뉴얼북 패키지를 배포하고 기동해야 할 때.
