---
title: "Creative Spark 숏코드 쇼케이스"
subtitle: "현재 등록된 숏코드의 입력 문법과 HTML/PPTX 구현 결과를 함께 확인하는 레퍼런스"
badge: "Shortcode Reference · v1.3"
style: "ai-chat"
stats:
  - value: "24종"
    label: "지원 숏코드"
  - value: "7대"
    label: "표준 입력 키"
  - value: "HTML/PPTX"
    label: "동시 변환"
  - value: "cols=N"
    label: "그리드 단수 제어"
---

# 현재 지원 숏코드 목록

| 분류 | 숏코드 |
| --- | --- |
| 기본 카드/그리드 | `icon-grid`, `feature-grid`, `badge-grid`, `stat-grid`, `columns-grid` |
| 도구/기능 소개 | `tool-box`, `skill-list`, `bottom-list` |
| 절차/흐름 | `workflow-strip`, `step-list`, `git-flow-strip` |
| 비교/플랜 | `compare-grid`, `compare-split`, `plan-grid` |
| 알림/명령/콘솔 | `alert-box`, `cmd-box`, `console-box` |
| 인터랙션/목록 | `os-tabs`, `faq-list` |
| 특화 시각화 | `editor-box`, `network-box` |

# 숏코드 표준 입력 키

| 키 | 용도 | 비고 |
| --- | --- | --- |
| `icon` | 아이콘, 수치, 짧은 시각 라벨 | 이모지 또는 짧은 문자열 |
| `title` | 카드/항목 제목 | 필수에 가까운 기본 키 |
| `desc` | 본문 설명 또는 코드 | 여러 줄은 `desc: |` 사용 |
| `tag` | 배지, 상태, 언어 라벨 | 플랜명, 추천, OS명 등에 사용 |
| `meta` | 추가 목록, 칩, 피처 리스트 | `|`로 여러 항목 구분 |
| `color` | 개별 강조색 | Hex 색상 권장 |
| `note` | 하단 노트, 결론, CTA 배지 | `compare-grid`, `columns-grid`, `compare-split`, `plan-grid`에서 특히 유효 |

숏코드별 예약 키도 일부 존재합니다. `featured`는 `plan-grid`의 추천 플랜 강조에 사용하고, `alert-box`는 선언부의 `tip`, `warn`, `success`, `danger` 타입을 읽습니다.

# 1. icon-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `icon-grid` |
| 구현내용 | 아이콘 중심의 기본 카드 그리드. 핵심 기능, 사용 사례, 장점 목록에 적합합니다. |

숏코드 입력내용

```md
\::: icon-grid cols=3
- icon: "⚡"
  title: "빠른 작업"
  desc: "반복 작업을 줄이고 결과물을 빠르게 만듭니다."
- icon: "🎨"
  title: "쉬운 디자인"
  desc: "템플릿과 프리셋으로 초보자도 보기 좋은 결과를 만들 수 있습니다."
- icon: "🤝"
  title: "팀 협업"
  desc: "링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다."
\:::
```

::: icon-grid cols=3
- icon: "⚡"
  title: "빠른 작업"
  desc: "반복 작업을 줄이고 결과물을 빠르게 만듭니다."
- icon: "🎨"
  title: "쉬운 디자인"
  desc: "템플릿과 프리셋으로 초보자도 보기 좋은 결과를 만들 수 있습니다."
- icon: "🤝"
  title: "팀 협업"
  desc: "링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다."
:::

# 2. feature-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `feature-grid` |
| 구현내용 | 상단 태그와 제목이 강조되는 설명형 기능 카드입니다. |

숏코드 입력내용

```md
\::: feature-grid cols=3
- icon: "🧠"
  title: "AI 자동화"
  tag: "핵심"
  desc: "입력 자료를 바탕으로 초안, 편집, 요약을 자동 생성합니다."
  color: "#6366F1"
- icon: "🧰"
  title: "템플릿 활용"
  tag: "실전"
  desc: "자주 쓰는 형식을 저장해 같은 품질의 결과물을 반복 제작합니다."
  color: "#10B981"
- icon: "🔗"
  title: "링크 배포"
  tag: "공유"
  desc: "완성된 결과를 링크나 파일로 공유하고 피드백을 받을 수 있습니다."
  color: "#F59E0B"
\:::
```

::: feature-grid cols=3
- icon: "🧠"
  title: "AI 자동화"
  tag: "핵심"
  desc: "입력 자료를 바탕으로 초안, 편집, 요약을 자동 생성합니다."
  color: "#6366F1"
- icon: "🧰"
  title: "템플릿 활용"
  tag: "실전"
  desc: "자주 쓰는 형식을 저장해 같은 품질의 결과물을 반복 제작합니다."
  color: "#10B981"
- icon: "🔗"
  title: "링크 배포"
  tag: "공유"
  desc: "완성된 결과를 링크나 파일로 공유하고 피드백을 받을 수 있습니다."
  color: "#F59E0B"
:::

# 3. badge-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `badge-grid` |
| 구현내용 | 작은 서비스/기능 배지를 조밀하게 나열합니다. |

숏코드 입력내용

```md
\::: badge-grid cols=4
- icon: "🧪"
  title: "테스트"
  tag: "Vitest"
- icon: "📦"
  title: "빌드"
  tag: "Vite"
- icon: "🎞"
  title: "슬라이드"
  tag: "PPTX"
- icon: "🌐"
  title: "웹"
  tag: "HTML"
\:::
```

::: badge-grid cols=4
- icon: "🧪"
  title: "테스트"
  tag: "Vitest"
- icon: "📦"
  title: "빌드"
  tag: "Vite"
- icon: "🎞"
  title: "슬라이드"
  tag: "PPTX"
- icon: "🌐"
  title: "웹"
  tag: "HTML"
:::

# 4. stat-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `stat-grid` |
| 구현내용 | 수치와 짧은 설명을 강조하는 통계 카드입니다. |

숏코드 입력내용

```md
\::: stat-grid cols=3
- icon: "21종"
  title: "숏코드"
  desc: "현재 빌더가 렌더링하는 컴포넌트 수"
- icon: "2종"
  title: "출력"
  desc: "HTML과 PPTX를 같은 MD에서 생성"
- icon: "6개"
  title: "표준 키"
  desc: "icon, title, desc, tag, meta, color"
\:::
```

::: stat-grid cols=3
- icon: "21종"
  title: "숏코드"
  desc: "현재 빌더가 렌더링하는 컴포넌트 수"
- icon: "2종"
  title: "출력"
  desc: "HTML과 PPTX를 같은 MD에서 생성"
- icon: "6개"
  title: "표준 키"
  desc: "icon, title, desc, tag, meta, color"
:::

# 5. tool-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `tool-box` |
| 구현내용 | 색상 헤더와 피처 목록을 가진 도구 소개 카드입니다. |

숏코드 입력내용

```md
\::: tool-box
- icon: "💬"
  title: "ChatGPT"
  desc: "OpenAI의 대화형 AI 어시스턴트"
  tag: "무료/Pro"
  meta: "텍스트 생성|파일 분석|이미지 생성|코드 실행"
  color: "#10A37F"
- icon: "💻"
  title: "Cursor"
  desc: "AI 코드 에디터"
  tag: "Pro"
  meta: "코드베이스 인덱싱|멀티 파일 편집|자동완성"
  color: "#2563EB"
\:::
```

::: tool-box
- icon: "💬"
  title: "ChatGPT"
  desc: "OpenAI의 대화형 AI 어시스턴트"
  tag: "무료/Pro"
  meta: "텍스트 생성|파일 분석|이미지 생성|코드 실행"
  color: "#10A37F"
- icon: "💻"
  title: "Cursor"
  desc: "AI 코드 에디터"
  tag: "Pro"
  meta: "코드베이스 인덱싱|멀티 파일 편집|자동완성"
  color: "#2563EB"
:::

# 6. workflow-strip

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `workflow-strip` |
| 구현내용 | 아이콘과 화살표로 이어지는 가로 흐름도입니다. |

숏코드 입력내용

```md
\::: workflow-strip
- icon: "💡"
  title: "아이디어"
  meta: "요구사항 정리"
- icon: "⚡"
  title: "초안"
  meta: "AI 생성"
- icon: "✅"
  title: "검토"
  meta: "사람 확인"
- icon: "📤"
  title: "배포"
  meta: "HTML/PPTX"
\:::
```

::: workflow-strip
- icon: "💡"
  title: "아이디어"
  meta: "요구사항 정리"
- icon: "⚡"
  title: "초안"
  meta: "AI 생성"
- icon: "✅"
  title: "검토"
  meta: "사람 확인"
- icon: "📤"
  title: "배포"
  meta: "HTML/PPTX"
:::

# 7. step-list

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `step-list` |
| 구현내용 | 번호가 붙는 세로 단계 리스트입니다. |

숏코드 입력내용

```md
\::: step-list
- title: "MD 작성"
  desc: "표준 키와 숏코드로 콘텐츠를 작성합니다."
- title: "HTML 빌드"
  desc: "build-guide.mjs로 가이드 HTML을 생성합니다."
- title: "PPTX 빌드"
  desc: "md-to-pptx.mjs로 발표 자료를 생성합니다."
\:::
```

::: step-list
- title: "MD 작성"
  desc: "표준 키와 숏코드로 콘텐츠를 작성합니다."
- title: "HTML 빌드"
  desc: "build-guide.mjs로 가이드 HTML을 생성합니다."
- title: "PPTX 빌드"
  desc: "md-to-pptx.mjs로 발표 자료를 생성합니다."
:::

# 8. compare-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `compare-grid` |
| 구현내용 | 여러 선택지를 카드로 비교합니다. `note`가 있으면 하단 노트로 우선 표시하고, 없으면 `meta`를 노트처럼 표시합니다. |

숏코드 입력내용

```md
\::: compare-grid cols=2
- title: "수동 HTML"
  desc: "표현 자유도는 높지만 유지보수와 PPTX 변환이 어렵습니다."
  note: "디자인 고정이 필요한 특수 페이지에 적합"
  color: "#EF4444"
- title: "숏코드 MD"
  desc: "표준 입력만으로 HTML과 PPTX를 동시에 생성할 수 있습니다."
  note: "가이드와 교육 자료에 적합"
  color: "#10B981"
\:::
```

::: compare-grid cols=2
- title: "수동 HTML"
  desc: "표현 자유도는 높지만 유지보수와 PPTX 변환이 어렵습니다."
  note: "디자인 고정이 필요한 특수 페이지에 적합"
  color: "#EF4444"
- title: "숏코드 MD"
  desc: "표준 입력만으로 HTML과 PPTX를 동시에 생성할 수 있습니다."
  note: "가이드와 교육 자료에 적합"
  color: "#10B981"
:::

# 9. plan-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `plan-grid` |
| 구현내용 | 요금제, 모델 등급, 옵션 비교에 쓰는 플랜 카드입니다. |

숏코드 입력내용

```md
\::: plan-grid cols=3
- title: "Free"
  tag: "무료"
  meta: "기본 기능|일일 제한|커뮤니티 지원"
  note: "지금 시작"
- title: "Pro"
  tag: "추천"
  meta: "무제한 사용|고급 기능|우선 지원"
  note: "$20 / 월"
  featured: "true"
  color: "#6366F1"
- title: "Team"
  tag: "팀"
  meta: "권한 관리|공유 워크스페이스|관리자 콘솔"
  note: "문의"
\:::
```

::: plan-grid cols=3
- title: "Free"
  tag: "무료"
  meta: "기본 기능|일일 제한|커뮤니티 지원"
  note: "지금 시작"
- title: "Pro"
  tag: "추천"
  meta: "무제한 사용|고급 기능|우선 지원"
  note: "$20 / 월"
  featured: "true"
  color: "#6366F1"
- title: "Team"
  tag: "팀"
  meta: "권한 관리|공유 워크스페이스|관리자 콘솔"
  note: "문의"
:::

# 10. skill-list

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `skill-list` |
| 구현내용 | 기능이나 역량을 행 형태로 나열합니다. |

숏코드 입력내용

```md
\::: skill-list
- icon: "📄"
  title: "문서 자동화"
  desc: "보고서와 제안서를 빠르게 생성합니다."
- icon: "🔗"
  title: "API 연동"
  desc: "기존 시스템과 데이터를 연결합니다."
- icon: "📊"
  title: "분석 대시보드"
  desc: "실시간 데이터를 시각화합니다."
\:::
```

::: skill-list
- icon: "📄"
  title: "문서 자동화"
  desc: "보고서와 제안서를 빠르게 생성합니다."
- icon: "🔗"
  title: "API 연동"
  desc: "기존 시스템과 데이터를 연결합니다."
- icon: "📊"
  title: "분석 대시보드"
  desc: "실시간 데이터를 시각화합니다."
:::

# 11. columns-grid

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `columns-grid` |
| 구현내용 | 일반 본문, 짧은 코드, 체크 항목을 균등한 다단 카드로 보여줍니다. |

숏코드 입력내용

```md
\::: columns-grid cols=3
- title: "HTML"
  desc: "웹 가이드로 바로 열람합니다."
  note: "node templates/build-guide.mjs guide.md"
- title: "PPTX"
  desc: "발표 슬라이드로 변환합니다."
  note: "node scripts/md-to-pptx.mjs guide.md"
- title: "Standalone"
  desc: "전체 가이드를 단일 HTML로 묶습니다."
  note: "npm run build:standalone"
\:::
```

::: columns-grid cols=3
- title: "HTML"
  desc: "웹 가이드로 바로 열람합니다."
  note: "node templates/build-guide.mjs guide.md"
- title: "PPTX"
  desc: "발표 슬라이드로 변환합니다."
  note: "node scripts/md-to-pptx.mjs guide.md"
- title: "Standalone"
  desc: "전체 가이드를 단일 HTML로 묶습니다."
  note: "npm run build:standalone"
:::

# 12. bottom-list

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `bottom-list` |
| 구현내용 | 본문 설명 아래에 여러 칩을 붙이는 요약 카드입니다. |

숏코드 입력내용

```md
\::: bottom-list
- title: "핵심 요약"
  desc: "숏코드 MD는 콘텐츠와 표현을 분리하여 반복 제작을 쉽게 만듭니다."
  meta: "HTML 자동 생성|PPTX 자동 생성|표준 키 사용|재사용 가능"
\:::
```

::: bottom-list
- title: "핵심 요약"
  desc: "숏코드 MD는 콘텐츠와 표현을 분리하여 반복 제작을 쉽게 만듭니다."
  meta: "HTML 자동 생성|PPTX 자동 생성|표준 키 사용|재사용 가능"
:::

# 13. compare-split

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `compare-split` |
| 구현내용 | before/after 또는 양자 비교를 2열로 강조합니다. |

숏코드 입력내용

```md
\::: compare-split
- title: "Before"
  meta: "HTML 직접 편집|디자인은 자유롭지만 유지보수 어려움"
  note: "수동 관리"
- title: "After"
  meta: "숏코드 입력|HTML/PPTX 동시 생성|재사용 쉬움"
  note: "자동 파이프라인"
\:::
```

::: compare-split
- title: "Before"
  meta: "HTML 직접 편집|디자인은 자유롭지만 유지보수 어려움"
  note: "수동 관리"
- title: "After"
  meta: "숏코드 입력|HTML/PPTX 동시 생성|재사용 쉬움"
  note: "자동 파이프라인"
:::

# 14. alert-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `alert-box` |
| 구현내용 | `tip`, `warn`, `success`, `danger` 타입을 가진 알림 박스입니다. |

숏코드 입력내용

```md
\::: alert-box tip
- title: "작성 팁"
  desc: "긴 본문은 desc: | 멀티라인 블록으로 작성하세요."
\:::

\::: alert-box warn
- title: "주의"
  desc: "들여쓰기가 틀어지면 숏코드 파서가 항목을 잘못 읽을 수 있습니다."
\:::
```

::: alert-box tip
- title: "작성 팁"
  desc: "긴 본문은 desc: | 멀티라인 블록으로 작성하세요."
:::

::: alert-box warn
- title: "주의"
  desc: "들여쓰기가 틀어지면 숏코드 파서가 항목을 잘못 읽을 수 있습니다."
:::

# 15. cmd-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `cmd-box` |
| 구현내용 | 복사 버튼이 있는 터미널 명령어 블록입니다. |

숏코드 입력내용

```md
\::: cmd-box
- title: "HTML 빌드"
  tag: "bash"
  desc: "node templates/build-guide.mjs md_src/showcase/showcase.md public/showcase/showcase.html"
\:::
```

::: cmd-box
- title: "HTML 빌드"
  tag: "bash"
  desc: "node templates/build-guide.mjs md_src/showcase/showcase.md public/showcase/showcase.html"
:::

# 16. os-tabs

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `os-tabs` |
| 구현내용 | 탭 버튼으로 여러 설치법이나 플랫폼별 설명을 전환합니다. |

숏코드 입력내용

````md
\::: os-tabs
- title: "macOS"
  desc: |
    #### 터미널 설치
    ```bash
    brew install node
    ```
- title: "Windows"
  desc: |
    #### PowerShell 설치
    ```powershell
    winget install OpenJS.NodeJS
    ```
\:::
````

::: os-tabs
- title: "macOS"
  desc: |
    #### 터미널 설치
    ```bash
    brew install node
    ```
- title: "Windows"
  desc: |
    #### PowerShell 설치
    ```powershell
    winget install OpenJS.NodeJS
    ```
:::

# 17. faq-list

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `faq-list` |
| 구현내용 | 클릭해 펼치는 FAQ 아코디언입니다. |

숏코드 입력내용

```md
\::: faq-list
- title: "PPTX 변환도 같은 MD를 쓰나요?"
  desc: "네. 같은 숏코드 입력을 HTML과 PPTX 렌더러가 함께 사용합니다."
- title: "HTML을 직접 넣어야 하나요?"
  desc: "아니요. 쇼케이스와 가이드는 숏코드 문법으로 작성하는 것이 원칙입니다."
\:::
```

::: faq-list
- title: "PPTX 변환도 같은 MD를 쓰나요?"
  desc: "네. 같은 숏코드 입력을 HTML과 PPTX 렌더러가 함께 사용합니다."
- title: "HTML을 직접 넣어야 하나요?"
  desc: "아니요. 쇼케이스와 가이드는 숏코드 문법으로 작성하는 것이 원칙입니다."
:::

# 18. console-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `console-box` |
| 구현내용 | 프롬프트나 콘솔 출력 예시를 어두운 박스로 보여줍니다. |

숏코드 입력내용

```md
\::: console-box
- title: "가이드 생성 요청"
  desc: |
    Obsidian 가이드를 작성해줘.
    network-box로 지식 그래프 예시를 포함하고,
    마지막에는 faq-list를 넣어줘.
\:::
```

::: console-box
- title: "가이드 생성 요청"
  desc: |
    Obsidian 가이드를 작성해줘.
    network-box로 지식 그래프 예시를 포함하고,
    마지막에는 faq-list를 넣어줘.
:::

# 19. git-flow-strip

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `git-flow-strip` |
| 구현내용 | 브랜치 라인과 커밋 라벨을 가진 Git 흐름도입니다. |

숏코드 입력내용

```md
\::: git-flow-strip
- title: "main"
  tag: "v1.1.0"
  meta: "쇼케이스 MD 정리|HTML/PPTX 변환 통과"
  color: "#10B981"
- title: "feature/restore-md"
  tag: "Commit 701"
  meta: "원본 콘텐츠 복원|신형 숏코드 반영"
  color: "#3B82F6"
\:::
```

::: git-flow-strip
- title: "main"
  tag: "v1.1.0"
  meta: "쇼케이스 MD 정리|HTML/PPTX 변환 통과"
  color: "#10B981"
- title: "feature/restore-md"
  tag: "Commit 701"
  meta: "원본 콘텐츠 복원|신형 숏코드 반영"
  color: "#3B82F6"
:::

# 20. editor-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `editor-box` |
| 구현내용 | VS Code 느낌의 코드 편집기 시뮬레이션입니다. |

숏코드 입력내용

````md
\::: editor-box
- title: "build-guide.mjs"
  tag: "javascript"
  desc: |
    function renderShortcode(type, body, args) {
      const items = parseShortcodeItems(body);
      if (!items.length) return "";
      return renderComponent(type, items, args);
    }
\:::
````

::: editor-box
- title: "build-guide.mjs"
  tag: "javascript"
  desc: |
    function renderShortcode(type, body, args) {
      const items = parseShortcodeItems(body);
      if (!items.length) return "";
      return renderComponent(type, items, args);
    }
:::

# 21. network-box

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `network-box` |
| 구현내용 | 중앙 노드와 주변 노드가 떠 있는 지식 그래프 시각화입니다. |

숏코드 입력내용

```md
\::: network-box
- title: "Creative Spark"
  color: "#EC4899"
- title: "HTML"
  meta: "build-guide"
  color: "#10B981"
- title: "PPTX"
  meta: "md-to-pptx"
  color: "#3B82F6"
- title: "Markdown"
  meta: "shortcode"
  color: "#F59E0B"
\:::
```

::: network-box
- title: "Creative Spark"
  color: "#EC4899"
- title: "HTML"
  meta: "build-guide"
  color: "#10B981"
- title: "PPTX"
  meta: "md-to-pptx"
  color: "#3B82F6"
- title: "Markdown"
  meta: "shortcode"
  color: "#F59E0B"
:::

# 22. part-deck

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `part-deck` |
| 구현내용 | 시리즈 가이드북 등 목차용 대단원(부, Part)을 알리는 헤더 숏코드입니다. HSL 브랜드 컬러가 다이내믹하게 적용됩니다. |

숏코드 입력내용

```md
\::: part-deck
- icon: "1부"
  title: "개념 이해"
  desc: "바이브코딩과 에이전트 코딩의 작동 원리"
  tag: "Ch.01–03"
  color: "#1a3a5c"
- icon: "2부"
  title: "AI와 대화하는 법"
  desc: "프롬프트 설계부터 복잡한 작업 위임까지"
  tag: "Ch.04–05"
  color: "#1a4a3a"
\:::
```

::: part-deck
- icon: "1부"
  title: "개념 이해"
  desc: "바이브코딩과 에이전트 코딩의 작동 원리"
  tag: "Ch.01–03"
  color: "#1a3a5c"
- icon: "2부"
  title: "AI와 대화하는 법"
  desc: "프롬프트 설계부터 복잡한 작업 위임까지"
  tag: "Ch.04–05"
  color: "#1a4a3a"
:::

# 23. chapter-list

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `chapter-list` |
| 구현내용 | 세부 목차 및 챕터 리스트 숏코드입니다. 챕터 번호와 뱃지 속성에 따라 이쁜 HSL 배지 색상이 자동 매핑됩니다. |

숏코드 입력내용

```md
\::: chapter-list
- icon: "01"
  title: "바이브코딩이란?"
  desc: "Karpathy 발언 배경 · 전통 코딩 vs 바이브코딩 · LLM 발전"
  tag: "개념"
- icon: "02"
  title: "에이전트 코딩이란?"
  desc: "계획→실행→수정 루프 · 레벨 1~5 스펙트럼 · 바이브코딩과 차이"
  tag: "개념"
- icon: "04"
  title: "첫 대화: 프롬프트 설계"
  desc: "요구사항 명세 · 컨텍스트 주입 전략 · SKILL.md 재사용 지시"
  tag: "실습"
\:::
```

::: chapter-list
- icon: "01"
  title: "바이브코딩이란?"
  desc: "Karpathy 발언 배경 · 전통 코딩 vs 바이브코딩 · LLM 발전"
  tag: "개념"
- icon: "02"
  title: "에이전트 코딩이란?"
  desc: "계획→실행→수정 루프 · 레벨 1~5 스펙트럼 · 바이브코딩과 차이"
  tag: "개념"
- icon: "04"
  title: "첫 대화: 프롬프트 설계"
  desc: "요구사항 명세 · 컨텍스트 주입 전략 · SKILL.md 재사용 지시"
  tag: "실습"
:::

# 24. summary-bar

| 항목 | 내용 |
| --- | --- |
| 숏코드 명 | `summary-bar` |
| 구현내용 | 숏코드 문서들의 통계, 주요 수치 등을 가로 격자 형태로 요약 노출해 주는 수치 뱃지 숏코드입니다. |

숏코드 입력내용

```md
\::: summary-bar
- icon: "29장"
  title: "Total Chapters"
- icon: "8부"
  title: "Parts"
- icon: "24종"
  title: "Support Shortcodes"
\:::
```

::: summary-bar
- icon: "29장"
  title: "Total Chapters"
- icon: "8부"
  title: "Parts"
- icon: "24종"
  title: "Support Shortcodes"
:::
