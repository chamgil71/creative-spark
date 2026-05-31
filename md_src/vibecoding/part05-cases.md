---
title: "실전 사례"
subtitle: "실제 파이프라인, 실제 코드, 실제 교훈6가지 자동화 프로젝트의 전체 흐름 공개"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

사례

01

Ch.20 · 레시피 3 (데이터 파이프라인)

정부 예산 PDF → DB 파이프라인

과기부 예산서 PDF를 자동 파싱해 SQLite DB에 저장 — v15까지 간 실제 교훈

#### 📋 배경

PDF 1권(300페이지) 수작업 Excel 변환에 4~6시간 소요. 연간 30~60시간 낭비, 오류율 3~5%. 병합 셀·한국어 숫자·다단 구조가 파싱의 주요 장벽.

#### 🔄 파이프라인

PDF 원본

→

pdf_to_json.py (pdfplumber)

→

json_structurer.py (병합셀 처리)

→

budget_parser.py (DB 저장)

→

SQLite budget.db

pdfplumber

Pydantic

SQLAlchemy

Claude Code

n8n 스케줄

#### 💡 v15까지 간 핵심 교훈

- 설계 선행: v1~v6 재작성 시간이 v1 설계 시간보다 5배 더 걸렸다
- 샘플 검증: 전체 실행 전 반드시 3~5페이지 샘플로 먼저 검증
- 체크포인트: 단계별 중간 파일 저장이 없으면 실패 시 전체 재실행
- 루프 탈출: 3회 반복 실패 시 "근본 원인 분석 먼저"로 전환

30x

처리 속도 향상

0%

Pydantic 검증 오류율

182K

DB 적재 건수

47개

처리 PDF 파일

사례

02

Ch.21 · 레시피 1 (문서 자동화)

PPTX/HWPX 보고서 자동 생성

반복되는 정부 보고서 양식 작업을 3단계 파이프라인으로 자동화

#### 🔄 파이프라인

Claude 콘텐츠 생성

→

sentence-normalizer (□○― 구조화)

→

python-pptx / hwpx 빌더

→

최종 파일

python-pptx

pptx_inspector.py

hwpx SKILL.md

sentence-normalizer

#### 💡 핵심 기법

- pptx_inspector.py로 기존 파일 폰트·색상·위치 추출 후 재적용
- XML 수준 제어로 특정 색상 RGB 직접 설정 가능
- HWPX는 ZIP 형식 → 압축 해제 후 XML 수정 → 재압축

6x

PPTX 속도 향상

5x

HWPX 속도 향상

~0%

수치 오류율

120h+

연간 절감 시간

사례

03

Ch.22 · 레시피 3+4 결합

HR 인사이동 자동화

설문→배정→보고서까지, 수작업 이틀을 30분으로

#### 🔄 파이프라인

Google Form 설문

→

Pydantic 검증

→

규칙 기반 자동 배정

→

Claude 예외 처리

→

openpyxl 보고서

Pydantic

Python 배정 엔진

Claude API

openpyxl

n8n Webhook

#### 💡 핵심 설계

- 규칙 기반으로 먼저 처리 → 해결 안 되는 케이스만 Claude에 위임
- 배정 근거 자동 기록 → 이의신청 시 즉시 제시 가능
- 희망 반영률 정량 측정 (1순위 68%, 희망 내 89%)

40x

처리 속도 향상

0건

조건 위반 (이전 1~2건)

89%

희망 내 배정률

사례

04

Ch.23 · 레시피 4 (업무 자동화)

n8n 로컬 자동화 서버

N100 미니PC + Docker + n8n + Ollama — 월 1만원대 24시간 자동화

#### 🖥️ 하드웨어 스택

# N100 미니PC (약 17만원)

CPU:

Intel N100 · 전력 6~25W

RAM:

16GB · SSD: 512GB

월 전기세:

약 3,200원

↔ n8n Cloud: 월 ~7만원

#### 🔄 운영 중인 워크플로우

공고 수집

— 매일 07:50 · NIPA/NIA/IITP/MSIT · Ollama 분류 · Slack+Notion

AI 뉴스 요약

— 매일 08:30 · RSS 5개 · 한국어 번역·요약 · Slack

주간 트렌드

— 매주 금요일 17:00 · Claude API 분석 · Notion 리포트

PDF 파이프라인 트리거

— 파일 감지 → 자동 실행 → Slack 알림

2,400

3개월 총 실행

3,800

처리 공고 건수

1.2%

오류 발생률

₩12K

월 운영 비용

사례

05

Ch.24 · 레시피 3 (데이터 파이프라인)

개인금융 데이터 파이프라인 + Streamlit

뱅크샐러드 CSV → 3단계 Excel 체인 → pykrx/yfinance → 대시보드

#### 🔄 파이프라인

뱅크샐러드 CSV

→

DATA.xlsx (정제)

→

SUMMARY.xlsx (집계)

→

DASHBOARD.xlsx (주가연동)

→

Streamlit 대시보드

pandas

openpyxl

pykrx (국내주가)

yfinance (해외주가)

Streamlit

Plotly

#### 📊 대시보드 구성

수입/지출 KPI

전월 대비 delta

카테고리 도넛

이번 달 지출 구성

저축률 트렌드

월별 추이

포트폴리오

국내+해외 수익률

10분

월 가계부 정리 시간

1화면

금융 통합 뷰

실시간

주가 연동

사례

06

Ch.25 · 레시피 1+5 결합

AI 전략 보고서 자동화

Magnificent 7 분석 — Tier 출처 시스템 + Phase 분리 + SKILL.md v3.0

#### 📋 ai-strategy-report SKILL.md v3.0 핵심

Tier 1 — 최고 신뢰

SEC 공시, 기업 IR, 정부 공문서, 학술 논문, 공식 뉴스룸

Tier 2 — 높은 신뢰

주요 언론, 산업 분석 보고서, 기관 연구 보고서

Tier 3 — 참고 수준

블로그, 개인 미디어 — 단독 인용 금지

#### 🔄 Phase 분리 워크플로우

Phase 1: 웹검색 10회+ 리서치

→

사용자 확인

→

Phase 2: 보고서 작성

→

출처 목록 자동 생성

#### ⚠️ 실제 오류 수정 사례

AI 오류:

"테슬라는 자체 LLM 'Grok'을 출시하여..."

사실:

Grok은 테슬라가 아닌 xAI(별도 회사)의 제품

교훈:

AI 보고서에서 기업 관계, 제품 귀속, 날짜는 반드시 사람이 검토

5~6x

작성 시간 단축

60%+

Tier 1 출처 비율

0~1건

수치 오류/보고서
