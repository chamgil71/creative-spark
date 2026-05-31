---
title: "연계 도구 &조합 패턴"
subtitle: "GitHub·Obsidian·Notion·Slack·Vercel·Supabase·Cloudflare·Tailscale·SKILL.md — 그리고 레시피 5가지"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

# 연계 도구 전체 가이드

AI로 만든 결과물이 팀에 공유되고, 버전이 관리되고, 자동 배포되는 전체 인프라를 구성합니다.

🐙

Ch.12 — GitHub : 버전 관리 & AI 커밋 자동화

AI 에이전트가 파일을 수정하기 전 반드시 커밋. Claude Code가 변경사항을 분석해 의미 있는 커밋 메시지를 자동 생성. GitHub Actions로 자동 테스트 연동.

AI 작업 전 필수 커밋

자동 커밋 메시지

Actions 테스트

.gitignore (.env 필수)

🪨

Ch.13 — Obsidian : 프롬프트 아카이빙 & 작업 로그

검증된 프롬프트를 태그·성공률·관련 노트와 함께 저장. Daily Note에 "다음 세션 시작점"을 기록하면 AI와 대화를 이어나갈 때 맥락을 즉시 복원할 수 있습니다.

프롬프트 아카이브

다음 세션 시작점

양방향 링크

Local REST API

📋

Ch.14 — Notion / Slack : 저장 허브 & 실시간 알림

역할 분리가 핵심: Notion은 영구 저장·검색 허브, Slack은 즉시 확인이 필요한 실시간 알림 채널. n8n → Notion DB 자동 저장 + Slack Block Kit 구조화 메시지.

Notion DB 자동 저장

Slack Block Kit

MCP 직접 연동

Webhook URL 보안

▲

Ch.15 — Vercel : 코드 → 자동 배포

GitHub 연동만으로 코드 푸시 → 자동 빌드·배포. main 브랜치 외 브랜치에 푸시하면 별도 Preview URL 자동 생성. Serverless Functions로 서버 없는 백엔드 구현.

푸시 → 자동 배포

Preview URL

Serverless Functions

커스텀 도메인

🗄️

Ch.16 — Supabase : DB·인증·백엔드 자동 구성

PostgreSQL DB + Auth + Storage + Realtime을 5분 안에 구성. Row Level Security(RLS)로 데이터 보안 제어. n8n과 연동해 자동화 파이프라인의 저장소로 활용.

PostgreSQL

RLS 보안

Realtime 구독

service_role 서버 전용

🌐

Ch.17 — 네트워크 접근 : Cloudflare / Tailscale / Portainer

Cloudflare Tunnel로 로컬 서버를 포트 포워딩 없이 공개. Tailscale로 팀 전용 사설 VPN 구성. Portainer로 Docker 컨테이너를 웹 UI에서 시각적으로 관리.

Cloudflare: 외부 Webhook

Tailscale: 팀 내부망

Portainer: Docker UI

# SKILL.md 실전 — 재사용 가능한 AI 지시서

SKILL.md 하나가 수백 번의 반복 설명을 대체합니다. 프로젝트 유형별 3가지 템플릿을 제공합니다.

::: icon-grid
- icon: "🐍"
  title: |
    🐍Python 파이프라인
     금액 타입·라이브러리 규칙·DB 처리 패턴·용어 사전·이슈 추적
- icon: "📄"
  title: |
    📄문서 자동화
     기호 구조(□○―)·종결어미·수치 표기·출력 파일 명세
- icon: "⚛️"
  title: |
    ⚛️웹앱 개발
     컴포넌트 규칙·Supabase 보안·상태 관리·DB 스키마
:::

# [프로젝트명] SKILL.md

버전: v3.0 | 2026-05-01

## 절대 규칙

← 상단에 배치 (AI가 더 주의)

- 금액:

항상 int (float 금지, 쉼표·원화기호 제거)

- HTTP:

httpx 사용 (requests 절대 금지)

- 로그:

logging 모듈 (print 금지)

## 폴더 구조

/src/collectors/ ← 데이터 수집

/src/processors/ ← 정제·변환

/data/ ← 원본 (수정 금지)

## 현재 이슈

- [ ] 병합 셀 3단계 이상 처리

- [x] 기본 파싱 완성

::: alert-box tip
- title: "💡 SKILL.md 5가지 설계 원칙:"
  desc: "① 500줄 이하 유지 ② 행동 지향 문장 (\"~한다\") ③ 부정 규칙 명시 (금지 사항) ④ 예시 포함 ⑤ 살아있는 문서 (지속 업데이트)"
:::

::: alert-box warn
- title: "⚠️ SKILL.md가 너무 길면:"
  desc: "AI가 중간 내용을 무시합니다. 해결된 이슈는 삭제하고, 세부 내용은 별도 문서로 분리하세요."
:::

# 도구 조합 패턴 — 레시피 5가지

1~4부에서 익힌 모든 도구를 상황에 맞게 조합하는 실전 레시피입니다. 5부의 실전 사례들은 이 레시피의 구현입니다.

📄

레시피 1 — 문서 자동화

수동 9시간 → 자동화 45분

주제 입력

→

Claude 웹검색 10+회

→

MD 초안

→

문체 변환

→

HWPX/PPTX 생성

도구: Claude + ai-strategy-report SKILL.md + sentence-normalizer + hwpx/pptx SKILL.md

📱

레시피 2 — 웹앱 프로토타입

아이디어 → 동작하는 앱 (수십 분)

Lovable 앱 생성

→

Supabase DB 자동 구성

→

GitHub 연동

→

Cursor 세부 수정

→

Vercel 배포

도구: Lovable + Supabase + GitHub + Cursor + Vercel + Cloudflare(도메인)

🔄

레시피 3 — 데이터 파이프라인

분산된 데이터 → 통합 DB (자동)

PDF/API/Excel 수집

→

Claude Code 파서 구현

→

Pydantic 검증

→

DB 저장

→

Slack 알림

도구: Claude Code + Python(pandas/Pydantic/SQLAlchemy) + Supabase/SQLite + n8n + Slack

⚡

레시피 4 — 업무 자동화

반복 업무 → 한 번 설계 후 영구 실행

n8n 스케줄/훅

→

데이터 수집

→

AI 분류·요약

→

Notion 저장

→

Slack 알림

도구: n8n + Cloudflare Tunnel(외부 Webhook) + Ollama(로컬 AI) + Notion + Slack

🧠

레시피 5 — 지식 베이스 구축

경험 → 팀 자산

AI 작업 세션

→

Obsidian 기록

→

프롬프트 아카이브

→

SKILL.md 업데이트

→

GitHub 공유

도구: Obsidian + SKILL.md + GitHub + Notion(팀 위키) + Claude Projects

💡

Key Takeaway

도구의 힘은 단독 사용보다

조합

에서 나옵니다. 입력→AI처리→저장→출력→인프라의 5개 레이어를 순서대로 연결하면 반복 업무는 시스템이 되고, 지식은 자산이 됩니다.
