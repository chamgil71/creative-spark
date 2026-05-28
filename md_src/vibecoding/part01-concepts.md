---
title: "개념 이해"
subtitle: "바이브코딩과 에이전트 코딩의 정의, 작동 원리, MCP·Sub-agent·Hook·Memory — 4가지 핵심 원리까지"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

# 바이브코딩이란?

"There's a new kind of coding I call 'vibe coding', where you fully give in to the vibes, embrace exponentials, and forget that the code even exists."

— Andrej Karpathy (전 Tesla AI 총괄, OpenAI 공동창업자), 2025

바이브코딩(Vibe Coding)이란 코드의 세부 문법이나 알고리즘을 직접 작성하는 대신, AI에게 원하는 것을 자연어로 설명하고 AI가 생성한 코드를 검토·활용하는 개발 방식입니다. 코딩 문법보다 "무엇을 만들고 싶은지" 명확히 설명하는 능력이 핵심입니다.

### 전통 코딩 vs 바이브코딩

| 구분 | 전통 코딩 | 바이브코딩 |
| --- | --- | --- |
| **핵심 역량** | 문법·알고리즘·디버깅 | 요구사항 설명·결과 검증 |
| **작업 방식** | 직접 코드 작성 | AI에게 요청 → 결과 확인 |
| **필요 지식** | 프로그래밍 언어 필수 | 도메인 지식이 더 중요 |
| **속도** | 기능 1개에 수 시간 | 기능 1개에 수 분 |
| **리스크** | 버그를 내가 만듦 | AI 버그를 내가 못 잡을 수 있음 |

### 바이브코딩의 작동 흐름

::: flow
- icon: "🧑"
  title: "사람"
  desc: "원하는 것 설명"
  tag: "active"
- icon: "→"
  title: "→"
- icon: "🤖"
  title: "AI"
  desc: "코드 생성"
- icon: "→"
  title: "→"
- icon: "🧑"
  title: "사람"
  desc: "실행 및 검토"
  tag: "active"
- icon: "→"
  title: "→"
- icon: "🔄"
  title: "반복"
  desc: "수정 요청"
- icon: "→"
  title: "→"
- icon: "✅"
  title: "완성"
  desc: "결과물"
  tag: "active"
:::

::: icon-grid cols=2
- icon: "✅"
  title: "바이브코딩이 강한 상황"
  desc: |
    ✔️ 📄 반복 문서 작업 자동화
    ✔️ 📊 데이터 분석 프로토타입
    ✔️ 🔧 내부 업무 도구 빠른 제작
    ✔️ 🚀 아이디어 검증 (MVP)
- icon: "⚠️"
  title: "안티 패턴 — 이럴 때는 주의"
  desc: |
    ✔️ ❌ 코드를 검토하지 않고 실행
    ✔️ ❌ 보안이 중요한 시스템에 무검증 적용
    ✔️ ❌ "뭔가 자동화해줘" 추상적 요청
    ✔️ ❌ 오류 메시지 없이 "안 돼요" 보고
:::

::: alert-box tip
- title: "💡 비유:"
  desc: "바이브코딩은 건축 설계도를 직접 그리는 대신, 건축가(AI)에게 \"거실은 넓고 채광이 좋아야 한다\"고 설명하는 것과 같습니다. 설계 언어를 몰라도 원하는 집을 얻을 수 있지만, 무엇을 원하는지 명확히 알아야 합니다."
:::

::: alert-box warn
- title: "⚠️ 환각(Hallucination) 주의:"
  desc: "AI가 존재하지 않는 라이브러리나 함수를 사용하는 경우가 있습니다. 실행 전 \"이 코드에서 사용한 라이브러리가 실제로 존재하는지 확인해줘\"라고 재확인하는 습관이 중요합니다."
:::

::: takeaway
- icon: "💡"
  title: "Key Takeaway"
  desc: "바이브코딩은 코드를 쓰는 능력이 아니라 **원하는 것을 정확히 설명하는 능력**이 핵심인 새로운 개발 패러다임입니다."
:::

# 에이전트 코딩이란?

에이전트 코딩(Agentic Coding)이란 AI가 주어진 목표를 달성하기 위해 **계획 수립 → 도구 사용 → 실행 → 결과 검증 → 자기 수정**의 루프를 자율적으로 반복하는 개발 방식입니다. 사람은 목표와 방향을 제시하고, AI가 경로를 스스로 찾습니다.

### 바이브코딩 vs 에이전트 코딩

::: compare-split
- title: "💬 바이브코딩 (대화형)"
  desc: |
    사람 ──요청──→ AI
    AI ──코드──→ 사람
    사람 ──직접 실행
  note: "→ 단발성, 사람이 실행 주도"
- title: "🤖 에이전트 코딩 (자율형)"
  desc: |
    사람 ──목표──→ AI Agent
         ↓
    AI가 계획·실행·수정
         ↓
    사람 ──검토──→ 완료
  note: "→ 연속적, AI가 실행 주도"
:::

### 에이전트의 4가지 핵심 능력

::: icon-grid cols=2
- icon: "🗺️"
  title: "계획 수립 (Planning)"
  desc: "목표를 작은 단계로 분해하는 능력. DB에 저장해줘 → 파싱→정제→삽입→검증 순으로 자동 분해"
- icon: "🔧"
  title: "도구 사용 (Tool Use)"
  desc: "파일 읽기/쓰기, 터미널 실행, 웹 검색, API 호출 등 실제 컴퓨터 도구를 직접 사용"
- icon: "🔁"
  title: "자기 수정 (Self-correction)"
  desc: "오류 메시지를 읽고 스스로 코드를 수정하는 피드백 루프. 사람의 복사·붙여넣기가 사라짐"
- icon: "🧠"
  title: "컨텍스트 관리 (Memory)"
  desc: "긴 작업에서 앞서 수행한 결과를 기억하고 일관성 있게 다음 단계 처리"
:::

### 레벨 1~5 스펙트럼 — 어디까지 왔나

::: level-grid
- title: "LEVEL 1"
  desc: "코드 자동완성"
  meta: "GitHub Copilot 인라인"
  note: "다음 줄 예측, Tab으로 수락"
- title: "LEVEL 2"
  desc: "대화형 생성"
  meta: "Claude.ai, ChatGPT"
  note: "요청 → 붙여넣기 → 실행"
- title: "LEVEL 3"
  desc: "파일 단위 에이전트"
  meta: "Cursor, Windsurf"
  note: "수정 요청, 승인 방식"
  tag: "highlight"
- title: "LEVEL 4"
  desc: "프로젝트 단위"
  meta: "Claude Code, Codex CLI"
  note: "목표 제시, 결과 검토"
  tag: "highlight"
- title: "LEVEL 5"
  desc: "완전 자율"
  meta: "Devin, SWE-agent"
  note: "목표만 제시"
:::

::: alert-box tip
- title: "💡 실무 권장:"
  desc: "2026년 현재 가장 많이 쓰이는 구간은 레벨 3~4입니다. 레벨 5는 기술적으로 가능하지만, 중요한 프로젝트에서는 중간 검수 포인트를 유지하는 레벨 4 방식이 더 안전하고 효율적입니다."
:::

::: alert-box warn
- title: "⚠️ 에이전트 실행 전 필수:"
  desc: "AI가 파일을 직접 수정합니다. 반드시 `git add . && git commit -m \"백업\"` 후 실행하세요. 잘못된 수정도 즉시 되돌릴 수 있습니다."
:::

::: takeaway
- icon: "💡"
  title: "Key Takeaway"
  desc: "에이전트 코딩은 AI에게 \"코드 한 줄\"이 아닌 **\"목표 하나\"를 주는 방식**으로, 계획·실행·수정의 전 과정을 AI가 자율적으로 처리합니다."
:::

# 에이전트 작동 원리 — MCP / Sub-agent / Hook / Memory

현대 AI 에이전트는 단순히 텍스트를 생성하는 것을 넘어 실제 세계의 도구와 시스템에 연결됩니다. 이를 가능하게 하는 4가지 핵심 원리를 해부합니다.

| 원리 | 한 줄 정의 | 비유 |
| --- | --- | --- |
| **MCP** | AI가 외부 도구를 표준 방식으로 호출하는 규약 | 모든 가전을 연결하는 USB 표준 콘센트 |
| **Sub-agent** | 큰 작업을 여러 AI가 분담 처리하는 구조 | 팀장이 팀원들에게 업무를 배분하는 것 |
| **Hook** | 특정 사건 발생 시 에이전트를 자동 실행하는 트리거 | 초인종이 울리면 카메라가 자동 켜지는 것 |
| **Memory** | 에이전트가 이전 작업을 기억하고 활용하는 능력 | 업무 인수인계 문서 |

::: icon-grid cols=2
- icon: "🔌"
  title: "MCP (Model Context Protocol)"
  desc: |
    ✔️ Anthropic이 2024년 발표한 오픈 표준 규약
    ✔️ AI 모델이 외부 도구·데이터·서비스를 일관된 방식으로 연결
    ✔️ 연결 가능: 파일시스템, GitHub, Notion, Google Drive, Slack, Supabase
- icon: "👥"
  title: "Sub-agent (서브에이전트)"
  desc: |
    ✔️ 주 에이전트가 세부 작업을 하위 에이전트에게 위임
    ✔️ 웹 검색, 코드 작성, 문서 작성을 병렬/순차적으로 처리
    ✔️ 위임 결과를 모아서 최종 산출물 완성
:::

::: icon-grid cols=2
- icon: "🪝"
  title: "Hook (훅)"
  desc: |
    ✔️ 특정 이벤트가 발생했을 때 에이전트를 자동 실행
    ✔️ ⏰ Schedule Hook: 매일 오전 9시
    ✔️ 📁 Event Hook: 파일 업로드 시
    ✔️ 🌐 Webhook: HTTP 요청 수신 시
    ✔️ 📊 Condition Hook: 특정 값 초과 시
- icon: "🧠"
  title: "Memory (메모리)"
  desc: |
    ✔️ 이전 작업·대화·결과를 기억하고 활용
    ✔️ 인컨텍스트 메모리: 대화 종료 시 소멸
    ✔️ 외부 메모리 (SKILL.md): 영구 보존
    ✔️ 벡터 메모리 (RAG): 영구 보존
    ✔️ 캐시 메모리: 세션 단위
:::

::: alert-box tip
- title: "💡 핵심 실천:"
  desc: "SKILL.md를 프로젝트 루트에 두면 Claude Code가 자동 인식합니다. 매 대화 시작 시 첨부하면 일관된 작업이 가능합니다. SKILL.md 작성법은 17장에서 자세히 다룹니다."
:::

::: takeaway
- icon: "💡"
  title: "Key Takeaway"
  desc: "현대 에이전트는 **MCP로 도구를 쓰고, Sub-agent로 팀을 이루고, Hook으로 자동 실행되며, Memory로 맥락을 유지**합니다 — 이 4가지가 결합될 때 진정한 자동화가 완성됩니다."
:::
