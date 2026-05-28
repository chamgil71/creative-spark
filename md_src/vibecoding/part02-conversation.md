---
title: "AI와 대화하는 법"
subtitle: "프롬프트 설계부터 복잡한 작업 위임까지 SKILL.md로 재사용 가능한 지시 체계 만들기"
badge: "바이브코딩 & 에이전트 코딩 완전 입문 가이드"
style: "ai-dev"
stats:
---

# 첫 대화: 프롬프트 설계

AI에게 무엇을 어떻게 말하느냐가 결과의 80%를 결정합니다. 같은 작업이라도 프롬프트 품질에 따라 AI의 결과물 수준이 완전히 달라집니다.

### 나쁜 프롬프트 vs 좋은 프롬프트

::: compare-before-after
- title: "나쁜 프롬프트"
  desc: "엑셀 자동화 코드 만들어줘."
- title: "좋은 프롬프트"
  desc: |
    Python으로 엑셀 자동화 코드를 작성해줘.

    입력: data.xlsx (A열:날짜, B열:부서명, C열:금액)
    출력: summary.xlsx (부서별 월간 합계, 시트 1개)

    조건:
    - 날짜 형식은 YYYY-MM-DD
    - 금액은 천 단위 콤마 표시
    - 주석은 한국어로
    - pandas와 openpyxl 사용
:::

### 좋은 프롬프트의 5가지 구성 요소

::: icon-grid cols=5
- icon: "🎭"
  title: "역할 (Role)"
  desc: '"너는 Python 전문가야"'
- icon: "📋"
  title: "맥락 (Context)"
  desc: "프로젝트 배경, 파일 구조"
- icon: "🎯"
  title: "작업 (Task)"
  desc: "구체적으로 무엇을 할지"
- icon: "⚙️"
  title: "조건 (Constraints)"
  desc: "언어, 형식, 제약사항"
- icon: "📤"
  title: "출력 형식 (Format)"
  desc: "코드만, JSON, 한국어 등"
:::

### 3단계 요구사항 명세 기법

::: step-list
- title: "1단계: 목표 선언 (What)"
  desc: "\"PDF 파일에서 예산 표를 추출해서 JSON으로 저장하는 Python 스크립트를 만들어줘.\" — 한 문장으로 목표 선언"
- title: "2단계: 입출력 정의 (I/O Spec)"
  desc: "입력 파일 경로, 컬럼 구조, 특이사항 / 출력 파일 형식, JSON 구조 예시 제시"
- title: "3단계: 제약 조건 (Constraints)"
  desc: "사용할 라이브러리, 금지 패턴, 에러 처리 방식, 주석 언어를 명확하게 기입"
:::

### SKILL.md — 재사용 가능한 AI 지시서

**SKILL.md**는 프로젝트의 핵심 맥락·규칙·용어를 한 파일에 정리해두는 방식입니다. 매번 같은 배경 설명을 반복하는 대신, 이 파일 하나를 첨부하면 즉시 프로젝트 맥락을 공유할 수 있습니다.

::: editor-box
- title: "SKILL.md"
  tag: "markdown"
  desc: |
    # [프로젝트명] SKILL.md  ← 버전: v2.0 | 최종 수정: 2026-05-01

    ## 1. 프로젝트 개요
    - 목적: 과기부 PDF 예산문서를 파싱하여 SQLite DB에 저장
    - 언어: Python 3.11
    - 현재 단계: 병합 셀 처리 버그 수정 중 (v15)

    ## 2. 핵심 규칙
    - 금액 필드: 항상 정수(int) 타입 (float 금지)
    - HTTP 요청: httpx 사용 (requests 금지)
    - 로깅: logging 모듈 사용 (print 금지)

    ## 3. 현재 이슈
    - [ ] 3단계 이상 중첩 병합 셀 처리
    - [x] PDF 파싱 기본 구조 완성
:::

::: alert-box tip
- title: "💡 SKILL.md 사용법:"
  desc: "매 대화 시작 시 파일을 첨부하거나, Claude Projects에 등록해두면 자동 적용됩니다. Claude Code는 프로젝트 루트의 `CLAUDE.md` 파일을 자동 인식합니다."
:::

::: alert-box warn
- title: "⚠️ 보안 주의:"
  desc: "SKILL.md에 API 키, 비밀번호, 개인정보를 절대 넣지 마세요. 이 파일을 AI에게 첨부하거나 GitHub에 올릴 경우 외부에 노출될 수 있습니다."
:::

::: takeaway
- icon: "💡"
  title: "Key Takeaway"
  desc: "좋은 프롬프트는 **역할·맥락·작업·조건·형식**을 갖추고, SKILL.md는 그 맥락을 **프로젝트 전체에 걸쳐 일관되게 유지**하는 핵심 도구입니다."
:::

# 에이전트에게 복잡한 작업 위임하기

AI에게 "해줘"가 아니라 "맡길게"라고 말할 수 있을 때, 진짜 자동화가 시작됩니다. 복잡한 작업을 쪼개고, 검수하고, 안전하게 완성하는 전략을 다룹니다.

### 작업 분해 — 2가지 핵심 기준

::: icon-grid cols=2
- icon: "1️⃣"
  title: "입출력 경계 명확히"
  desc: |
    ✔️ ❌ 나쁜 분해:
      - 1단계: PDF 처리
      - 2단계: 데이터 저장
    ✔️ ✅ 좋은 분해:
      - 1단계: PDF → raw.json
      - 2단계: raw.json → structured.json
      - 3단계: structured.json → DB
- icon: "2️⃣"
  title: "검증 및 복구 가능성"
  desc: |
    ✔️ 각 단계 완료 시 **결과를 파일로 저장** (체크포인트)
    ✔️ 단계별 **샘플 5개**로 사람이 직접 검수 진행
    ✔️ 3단계 실패해도 2단계 결과물부터 바로 재실행 가능
:::

### 3가지 위임 패턴

::: icon-grid cols=3
- icon: "📋"
  title: "패턴 1 — 순차 위임"
  desc: "한 단계 완료 후 사람이 직접 검수한 뒤 그 다음 단계를 차근차근 지시하는 가장 안전하고 기본적인 방식입니다."
- icon: "📐"
  title: "패턴 2 — 계획 먼저"
  desc: "\"실행하지 말고 구체적 계획만 먼저 보여줘\" 지시 후 사람이 계획을 승인한 뒤 실행. 복잡하고 중요한 작업에 적합합니다."
- icon: "⚡"
  title: "패턴 3 — 병렬 위임"
  desc: "독립적인 작업을 여러 서브에이전트가 동시에 처리하는 구조입니다. (예: PDF 10개를 5+5개로 나누어 동시 파싱)"
:::

### 중간 검수 포인트 — 언제 확인하나

::: console-box
- title: "검수 요청 프롬프트 패턴"
  desc: |
    1단계가 완료됐어. 진행 전에 다음을 확인해줘:

    1. 추출된 총 레코드 수
    2. 금액 필드의 최솟값·최댓값·null 개수
    3. 예상과 다른 데이터 패턴이 있으면 알려줘

    # 확인 후 내가 "계속"이라고 하면 2단계 진행
:::

::: checkpoint-grid
- icon: "📐"
  title: "계획 수립 후"
  desc: "방향이 맞는지 검토"
- icon: "1️⃣"
  title: "1단계 완료 후"
  desc: "입력 데이터 검증"
- icon: "🔄"
  title: "핵심 변환 후"
  desc: "데이터 구조 일치 확인"
- icon: "✅"
  title: "전체 완료 후"
  desc: "요구사항 충족 확인"
- icon: "🚀"
  title: "배포 전"
  desc: "운영 환경 동작 확인"
:::

::: alert-box warn
- title: "⚠️ DB 작업 위임 시:"
  desc: "\"DB 저장 시 트랜잭션 처리 포함해줘. 오류 발생 시 전체 롤백.\"을 반드시 명시하세요. 중간에 실패하면 DB가 절반만 저장된 불완전한 상태가 됩니다."
:::

::: takeaway
- icon: "💡"
  title: "Key Takeaway"
  desc: "복잡한 작업은 **입출력이 명확한 단계로 분해**하고, **각 단계마다 검수**하고, **중간 결과를 파일로 보존**하는 세 원칙을 지키면 AI 위임의 실패율을 크게 낮출 수 있습니다."
:::
