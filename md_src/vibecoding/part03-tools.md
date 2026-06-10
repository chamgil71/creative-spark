---
title: "AI 코딩 도구"
subtitle: "대화형 AI부터 터미널 에이전트, AI 에디터, 앱 빌더,자동화 플랫폼, 로컬 AI까지 — 도구 전체 지도"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

# 대화형 도구 — Claude / ChatGPT / Gemini

설치 없이 브라우저에서 바로 사용. 레벨 2(바이브코딩) 단계의 핵심 도구들입니다.

::: icon-grid
- title: |
    🤖
     Claude ⭐ 추천Anthropic · claude.ai
     
     긴 문서 이해·정확한 추론·한국어 처리에서 강점. 코드와 문서를 동시에 다루는 작업에서 일관성이 높습니다.
     📄 긴 문서 분석🇰🇷 한국어 우수💻 코드+문서🔌 MCP 연동
- title: |
    💬
     ChatGPTOpenAI · chatgpt.com
     
     이미지 생성(DALL-E) 통합, GPT Store 커스텀 GPT 생태계, o3 모델의 고급 추론 능력이 강점입니다.
     🎨 이미지 생성🧮 고급 추론 o3🏪 GPT Store
- title: |
    ✨
     GeminiGoogle · gemini.google.com
     
     Google Workspace(Gmail, Docs, Sheets) 네이티브 통합, Google 검색 실시간 연동이 최대 강점입니다.
     📧 Gmail 연동📊 Sheets 연동🔍 실시간 검색
:::

| 항목 | Claude | ChatGPT | Gemini |
| --- | --- | --- | --- |
| 한국어 처리 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 코드 생성 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 이미지 생성 | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Google 연동 | MCP 경유 | MCP 경유 | ⭐⭐⭐⭐⭐ 네이티브 |
| 외부 도구 연동 | ⭐⭐⭐⭐⭐ MCP | ⭐⭐⭐⭐ GPT Store | ⭐⭐⭐ |

💡

Key Takeaway

Claude는 한국어·코드·문서, ChatGPT는 이미지·추론·생태계, Gemini는 Google 연동·실시간 검색에서 각각 강점 —

상황에 맞게 조합

하는 것이 최선입니다.

# 터미널 에이전트 — Claude Code / Codex CLI

AI가 직접 파일을 읽고·수정하고·실행하는 레벨 4 에이전트 도구. 브라우저를 벗어나 터미널에서 실행합니다.

::: tool-list
- icon: "⌨️"
  title: "Claude Code ⭐"
:::

::: tool-list
- icon: "🧠"
  title: "Codex CLI"
:::

| 항목 | Claude Code | Codex CLI |
| --- | --- | --- |
| 기반 모델 | Claude 4 (Sonnet/Opus) | GPT-4o |
| 파일 접근 | 직접 접근 | 샌드박스 격리 |
| 한국어 | 매우 우수 | 우수 |
| CLAUDE.md | 자동 인식 | 별도 설정 |
| Git 연동 | 자동 커밋 지원 | 수동 |

::: alert-box warn
- title: "⚠️ 필수 원칙:"
  desc: "에이전트 실행 전 반드시 git add . && git commit -m \"에이전트 실행 전 백업\". CLAUDE.md 없이 대규모 프로젝트 작업 시 일관성 없는 코드가 생성됩니다."
:::

# AI 에디터 — Cursor / Windsurf

기존 코드 에디터 환경에서 벗어나지 않고 AI와 실시간 협업. VS Code 기반이라 전환 비용이 거의 없습니다.

::: tool-list
- icon: "✏️"
  title: "Cursor ⭐"
:::

::: tool-list
- icon: "🌊"
  title: "Windsurf"
:::

::: alert-box tip
- title: "💡 .cursorrules 설정:"
  desc: "프로젝트 루트에 .cursorrules 파일을 만들어 팀 전체의 AI 코딩 규칙을 통일하세요. Git에 포함시키면 모든 팀원이 동일한 규칙을 적용합니다."
:::

# 앱 빌더 — Lovable / Bolt / v0

코드 에디터도, 터미널도 필요 없습니다. 브라우저에서 원하는 앱을 설명하면 디자인·코드·DB·배포까지 자동 완성됩니다.

::: icon-grid
- title: |
    ❤️Lovable ⭐lovable.dev
     자연어로 설명하면 React + Supabase 풀스택 웹앱 생성. GitHub 연동으로 코드 완전 소유.
     🗄️ Supabase 자동 연결🔐 Auth 자동🐙 GitHub 연동
- title: |
    ⚡Boltbolt.new · StackBlitz
     브라우저 안의 완전한 Node.js 실행 환경(WebContainers). npm 패키지 전체 활용 가능.
     🌐 브라우저 내 실행📦 npm 전체🚀 즉시 미리보기
- title: |
    ✂️v0v0.dev · Vercel
     UI 컴포넌트 단위 생성 특화. shadcn/ui + Tailwind 기반 고품질 컴포넌트를 즉시 생성해 기존 프로젝트에 붙여넣기.
     🧩 컴포넌트 단위🎨 shadcn/ui🚀 Vercel 배포
:::

::: alert-box tip
- title: "💡 조합 패턴:"
  desc: "Lovable(초안 생성) → GitHub → Cursor(세부 수정) → Vercel(배포). 앱 빌더는 프로토타입의 출발점으로 활용하고, 세부 로직은 AI 에디터에서 다듬으세요."
:::

# 자동화 플랫폼 — n8n / Make / Zapier / Antigravity

코딩 없이 "A가 발생하면 B를 해서 C에 전달"하는 자동화 흐름을 시각적으로 설계하고 자동 실행합니다.

::: tool-list
- icon: "🔄"
  title: "n8n ⭐ 보안 중시"
:::

::: tool-list
- icon: "🤖"
  title: "Antigravity"
:::

| 항목 | n8n | Make | Zapier |
| --- | --- | --- | --- |
| 호스팅 | 셀프 / 클라우드 | 클라우드 | 클라우드 |
| 무료 플랜 | 셀프호스팅 무제한 | 월 1,000 작업 | 월 100 작업 |
| AI 노드 | ⭐⭐⭐⭐⭐ 내장 | ⭐⭐⭐ | ⭐⭐⭐ |
| 데이터 보안 | ⭐⭐⭐⭐⭐ 셀프 | ⭐⭐⭐ | ⭐⭐⭐ |
| 설정 난이도 | 중간 | 쉬움 | 매우 쉬움 |

# 로컬 AI — Ollama / Devin / SWE-agent

API 비용 없이, 인터넷 없이, 민감 데이터 외부 전송 없이 AI를 로컬에서 실행하는 방법입니다.

::: icon-grid
- title: |
    🦙Ollamaollama.ai · 로컬 LLM
     Mac/Linux/Windows에서 오픈소스 LLM을 로컬 실행. n8n AI 노드와 연동하면 API 비용 없는 자동화 구현.
     
    ollama pull qwen2.5:14b # 한국어 우수
    ollama pull gemma3:12b # Google 모델
- title: |
    🤖Devincognition.ai · 레벨 5
     완전 자율 소프트웨어 엔지니어 AI. 목표만 주면 스스로 계획·코드·테스트·배포까지 처리. (레벨 5 에이전트)
- title: |
    🔬SWE-agentPrinceton NLP · 오픈소스
     GitHub 이슈를 자동으로 해결하는 연구용 에이전트. 오픈소스로 자체 운영 가능.
:::

::: alert-box tip
- title: "💡 n8n + Ollama 조합:"
  desc: "N100 미니PC에 n8n + Ollama를 함께 설치하면 월 전기세 3,000원으로 완전 로컬 AI 자동화 서버를 운영할 수 있습니다. 민감 데이터 처리에 특히 유용합니다."
:::
