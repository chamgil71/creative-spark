# Creative Spark 숏코드 구성 및 디자인 참고 파일 (Reference)

본 레퍼런스 파일은 AI나 테크니컬 라이터가 마크다운 가이드를 작성할 때, 필요한 숏코드를 즉시 복사하여 본문에 붙여넣어 편집(Copy-Paste & Edit)할 수 있는 **6대 표준 키 기반의 숏코드 종류별 완벽한 정석 마크업 템플릿 세트**입니다.

---

## 1. 6대 표준 키 매핑 규칙 (Universal Fields)

모든 숏코드 내부 아이템의 리스트 프로퍼티는 오직 아래 6개 필드명으로만 선언하며, YAML 들여쓰기 4칸 규칙을 엄격히 준수합니다.

* `- icon`: 항목에 어울리는 대표 이모지 1개
* `  title`: 카드 제목 / 라벨 / 대제목
* `  desc`: 상세 본문 또는 코드 예제 (여러 줄 개행이 필요한 경우 `desc: |` 멀티라인 리터럴 선언)
* `  tag`: 상단 고정 칩 배지 강조 문구
* `  meta`: 추가 속성 또는 파이프(`|`) 기호로 구분된 상세 피처 리스트
* `  color`: 강조 테두리 및 뱃지용 테마 헥스 컬러 (예: `"#6366F1"`)

---

## 2. 3대 동적 시각화 특화 숏코드 템플릿

### 1) Obsidian 지식 그래프 (`network-box`)
중앙의 거대한 코어 노드를 중심으로 반투명 위성 노드들이 부유하듯 부드럽게 흘러 다니는 몽환적인 drift 인터랙션 효과를 연출합니다.
```md
::: network-box
- title: "중앙 코어 노드 (첫 번째에 배치)"
  color: "#EC4899"
- title: "위성 노드 A (두 번째부터 배치)"
  meta: "Sub Topic A"
  color: "#10B981"
- title: "위성 노드 B"
  meta: "Sub Topic B"
  color: "#3B82F6"
- title: "위성 노드 C"
  meta: "Sub Topic C"
  color: "#F59E0B"
:::
```

### 2) VS Code 가상 에디터 시뮬레이터 (`editor-box`)
VS Code 모양의 어두운 개발 환경 UI, 활성 파일 탭 및 좌측 `.line-nums` 행 번호가 자동 부여되는 가상 소스 코드 창을 렌더링합니다.
```md
::: editor-box
- title: "app.js"
  tag: "javascript"
  desc: |
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello Creative Spark!');
    });
    server.listen(3000);
:::
```

### 3) GitHub 브랜치 커밋 로그 흐름도 (`git-flow`)
깃허브 터미널 형식의 어두운 트랙에 지선 브랜치 및 동그란 커밋 로그 트리를 그리고, 마우스 호버 시 상세 커밋 피처 리스트를 팝오버로 구현합니다.
```md
::: git-flow
- title: "main"
  tag: "v1.1.0"
  meta: "배포 파이프라인 무결함 빌드 완수|guides.json 공식 통합 완료"
  color: "#10B981"
- title: "feature/visuals"
  tag: "Commit 701"
  meta: "둥둥 지식 그래프 drift 애니메이션 완비|VS Code 에디터 창 라인 넘버러 구현 완료"
  color: "#3B82F6"
:::
```

---

## 3. 5대 가로 다단 격자형 숏코드 템플릿 (cols=N 인수 지정)

그리드형 카드의 단수를 칼각으로 강제 통제하고자 할 때 `cols=3` 또는 `cols=4` 옵션을 숏코드 선언부 옆에 정확히 기재합니다.

### 1) 가격 / 플랜 비교 카드 (`plan-grid`)
```md
::: plan-grid cols=3
- title: "Free 플랜"
  tag: "체험형"
  meta: "기본 숏코드 12종 지원|하루 10회 컴파일 빌드"
  desc: "비용 없음"
- title: "Spark Pro"
  tag: "추천"
  meta: "3대 특화 숏코드 100% 지원|cols=N 가변 격자 제어|프리미엄 10대 HSL 테마"
  desc: "$9.99 / 월"
  featured: "true"
  color: "#6366F1"
- title: "Enterprise"
  tag: "기업용"
  meta: "무제한 전용 빌더 배치|독점 비주얼 커스텀|SLA 업타임 보증"
  desc: "별도 문의"
  color: "#1E293B"
:::
```

### 2) 대표 기능 / 강점 정의 카드 (`feature-grid`)
```md
::: feature-grid cols=3
- icon: "⚡"
  title: "초고속 렌더링"
  tag: "성능"
  desc: "Vite 및 React 번들링 파이프라인 가동으로 0.1초 만에 빌드"
  color: "#EBF2FF"
- icon: "🔒"
  title: "철통 보안"
  tag: "보안"
  desc: "로컬 샌드박스 보안 격리로 안전한 데이터 오프라인 병합 수행"
  color: "#F0FDF4"
- icon: "📦"
  title: "스탠드얼론"
  tag: "배포"
  desc: "1.3MB 크기의 전천후 단일 HTML 번들 파일로 가볍게 무설치 구동"
  color: "#FDF4FF"
:::
```

### 3) 비교 분석 / 메모 카드 (`compare-grid`)
```md
::: compare-grid cols=2
- title: "자체 구축 On-Premise"
  desc: "모든 소스 코드와 데이터를 로컬 사내 인프라 내에 격리하여 강력한 주권을 행사합니다."
  meta: "기술 역량을 갖춘 전담팀이 존재할 때 강력 추천"
  color: "#3B82F6"
- title: "클라우드 SaaS 서비스"
  desc: "별도 인프라 비용 없이 가입 즉시 사용하며, 자동 패치 및 매끄러운 링크 배포가 가능합니다."
  meta: "빠르고 유연하게 비즈니스를 가동하고자 할 때 추천"
  color: "#10B981"
:::
```

### 4) 범용 본문 / 코드 다단 격자 카드 (`columns-grid`)
```md
::: columns-grid cols=3
- title: "기본 설치 명령어"
  desc: "컴파일러 모듈을 설치합니다."
  meta: "npm install -g creative-spark"
- title: "HTML 빌드 명령어"
  desc: "마크다운을 HTML로 컴파일합니다."
  meta: "node scripts/build-guide.mjs md_src/guides/showcase.md"
- title: "PPTX 빌드 명령어"
  desc: "마크다운을 슬라이드로 컴파일합니다."
  meta: "node scripts/md-to-pptx.mjs md_src/guides/showcase.md"
:::
```

### 5) 통계 지표 / 넘버 하이라이트 카드 (`stat-grid`)
```md
::: stat-grid cols=3
- icon: "18종"
  title: "표준 숏코드"
  desc: "Creative Spark가 지원하는 컴포넌트 전체 개수"
- icon: "95%"
  title: "제작 단축"
  desc: "수동 HTML 하드코딩 대비 가이드 문서 제작 시간의 기적적인 단축 비율"
- icon: "0개"
  title: "빌드 에러"
  desc: "파이프라인 컴파일 전수 검증 시 통과한 경고 및 깨짐 에러 개수"
:::
```

---

## 4. 세로 목록형 및 기타 표준 숏코드 템플릿

### 1) 세로형 번호 단계 리스트 (`step-list`)
```md
::: step-list
- title: "가이드 마크다운 작성"
  desc: "docs/prompt 지침에 따라 6대 표준 키와 숏코드를 활용해 md_src/guides/ 아래에 가이드를 작성합니다."
  color: "#6366F1"
- title: "HTML 및 PPTX 동시 컴파일"
  desc: "빌드 스크립트를 구동하여 무결점 HTML 가이드와 슬라이드 장표를 동시에 안전하게 변환 빌드합니다."
  color: "#10B981"
- title: "guides.json 설정 갱신 및 릴리즈"
  desc: "src/data/guides.json에 공식 기재하여 standalone.html에 100% 무결하게 자동 병합 릴리즈합니다."
  color: "#F59E0B"
:::
```

### 2) 도구 정보 및 스펙 통합 카드 (`tool-list`)
```md
::: tool-list
- icon: "💬"
  title: "ChatGPT"
  desc: "OpenAI의 대표적인 대화형 AI 챗봇"
  tag: "무료/Pro"
  meta: "GPT-4o 추론|커스텀 GPTs 지원|실시간 웹 브라우징 기능 제공"
  color: "#10A37F"
- icon: "💻"
  title: "Cursor"
  desc: "개발자의 손을 빠르게 하는 대표적인 AI 코드 에디터"
  tag: "Pro 구독"
  meta: "Composer 다중 파일 편집|자연어 코드 자동완성|로컬 코드베이스 실시간 인덱싱"
  color: "#D97757"
:::
```

### 3) 가로 흐름 순서도 (`workflow-flow`)
```md
::: workflow-flow
- icon: "⌨"
  title: "입력 가동"
  meta: "claude 실행"
- icon: "🔑"
  title: "계정 인증"
  meta: "Authorize 허용"
- icon: "🔒"
  title: "세션 보안"
  meta: "로컬 키 동기화"
- icon: "🎉"
  title: "사용 완료"
  meta: "코딩 시작"
:::
```

### 4) 자주 묻는 질문 아코디언 목록 (`faq-list`)
```md
::: faq-list
- title: "무료로 사용이 가능한가요?"
  desc: "네, Creative Spark의 핵심 빌더 기능과 숏코드 12종은 완전히 무료로 자유롭게 사용이 가능합니다."
- title: "PPTX 변환 시 슬라이드가 깨지지 않나요?"
  desc: "네, 3대 비주얼 특화 숏코드는 파워포인트 컴파일러 내부에서 정해진 카드 및 흐름도 레이아웃으로 안전하게 100% 자동 우회 변환되어 슬라이드 글자 깨짐 및 크래시 현상을 완벽 차단합니다."
:::
```

### 5) 탭 전환 패널 (`os-tabs`)
```md
::: os-tabs
- title: "macOS 설치"
  desc: |
    #### 1. 터미널을 실행합니다.
    * `Cmd + Space` -> Terminal 입력 후 엔터.
    #### 2. 설치 스크립트 실행
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
- title: "Windows 설치"
  desc: |
    #### 1. PowerShell을 실행합니다.
    * `Windows` 키 -> PowerShell 입력 후 클릭 실행.
    #### 2. 설치 스크립트 실행
    ```powershell
    irm https://claude.ai/install.ps1 | iex
    ```
:::
```

### 6) 팁/경고/성공/위험 알림 박스 (`alert-box`)
```md
::: alert-box tip
- title: "설치 전 핵심 체크"
  desc: "컴퓨터에 Node.js 18 이상 버전이 설치되어 있는지 반드시 먼저 확인하십시오."
:::

::: alert-box warn
- title: "YAML frontmatter 주의"
  desc: "프론트매터의 들여쓰기 4칸 및 문자열 포맷팅이 꼬이면 빌더 엔진에서 문법 크래시가 유발될 수 있습니다."
:::
```

### 7) 터미널 실행 명령어 박스 (`cmd-box`)
```md
::: cmd-box
- title: "수동 빌드 가이드"
  tag: "bash"
  desc: "node scripts/build-guide.mjs md_src/guides/showcase.md"
:::
```

### 8) 요점 정리 칩 카드 (`summary-box`)
```md
::: summary-box
- title: "이 숏코드 시스템의 차별점"
  desc: "단순히 지저분한 인라인 HTML을 하드코딩하지 않고, 의미 있는 6대 표준 키만 리스트로 적어주면 알아서 미려한 프리미엄 UI 카드로 전환해 준다는 강력한 아키텍처적 우위를 지닙니다."
  meta: "생산성 극대화|아름다운 프리미엄 HSL 테마|스탠드얼론 자동 병합|PPTX 발표 슬라이드 동시 추출"
:::
```

### 9) 프롬프트 시연 박스 (`console-box`)
```md
::: console-box
- title: "가이드 문서 생성 요청문"
  desc: "Obsidian 가이드 문서를 변환하되, 지식 그래프 시각화를 보여주기 위해 network-box 숏코드를 4개 아이템으로 반드시 포함해 주세요."
:::
```
