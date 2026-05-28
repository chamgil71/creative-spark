---
title: "바이브코딩 & 에이전트 코딩 목차"
subtitle: "코드를 몰라도, AI와 함께라면 만들 수 있다"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

# 목차

바이브코딩과 에이전트 코딩 완전 입문 가이드의 단원별 주제 및 챕터별 세부 요약 목차 리스트입니다.

::: part-deck
- icon: "1부"
  title: "개념 이해"
  desc: "바이브코딩과 에이전트 코딩의 작동 원리"
  tag: "Ch.01–03"
  color: "#1a3a5c"
:::

::: chapter-list
- icon: "01"
  title: "바이브코딩이란?"
  desc: "Karpathy 발언 배경 · 전통 코딩 vs 바이브코딩 · LLM 발전"
  tag: "개념"
- icon: "02"
  title: "에이전트 코딩이란?"
  desc: "계획→실행→수정 루프 · 레벨 1~5 스펙트럼 · 바이브코딩과 차이"
  tag: "개념"
- icon: "03"
  title: "에이전트 작동 원리"
  desc: "MCP · Sub-agent · Hook · Memory — 4가지 핵심 원리"
  tag: "개념"
:::

::: part-deck
- icon: "2부"
  title: "AI와 대화하는 법"
  desc: "프롬프트 설계부터 복잡한 작업 위임까지"
  tag: "Ch.04–05"
  color: "#1a4a3a"
:::

::: chapter-list
- icon: "04"
  title: "첫 대화: 프롬프트 설계"
  desc: "요구사항 명세 · 컨텍스트 주입 전략 · SKILL.md 재사용 지시"
  tag: "실습"
- icon: "05"
  title: "에이전트에게 복잡한 작업 위임하기"
  desc: "작업 분해 · Sub-agent 패턴 · Hook 트리거 · 중간 검수 포인트"
  tag: "실습"
:::

::: part-deck
- icon: "3부"
  title: "AI 코딩 도구"
  desc: "대화형부터 완전 자율 에이전트까지"
  tag: "Ch.06–11"
  color: "#3a1a5c"
:::

::: chapter-list
- icon: "06"
  title: "대화형 도구"
  desc: "Claude · ChatGPT · Gemini — 상황별 선택 가이드 & 비교표"
  tag: "도구"
- icon: "07"
  title: "터미널 에이전트"
  desc: "Claude Code · Codex CLI — 설치·CLAUDE.md·권한 모드"
  tag: "도구"
- icon: "08"
  title: "AI 에디터"
  desc: "Cursor · Windsurf — Tab/Ctrl+K/Ctrl+L · .cursorrules"
  tag: "도구"
- icon: "09"
  title: "앱 빌더"
  desc: "Lovable · Bolt · v0 — 자연어로 풀스택 앱 생성"
  tag: "도구"
- icon: "10"
  title: "자동화 플랫폼"
  desc: "n8n · Make · Zapier · Antigravity — 노코드 워크플로우"
  tag: "도구"
- icon: "11"
  title: "로컬 AI"
  desc: "Ollama · Devin · SWE-agent — 오프라인 AI 실행 환경"
  tag: "도구"
:::

::: part-deck
- icon: "4부"
  title: "연계 도구 & 조합 패턴"
  desc: "GitHub부터 Cloudflare까지, 그리고 레시피"
  tag: "Ch.12–18"
  color: "#5c3a1a"
:::

::: chapter-list
- icon: "12"
  title: "GitHub"
  desc: "버전 관리 · AI 커밋 자동화 · GitHub Actions"
  tag: "도구"
- icon: "13"
  title: "Obsidian"
  desc: "프롬프트 아카이빙 · 작업 로그 · \"다음 세션 시작점\""
  tag: "도구"
- icon: "14"
  title: "Notion / Slack"
  desc: "저장 허브 vs 실시간 알림 · Block Kit · MCP 연동"
  tag: "도구"
- icon: "15"
  title: "Vercel"
  desc: "자동 배포 · Preview URL · Serverless Functions"
  tag: "도구"
- icon: "16"
  title: "Supabase"
  desc: "PostgreSQL · Auth · RLS · Realtime · n8n 연동"
  tag: "도구"
- icon: "17"
  title: "네트워크·접근"
  desc: "Cloudflare Tunnel · Tailscale · Portainer — 로컬 서버 운영"
  tag: "도구"
- icon: "18"
  title: "SKILL.md 실전"
  desc: "유형별 템플릿 3종 · 버전 관리 · 팀 공유 전략"
  tag: "실습"
- icon: "19"
  title: "도구 조합 패턴 — 레시피 5가지"
  desc: "문서 자동화 · 웹앱 프로토타입 · 데이터 파이프라인 · 업무 자동화 · 지식 베이스"
  tag: "핵심"
:::

::: part-deck
- icon: "5부"
  title: "실전 사례"
  desc: "실제 파이프라인, 실제 코드, 실제 교훈"
  tag: "Ch.20–25"
  color: "#1a5c3a"
:::

::: chapter-list
- icon: "20"
  title: "사례 1 — 정부 예산 PDF → DB 파이프라인"
  desc: "pdfplumber · 병합 셀 · Pydantic · SQLAlchemy · v15까지 간 이유"
  tag: "사례"
- icon: "21"
  title: "사례 2 — PPTX/HWPX 보고서 자동 생성"
  desc: "python-pptx · XML 색상 제어 · sentence-normalizer · hwpx SKILL.md"
  tag: "사례"
- icon: "22"
  title: "사례 3 — HR 인사이동 자동화"
  desc: "설문→배정 로직→보고서 · Pydantic 검증 · Claude 예외 처리"
  tag: "사례"
- icon: "23"
  title: "사례 4 — n8n 로컬 자동화 서버"
  desc: "N100 미니PC · Docker Compose · Ollama · 월 1만원 운영"
  tag: "사례"
- icon: "24"
  title: "사례 5 — 개인금융 데이터 파이프라인"
  desc: "뱅크샐러드 CSV · 3단계 Excel 체인 · pykrx · Streamlit 대시보드"
  tag: "사례"
- icon: "25"
  title: "사례 6 — AI 전략 보고서 자동화"
  desc: "ai-strategy-report SKILL.md v3.0 · Tier 출처 시스템 · Phase 분리"
  tag: "사례"
:::

::: part-deck
- icon: "6부"
  title: "품질과 운영"
  desc: "오류 처리, 디버깅, 재사용 자산 구축"
  tag: "Ch.26–27"
  color: "#5c1a3a"
:::

::: chapter-list
- icon: "26"
  title: "오류 처리와 디버깅 협업"
  desc: "오류 4가지 유형 · 반복 루프 탈출 · Git 안전망 · 예방적 디버깅"
  tag: "실습"
- icon: "27"
  title: "재사용 가능한 자산 만들기"
  desc: "스니펫 라이브러리 · n8n 워크플로우 템플릿 · 프로젝트 스타터 킷"
  tag: "실습"
:::

::: part-deck
- icon: "7부"
  title: "시작과 심화"
  desc: "일반인 입문 로드맵과 프롬프트 기법"
  tag: "Ch.28–29"
  color: "#3a5c1a"
:::

::: chapter-list
- icon: "28"
  title: "일반인 입문 로드맵"
  desc: "4단계 로드맵 · 1주차~3개월 체크포인트 · 자주 묻는 질문"
  tag: "가이드"
- icon: "29"
  title: "좋은 프롬프트 쓰는 법"
  desc: "핵심 기법 10가지 · 상황별 패턴 · 흔한 실수 10가지"
  tag: "가이드"
:::

::: part-deck
- icon: "8부"
  title: "주의사항과 함정"
  desc: "강력한 도구일수록 신중하게"
  tag: "Ch.30"
  color: "#1a1a5c"
:::

::: chapter-list
- icon: "30"
  title: "주의사항과 함정"
  desc: "과잉 신뢰 · 보안 취약점 · 맥락 소실 · 비용 관리 · 올바른 마인드셋"
  tag: "주의"
:::

::: summary-bar
- icon: "30장"
  title: "Total Chapters"
- icon: "8부"
  title: "Parts"
- icon: "6개"
  title: "Real Cases"
- icon: "20+"
  title: "Tools Covered"
- icon: "10K+"
  title: "Lines Written"
:::
