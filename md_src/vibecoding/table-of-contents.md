---
title: "table-of-contents"
style: "ai-dev"
stats:
---

Complete Guide · 2026 Edition

바이브코딩

&

에이전트 코딩

완전 입문 가이드

코드를 몰라도, AI와 함께라면 만들 수 있다

29

Chapters

8

Parts

6

Real Cases

20

+

Tools

Table of Contents

목차

1부

개념 이해

— 바이브코딩과 에이전트 코딩의 작동 원리

Ch.01–03

01

바이브코딩이란?

Karpathy 발언 배경 · 전통 코딩 vs 바이브코딩 · LLM 발전

개념

02

에이전트 코딩이란?

계획→실행→수정 루프 · 레벨 1~5 스펙트럼 · 바이브코딩과 차이

개념

03

에이전트 작동 원리

MCP · Sub-agent · Hook · Memory — 4가지 핵심 원리

개념

2부

AI와 대화하는 법

— 프롬프트 설계부터 복잡한 작업 위임까지

Ch.04–05

04

첫 대화: 프롬프트 설계

요구사항 명세 · 컨텍스트 주입 전략 · SKILL.md 재사용 지시

실습

05

에이전트에게 복잡한 작업 위임하기

작업 분해 · Sub-agent 패턴 · Hook 트리거 · 중간 검수 포인트

실습

3부

AI 코딩 도구

— 대화형부터 완전 자율 에이전트까지

Ch.06–11

06

대화형 도구

Claude · ChatGPT · Gemini — 상황별 선택 가이드 & 비교표

도구

07

터미널 에이전트

Claude Code · Codex CLI — 설치·CLAUDE.md·권한 모드

도구

08

AI 에디터

Cursor · Windsurf — Tab/Ctrl+K/Ctrl+L · .cursorrules

도구

09

앱 빌더

Lovable · Bolt · v0 — 자연어로 풀스택 앱 생성

도구

10

자동화 플랫폼

n8n · Make · Zapier · Antigravity — 노코드 워크플로우

도구

11

로컬 AI

Ollama · Devin · SWE-agent — 오프라인 AI 실행 환경

도구

4부

연계 도구 & 조합 패턴

— GitHub부터 Cloudflare까지, 그리고 레시피

Ch.12–18

12

GitHub

버전 관리 · AI 커밋 자동화 · GitHub Actions

도구

13

Obsidian

프롬프트 아카이빙 · 작업 로그 · "다음 세션 시작점"

도구

14

Notion / Slack

저장 허브 vs 실시간 알림 · Block Kit · MCP 연동

도구

15

Vercel

자동 배포 · Preview URL · Serverless Functions

도구

16

Supabase

PostgreSQL · Auth · RLS · Realtime · n8n 연동

도구

17

네트워크·접근

Cloudflare Tunnel · Tailscale · Portainer — 로컬 서버 운영

도구

18

SKILL.md 실전

유형별 템플릿 3종 · 버전 관리 · 팀 공유 전략

실습

19

도구 조합 패턴 — 레시피 5가지

문서 자동화 · 웹앱 프로토타입 · 데이터 파이프라인 · 업무 자동화 · 지식 베이스

핵심

5부

실전 사례

— 실제 파이프라인, 실제 코드, 실제 교훈

Ch.20–25

20

사례 1 — 정부 예산 PDF → DB 파이프라인

pdfplumber · 병합 셀 · Pydantic · SQLAlchemy · v15까지 간 이유

사례

21

사례 2 — PPTX/HWPX 보고서 자동 생성

python-pptx · XML 색상 제어 · sentence-normalizer · hwpx SKILL.md

사례

22

사례 3 — HR 인사이동 자동화

설문→배정 로직→보고서 · Pydantic 검증 · Claude 예외 처리

사례

23

사례 4 — n8n 로컬 자동화 서버

N100 미니PC · Docker Compose · Ollama · 월 1만원 운영

사례

24

사례 5 — 개인금융 데이터 파이프라인

뱅크샐러드 CSV · 3단계 Excel 체인 · pykrx · Streamlit 대시보드

사례

25

사례 6 — AI 전략 보고서 자동화

ai-strategy-report SKILL.md v3.0 · Tier 출처 시스템 · Phase 분리

사례

6부

품질과 운영

— 오류 처리, 디버깅, 재사용 자산 구축

Ch.26–27

26

오류 처리와 디버깅 협업

오류 4가지 유형 · 반복 루프 탈출 · Git 안전망 · 예방적 디버깅

실습

27

재사용 가능한 자산 만들기

스니펫 라이브러리 · n8n 워크플로우 템플릿 · 프로젝트 스타터 킷

실습

7부

시작과 심화

— 일반인 입문 로드맵과 프롬프트 기법

Ch.28–29

28

일반인 입문 로드맵

4단계 로드맵 · 1주차~3개월 체크포인트 · 자주 묻는 질문

가이드

29

좋은 프롬프트 쓰는 법

핵심 기법 10가지 · 상황별 패턴 · 흔한 실수 10가지

가이드

8부

주의사항과 함정

— 강력한 도구일수록 신중하게

Ch.30

30

주의사항과 함정

과잉 신뢰 · 보안 취약점 · 맥락 소실 · 비용 관리 · 올바른 마인드셋

주의

30

장

Total Chapters

8

부

Parts

6

개

Real Cases

20

+

Tools Covered

10K

+

Lines Written
