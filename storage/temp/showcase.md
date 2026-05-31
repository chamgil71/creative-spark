---
title: AI Creative Suite 완전 활용 가이드
subtitle: 18개 shortcode 전체를 보여주는 예시 파일입니다
style: creative
badge: DEMO · 2026
logo: 🤖
heroCta:
  label: 공식 사이트 열기
  url: https://example.com
stats:
  - value: "무료"
    label: "시작 가능"
  - value: "18종"
    label: "숏코드"
  - value: "한국어"
    label: "지원"
done:
  title: 지금 바로 시작해보세요
  subtitle: 각 숏코드를 직접 사용해보며 나만의 가이드를 만들어보세요.
  ctaLabel: template.md 열기
  ctaUrl: https://example.com
footer:
  - 이 파일은 18개 shortcode를 모두 보여주는 데모 예시입니다.
  - "style 키를 바꾸면 전체 색상이 바뀝니다 — templates/styles.json 참고"
---

# 1. 핵심 기능 소개

AI Creative Suite는 아이디어 생성부터 배포까지 전 과정을 지원하는 통합 플랫폼입니다.

## 요약표

| shortcode | 용도 | 주요 필드 |
|-----------|------|-----------|
| `::: icon-grid` | 아이콘 박스 배열 | icon, title, desc |
| `::: feature-grid` | 설명형 카드 배열 | tag, icon, title, desc |
| `::: steps` | 번호 단계형 리스트 | title, desc |
| `::: compare-grid` | 비교 카드 (note 칩 포함) | title, desc, note |
| `::: tool-card` | 색상 헤더 도구 배너 | icon, title, desc, tag, color |
| `::: workflow` | 화살표 연결 수평 흐름 (4~5단 순서도) | icon, title, meta |
| `::: plan-grid` | 요금제·플랜 카드 | title, tag, meta, note, featured |
| `::: skill-list` | 아이콘 가로 행 목록 | icon, title, desc |
| `::: badge-grid` | 조밀한 서비스 뱃지 그리드 | icon, title, tag |
| `::: columns` | 2~5단 균등 배치 | title, desc |
| `::: bottom-list` | 본문 + 하단 칩 배치 | title, desc, meta(파이프 구분) |
| `::: compare-2col` | 2단 비교 + 하단 결론 | title, meta(파이프 구분), note |
| `::: alert-box` | 알림/팁 박스 | type(tip·warn·success·danger), icon, title, desc |
| `::: command-block` | 터미널 명령어 블록 | label, meta(언어), desc(명령어) |
| `::: tabs` | 탭 전환 UI | id, label, desc |
| `::: faq-accordion` | 아코디언 FAQ | title(질문), desc(답변) |
| `::: prompt-example` | AI 프롬프트 예시 | title(레이블), desc(프롬프트) |
| `::: stat-highlight` | 수치 강조 카드 | icon(수치), title, desc, color |

| 표준 키 (Standard) | 역할 (Role) | 대응하는 기존 키 (Legacy Mapping) | 비고 |
| --- | --- | --- | --- |
| **`icon`** | **상징** | `icon`, `logo`, `name`(아이콘 부분) | 이모지 또는 이미지 URL |
| **`title`** | **제목** | `title`, `name`(텍스트 부분), `col` | 항목의 가장 핵심적인 명칭 |
| **`desc`** | **설명** | `desc`, `description`, `body`, `tagline` | 한두 문장의 상세 설명 |
| **`tag`** | **뱃지** | `tag`, `badge`, `type` | 우측 상단의 작은 강조 라벨 |
| **`meta`** | **정보** | `note`, `tool`, `features`, `items`, `points` | 부가 데이터 (` |
| **`color`** | **강조색** | `color` (신설) | **개별 항목의 강제 색상 지정 (Hex)** |

## icon-grid 예시: 이 도구가 잘하는 일

::: icon-grid
- icon: ⚡
  title: 빠른 작업
  desc: 반복 작업을 줄이고 결과물을 빠르게 만듭니다.
- icon: 🎨
  title: 쉬운 디자인
  desc: 템플릿과 프리셋으로 초보자도 보기 좋은 결과를 만들 수 있습니다.
- icon: 📱
  title: 모바일 친화
  desc: 스마트폰에서도 주요 기능을 바로 사용할 수 있습니다.
- icon: 🤝
  title: 팀 협업
  desc: 링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다.
:::

# 2. 주요 모듈

각 모듈은 독립적으로 사용하거나 함께 연결해 강력한 워크플로우를 구성할 수 있습니다.

## feature-grid 예시: 핵심 기능 카드

::: feature-grid
- tag: 핵심
  icon: 🧠
  title: AI 자동화
  desc: 사용자의 입력을 바탕으로 초안, 편집, 요약, 추천을 자동 생성합니다.
- tag: 실전
  icon: 🧰
  title: 템플릿 활용
  desc: 자주 쓰는 형식을 저장해 같은 품질의 결과물을 반복해서 만들 수 있습니다.
- tag: 공유
  icon: 🔗
  title: 링크 배포
  desc: 완성된 결과를 링크나 파일로 공유하고 팀원 피드백을 받을 수 있습니다.
:::

# 3. 시작하기

처음 사용하는 사람이 따라 할 수 있는 순서로 정리했습니다.

## steps 예시: 기본 사용 흐름

::: steps
- title: 계정 만들기
  desc: 공식 사이트에 접속해 이메일 또는 소셜 계정으로 로그인합니다.
- title: 새 프로젝트 만들기
  desc: 템플릿을 고르거나 빈 프로젝트에서 시작합니다.
- title: 콘텐츠 넣기
  desc: 텍스트, 이미지, 파일, 링크 등 필요한 자료를 추가합니다.
- title: 결과 내보내기
  desc: PDF, 이미지, 영상, 링크 등 목적에 맞는 형식으로 저장합니다.
:::

# 4. 상황별 추천

사용 목적에 따라 시작점이 달라집니다.

## compare-grid 예시: 사용자 유형별 가이드

::: compare-grid
- title: 처음 배우는 사용자
  desc: 무료 플랜과 기본 템플릿으로 시작합니다.
  note: 추천: 기본 워크플로우
- title: 반복 제작자
  desc: 자주 쓰는 형식을 템플릿으로 저장하고 자동화 기능을 활용합니다.
  note: 추천: Pro 기능 검토
- title: 팀 작업
  desc: 공유 링크, 댓글, 권한 관리가 가능한 플랜을 선택합니다.
  note: 추천: 팀 플랜
:::

# 5. 연동 도구

AI Creative Suite와 함께 사용하면 더욱 강력한 도구들입니다.

## tool-card 예시: 추천 도구

::: tool-card
- icon: 🎬
  name: Runway Gen-4
  tagline: runwayml.com · 영상 편집 특화 AI 플랫폼
  badge: 무료/Pro
  color: "#7C3AED"
- icon: 🖼️
  name: Midjourney
  tagline: midjourney.com · 이미지 생성 AI
  badge: Pro
  color: "#E11D48"
:::

# 6. 제작 흐름

아이디어에서 배포까지 전체 과정을 한눈에 파악하세요.

## workflow 예시: 5단계 제작 순서도

::: workflow
- icon: 💡
  name: 아이디어
  tool: Claude AI
- icon: ⚡
  name: 초안 생성
  tool: Gamma
- icon: 🎨
  name: 디자인 보정
  tool: Canva
- icon: ✅
  name: 검토·수정
  tool: 팀 협업
- icon: 📤
  name: 공유·배포
  tool: 링크/PDF
:::

# 7. 요금제

세 가지 플랜 중 목적에 맞는 플랜을 선택하세요.

## plan-grid 예시: Free / Pro / Enterprise

::: plan-grid
- title: Free
  badge: 무료
  features: 기본 기능 모두 사용 | 하루 10회 사용 | 커뮤니티 지원 | 5GB 저장공간
  note: 지금 바로 시작
- title: Pro
  badge: 추천
  featured: "true"
  features: 무제한 사용 | 우선 지원 | 고급 기능 전체 | API 접근 | 50GB 저장공간
  note: 월 $20
- title: Enterprise
  badge: 팀
  features: 팀 계정 관리 | 전용 지원 담당 | SLA 보장 | SSO 연동 | 무제한 저장
  note: 문의 필요
:::

# 8. 지원 기능

플랫폼이 제공하는 주요 기능 목록입니다.

## skill-list 예시: 기능 가로 행 목록

::: skill-list
- icon: 📄
  title: 문서 자동화
  desc: 보고서·제안서를 한 번에 생성합니다
- icon: 🔗
  title: API 연동
  desc: REST API로 기존 시스템과 바로 연결됩니다
- icon: 🤖
  title: AI 처리
  desc: LLM 기반으로 내용을 분류·요약·추출합니다
- icon: 📊
  title: 분석 대시보드
  desc: 실시간 데이터를 시각화하여 인사이트를 제공합니다
:::

# 9. 연동 서비스

주요 서비스와 즉시 연동됩니다.

## badge-grid 예시: 연동 서비스 그리드

::: badge-grid
- icon: 🗃️
  name: PostgreSQL
  type: 데이터베이스
- icon: 🔐
  name: Auth0
  type: 인증
- icon: 📁
  name: S3
  type: 스토리지
- icon: 📬
  name: SendGrid
  type: 이메일
- icon: 💬
  name: Slack
  type: 메시지
- icon: 📈
  name: Grafana
  type: 모니터링
- icon: 🐙
  name: GitHub
  type: 버전관리
- icon: 🧩
  name: Zapier
  type: 자동화
:::

# 10. 사용 시나리오

누가 어떻게 사용하는지 확인하세요.

## columns 예시: 사용자 유형별 3단 배치

::: columns
- title: 개인 사용자
  desc: 직관적인 UI와 기본 템플릿으로 별도 설정 없이 바로 시작할 수 있습니다.
- title: 팀·조직
  desc: 권한 관리와 공유 설정으로 여러 명이 함께 작업 환경을 구성합니다.
- title: 개발자
  desc: API와 웹훅으로 기존 시스템에 통합하거나 자체 워크플로우를 자동화합니다.
:::

# 11. 핵심 요약

## bottom-list 예시: 본문 + 하단 칩 배치

::: bottom-list
- title: AI Creative Suite를 선택해야 하는 이유
  body: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  points: 즉시 시작 | 무설정 기본값 | 5분 온보딩 | 단계별 심화 | 무료 플랜 제공
:::

# 12. 배포 옵션 비교

## compare-2col 예시: 클라우드 vs 자체 호스팅

::: compare-2col
- col: 자체 호스팅
  items: 완전한 데이터 통제 | 비용 최적화 가능 | 커스터마이징 자유 | 초기 설정 필요 | DevOps 역량 필요
  note: 기술팀 보유 시 추천
- col: 클라우드 SaaS
  items: 즉시 사용 가능 | 자동 업데이트 | 전용 지원 서비스 | 사용량 기반 과금 | 99.9% SLA 보장
  note: 빠른 시작에 추천
:::

# 13. 알림 박스

중요도·상태에 따라 색상이 달라지는 알림 박스입니다.

## alert-box 예시: 4가지 유형

::: alert-box
- type: tip
  icon: 💡
  title: 활용 팁
  desc: Pro Search 모드를 사용하면 여러 소스를 교차 검증하여 더 정확한 답변을 얻을 수 있습니다.
- type: warn
  icon: ⚠️
  title: 주의사항
  desc: 무료 플랜은 하루 5회 Pro Search 제한이 있으므로 중요한 질문에 사용하세요.
- type: success
  icon: ✅
  title: 완료
  desc: API 키 설정이 완료되었습니다. 이제 모든 기능을 사용할 수 있습니다.
- type: danger
  icon: 🚨
  title: 경고
  desc: 이 작업은 되돌릴 수 없습니다. 실행 전에 데이터를 반드시 백업하세요.
:::

# 14. 명령어 블록

복사 버튼이 포함된 터미널 명령어 블록입니다.

## command-block 예시: 설치 및 실행 명령어

::: command-block
- label: Terminal
  meta: bash
  desc: npm install -g @anthropic-ai/claude-code
- label: Terminal
  meta: bash
  desc: node templates/build-guide.mjs data/mddata/perplexity.md
- label: PowerShell
  meta: pwsh
  desc: node scripts/md-to-pptx.mjs --all "data/mddata/*.md"
:::

# 15. 탭 전환

클릭으로 내용을 전환하는 탭 UI입니다.

## tabs 예시: OS별 설치 방법

::: tabs
- id: mac
  label: "🍎 macOS"
  desc: |
    brew install node
    npm install -g @anthropic-ai/claude-code
- id: win
  label: "🪟 Windows"
  desc: |
    WSL2를 먼저 설치한 뒤 아래 명령어를 실행합니다.
    npm install -g @anthropic-ai/claude-code
- id: linux
  label: "🐧 Linux"
  desc: |
    sudo apt update && sudo apt install nodejs npm
    npm install -g @anthropic-ai/claude-code
:::

# 16. 아코디언 FAQ

클릭으로 펼치고 접는 FAQ 블록입니다.

## faq-accordion 예시: 자주 묻는 질문

::: faq-accordion
- title: 무료 플랜과 Pro 플랜의 차이는 무엇인가요?
  desc: 무료 플랜은 Quick Search 무제한과 Pro Search 1일 5회를 제공합니다. Pro 플랜은 Pro Search 1일 300회 이상, Deep Research 무제한, 다중 AI 모델 선택이 가능합니다.
- title: Deep Research는 얼마나 걸리나요?
  desc: 일반적으로 10~15분 소요됩니다. 수십 개의 소스를 자동으로 분석하여 논문 수준의 종합 보고서를 생성합니다.
- title: 파일은 어떤 형식을 지원하나요?
  desc: PDF, Word(.docx), Excel(.xlsx) 등 주요 문서 형식을 지원합니다. 최대 수십 MB 파일을 업로드할 수 있습니다.
:::

# 17. 프롬프트 예시

AI에게 전달하는 프롬프트를 시각적으로 구분해서 보여주는 블록입니다.

## prompt-example 예시: 리서치 프롬프트

::: prompt-example
- title: Deep Research 프롬프트 예시
  desc: |
    주제: 2025년 생성형 AI 시장 동향
    범위: 국내외 주요 기업 전략 및 시장 점유율
    형식: 경쟁 분석표 포함, 3페이지 분량
    출처: 최근 6개월 이내 자료 우선
- title: 경쟁사 비교 분석 프롬프트
  desc: |
    비교 대상: ChatGPT, Gemini, Perplexity, Genspark
    항목: 가격, 실시간 검색, 파일 분석, 이미지 생성
    결과물: 표 형식으로 정리해줘 (출처 포함)
:::

# 18. 수치 강조

큰 숫자나 핵심 지표를 시각적으로 강조하는 카드입니다.

## stat-highlight 예시: 핵심 수치

::: stat-highlight
- icon: 200K
  title: 컨텍스트 토큰
  desc: 업계 최장 메모리
  color: "#10A37F"
- icon: 3종
  title: 모델 라인업
  desc: Haiku · Sonnet · Opus
  color: "#D97757"
- icon: 무료
  title: 기본 사용
  desc: 카드 등록 불필요
  color: "#6366F1"
- icon: 99.9%
  title: 가동률 SLA
  desc: 엔터프라이즈 보장
  color: "#06B6D4"
:::
