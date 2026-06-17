# [상세 아키텍처 정의서] 가이드북 허브 & 에디터 파이프라인

본 문서는 프론트엔드 UI 계층, 백엔드 로컬 API 플러그인, 빌드 엔진 간의 종합 연동 아키텍처와 Standalone 배포 번들 메커니즘을 명시합니다.

---

## 1. 종합 시스템 아키텍처 및 데이터 흐름

전체 아키텍처는 파일 시스템 접근성이 제한된 웹 브라우저 환경의 한계를 극복하기 위해, **Vite 개발 서버 플러그인 미들웨어**를 프록시 백엔드로 채택하여 로컬 파일의 입출력 및 CLI 엔진 제어를 중계합니다.

```
+---------------------------------------------------------------------------------+
|                                1. UI 계층 (Front-End)                           |
|  - React + TS / shadcn/ui 기반 Split Pane Layout                                |
|  - UI State 관리: markdownText, activeTheme, activeFont, previewMode            |
+----------------------------------------+----------------------------------------+
                                         | JSON POST Request (API fetch)
                                         ▼
+---------------------------------------------------------------------------------+
|                        2. 미들웨어 계층 (Vite API Plugin)                       |
|  - scripts/vite-api-plugin.ts 내 Express 미들웨어 라우터                         |
|  - Endpoint mapping & Request buffer parsing                                   |
+----------------------------------------+----------------------------------------+
                                         | Child Process / File write
                                         ▼
+---------------------------------------------------------------------------------+
|                        3. 엔진 계층 (Node.js Build Tools)                       |
|  - build-guide.mjs        : 마크다운 ──> 가이드 HTML 렌더러                     |
|  - build-presentation.mjs : 마크다운 ──> 횡형 HTML 슬라이드 병합 빌더           |
|  - md-to-pptx.mjs         : 마크다운 ──> PPTX 바이너리 렌더러 (pptxgenjs)       |
|  - build-standalone.mjs   : Standalone 오프라인 1파일 병합 번들러               |
+---------------------------------------------------------------------------------+
```

---

## 2. API 엔드포인트 세부 명세 (`vite-api-plugin.ts`)

### A. 실시간 메모리 컴파일 미리보기
* **주소**: `POST /api/preview`
* **설명**: 디스크에 물리 파일을 임베딩하지 않고 에디터 내용 버퍼를 즉석에서 컴파일하여 미리보기 화면에 스트리밍합니다.
* **프로토콜 사양**:
  * **요청 헤더**: `Content-Type: application/json`
  * **요청 본문**:
    ```json
    {
      "markdown": "마크다운 소스 코드 본문",
      "mode": "guide" | "presentation",
      "color": "블루/테일 등 스타일 테마 키",
      "font": "글꼴 명세 키"
    }
    ```
  * **응답 본문**:
    ```json
    {
      "html": "컴파일 완료된 HTML 마크업 텍스트"
    }
    ```

### B. 확정 생성 및 로컬 저장
* **주소**: `POST /api/save-generate`
* **설명**: 지정 경로에 파일 물리 생성 및 가이드북 허브 목록 자동 갱신 트리거를 유동적으로 실행합니다.
* **요청 본문**:
  ```json
  {
    "filename": "Supabase",
    "markdown": "마크다운 본문",
    "saveOption": "guideHub" | "standaloneFolder",
    "outputPath": "dist-pptx",
    "formats": ["html", "presentation", "pptx"]
  }
  ```

---

## 3. Standalone HTML 데이터 병합 및 캡슐화 설계

가이드 허브를 단 하나의 인터넷 무설치 단일 HTML 파일로 번들링하는 `build-standalone.mjs`의 아키텍처는 다음과 같습니다.

### A. 자바스크립트 버퍼 임베딩
* 모든 마크다운 파일들의 메타데이터와 변환된 HTML 문서 바디를 단일 자바스크립트 딕셔너리로 직렬화하여 헤드 영역에 선언합니다.
```javascript
const G_GUIDES_DATA = {
  "Supabase": {
    "title": "Supabase 가이드",
    "html": "<div>본문 마크업...</div>",
    "theme": "ai-dev"
  },
  "Cursor": { ... }
};
```

### B. Shadow DOM 스타일 격리 (Style Capsulation)
* 메인 컨테이너 스타일과 개별 가이드북의 독립 CSS 변수(`--c-primary` 등)가 상호 간섭하여 디자인이 깨지는 문제를 예방하기 위해 **Shadow DOM** 구조로 렌더링 컨테이너를 오픈 격리합니다.
```javascript
const container = document.getElementById('guide-viewport');
const shadowRoot = container.attachShadow({ mode: 'open' });

// Shadow DOM 내부로 뷰포트 마크업 및 가이드북 전용 CSS 주입
shadowRoot.innerHTML = `
  <style>${guideSpecificCSS}</style>
  <div class="doc-wrapper">${selectedGuideHtml}</div>
`;
```

---

## 4. 디자인 사양서 형상 관리 경로

프로젝트의 디자인 스펙 정의 파일들은 단순 백업용 로컬 폴더인 `storage/`를 지양하고, Git 형상 관리에 완전하게 등록 및 추적되도록 아래의 전용 경로로 영구 재배치되었습니다.

* **디자인 사양 소스 및 JSON 템플릿**:
  * [md_src/designspec/sample-content.md](file:///c:/ai/creative-spark/md_src/designspec/sample-content.md)
  * [md_src/designspec/template.json](file:///c:/ai/creative-spark/md_src/designspec/template.json)
* **디자인 사양 정적 HTML 산출물**:
  * [public/designspec/nipa_design_system_spec.html](file:///c:/ai/creative-spark/public/designspec/nipa_design_system_spec.html)
  * [public/designspec/nipa-blue.html](file:///c:/ai/creative-spark/public/designspec/nipa-blue.html)
  * [public/designspec/teal-noto.html](file:///c:/ai/creative-spark/public/designspec/teal-noto.html)
  * [public/designspec/violet-human.html](file:///c:/ai/creative-spark/public/designspec/violet-human.html)
