# [통합 마스터 계획서] 프로젝트 리팩토링 및 V2 개발 계획

본 문서는 기존 1.0 컴파일러 파이프라인의 안전성을 100% 보장하면서, 새로운 V2 포맷-디자인 교차 변환 프레임워크를 설계·구현하기 위한 종합 타당성 분석 및 리팩토링 마스터 계획서입니다.

---

## 1. 개요 및 V2 지향점

V2 프레임워크는 지식 문서의 생산성과 디자인의 일관성을 강화하기 위해 **"콘텐츠 포맷"**과 **"디자인 스타일"**을 독립 분리하고, 이를 파서를 통해 동적으로 상호 결합하는 구조를 지향합니다.

### 🔄 V2 핵심 데이터 흐름 (Core Data Flow)
기존에 지적된 개요의 오해를 바로잡고, 실제 구현될 데이터 흐름을 명시합니다.

```
1) 디자인 지침 추출 단계
[디자인 지침서 (Text/MD)] ──▶ [디자인 가이드 파서] ──▶ [디자인 토큰 (config/v2/styles.json)]

2) 콘텐츠 교차 변환 단계
[마크다운 원본 (MD)] ────┐
                          ├─▶ [V2 컴파일러 엔진] ──▶ [결과물 (HTML / PPTX 슬라이드)]
[디자인 토큰 (V2 styles)] ──┘
```

---

## 2. V1.0 보존 및 V2.0 격리 구조 (1.0 무영향 원칙)

기존 1.0의 변환 스크립트들과 설정(CLI 구동 내용)은 실시간 서비스 운영을 위해 전혀 건드리지 않고 그대로 보존합니다. V2.0은 별도의 격리된 폴더 스키마로 분리 개발하여 상호 영향도를 0%로 제한합니다.

```
creative-spark/
├── scripts/                    # V1.0 컴파일러 스크립트 보관소 (보존)
│   ├── build-guide.mjs
│   ├── build-presentation.mjs
│   └── md-to-pptx.mjs
│
├── config/                     # V1.0 설정 및 토큰 (보존)
│   ├── styles.json
│   └── pptdesign.config.json
│
├── scripts/v2/                 # [신설] V2.0 엔진 핵심 코드
│   ├── spec-parser.mjs         # 디자인 지침서 ──> styles.json 추출기
│   ├── md-to-html-v2.mjs       # V2.0 마크다운 ──> HTML 컴파일러
│   ├── md-to-pptx-v2.mjs       # V2.0 마크다운 ──> PPTX 컴파일러
│   └── pptx-theme-extractor.mjs # PPTX 템플릿 ──> 디자인 토큰 역분석기
│
├── config/v2/                  # [신설] V2.0 설정 및 레이아웃 제어
│   ├── styles.json             # V2.0 동적 테마 프리셋 테이블
│   └── layout.json             # 컴포넌트별 배치 좌표계 및 렌더링 물리 규격
│
└── md_src/designspec/          # [이전 완료] 형상 관리되는 디자인 지침 및 명세서
    ├── sample-content.md
    └── template.json
```

---

## 3. 구현 기술 스택 및 구동 메커니즘 (Tech Stack & Mechanics)

V2.0 변환 엔진은 시스템 경량화와 빠른 실행 속도를 유지하기 위해 다음의 기술 스택으로 구성됩니다.

### A. 라이브러리 및 도구 구성
* **마크다운 파서 및 AST 변환**: `marked` (Markdown compiler)
  * 마크다운을 추상 구문 트리(AST) 혹은 토큰 리스트로 1차 분해하여 숏코드 경계를 안전하게 획득합니다.
* **HTML 파싱 및 DOM 조작**: `cheerio`
  * HTML 구조에서 숏코드 요소 및 인라인 요소를 빠르게 쿼리 및 변환합니다.
* **PPTX 바이너리 분석 및 해독**: `jszip` / `adm-zip`
  * PPTX 템플릿 파일(바이너리)의 압축을 해제하여 XML 구조를 메모리에 로드합니다.
* **PPTX XML 파서**: `fast-xml-parser`
  * `theme1.xml` 등에서 색상 스키마(`a:clrScheme`)와 폰트 구성 요소를 빠른 JSON 객체로 파싱하여 디자인 토큰을 역추출합니다.
* **PPTX 바이너리 생성**: `pptxgenjs`
  * 추출 및 계산된 레이아웃 좌표 정보를 대입하여 벡터 그래픽 기반의 오피스 문서를 생성합니다.

### B. layout.json 레이아웃 세부 제어 메커니즘
`config/v2/layout.json`에 정의된 그리드 및 좌표 토큰은 컴파일 시 동적으로 주입됩니다.
```json
{
  "workflow-flow": {
    "default_width": 9.0,
    "default_height": 2.5,
    "top_offset": 2.0,
    "left_offset": 0.5,
    "valign": "middle"
  },
  "terminal": {
    "font_size_pt": 10.0,
    "line_height": 1.5
  }
}
```
* `md-to-pptx-v2.mjs` 및 `md-to-html-v2.mjs` 렌더러는 컴파일 대상 숏코드 블록이 식별되면 위 `layout.json` 맵을 룩업하여, 지정된 `top_offset`, `left_offset` 등의 크기를 반영하여 뷰포트를 연산합니다.

---

## 4. 타당성 분석 및 한계점 대안 (Feasibility & Alternatives)

### A. 기성 도구(Marp, Pandoc) 대비 타당성
* **Marp**: PPTX 출력 시 모든 레이아웃을 이미지로 고정하여 텍스트 수정이 불가능하지만, 본 V2 엔진은 `pptxgenjs`를 직접 호출하여 실제 편집 가능한 파워포인트 객체로 변환하므로 비즈니스 협업 가치가 압도적으로 높습니다.
* **Pandoc**: 레이아웃 컴포넌트(2단 카드, 콘솔창 래퍼 등)의 시각적 형태를 변환할 수 없으나, V2의 숏코드 파서는 컴포넌트 구조를 분해하여 완벽한 UI 객체로 이식합니다.

### B. 시스템 비대화 방지 (Lightweight Constraints)
* 가상 브라우저 제어 라이브러리(Puppeteer, Playwright 등)를 본선 빌드 파이프라인에서 완전히 제외합니다.
* 파이썬 런타임 의존성을 차단하고, 100% 자바스크립트/Node.js 네이티브 패키지로 컴파일을 완결 지어 빌드 타임을 1초 미만으로 단축하고 디스크 용량 오버헤드를 예방합니다.

---

## 5. V2.0 개발 및 리팩토링 단계별 로드맵

1. **Phase 1: V2 폴더 구조 및 설정 격리 (`config/v2/`, `scripts/v2/` 뼈대 구축)**
   * V1.0 구동에 영향을 주지 않는 신규 V2 환경 디렉토리를 생성합니다.
2. **Phase 2: V2 디자인 지침 파서 및 layout.json 인터페이스 구현**
   * 디자인 지침 텍스트 파일 파싱을 통해 `config/v2/styles.json`을 자동 도출하는 도구를 구현합니다.
3. **Phase 3: PPTX 테마 XML 추출 및 Raw PPTX 테마 복제 엔진 개발**
   * `adm-zip`과 XML 파서를 연계해 특정 PPTX의 `theme1.xml`에서 스타일을 추출 및 주입하는 파이프라인을 작성합니다.
4. **Phase 4: 에디터 미리보기 연동 및 정합성 테스트**
   * `/converter.html` 화면 상에 V2 테마와 숏코드 연동 옵션을 탭으로 확장하고, V1.0 과의 호환 충돌이 없는지 유닛 테스트로 검증합니다.
