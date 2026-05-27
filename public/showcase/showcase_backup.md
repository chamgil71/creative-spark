---
title: Creative Spark 숏코드 완전 가이드
subtitle: HTML→MD→PPTX 파이프라인이 지원하는 전체 숏코드 예시
style: creative
badge: 2026 · DEMO
logo: ✨
heroCta:
  label: 파이프라인 문서 보기
  url: https://example.com
stats:
  - value: "15종"
    label: "숏코드"
  - value: "3단계"
    label: "파이프라인"
  - value: "자동"
    label: "HTML 역변환"
done:
  title: 나만의 가이드를 만들어보세요
  subtitle: templates/template.md를 복사해서 내용을 채우면 됩니다.
  ctaLabel: 시작하기
  ctaUrl: https://example.com
footer:
  - 이 파일은 지원하는 전체 숏코드를 보여주는 데모입니다.
  - "shortcode-map.json에서 HTML→MD 변환 규칙을 확인할 수 있습니다."
---

# 0. 스타일 선택

- icon: 🤖
  title: ai-chat
  desc: AI 챗봇 (그린) — ChatGPT·Claude 등 대화형 AI 가이드
  tag: style: ai-chat
  color: "#10A37F"
- icon: 💻
  title: ai-dev
  desc: AI 개발 도구 (오렌지) — Cursor·GitHub Copilot 등 개발 도구
  tag: style: ai-dev
  color: "#D97757"

MD 파일 frontmatter에서 `style: <키>` 로 선택합니다.

::: tool-card
- icon: 🤖
  title: ai-chat
  desc: AI 챗봇 (그린) — ChatGPT·Claude 등 대화형 AI 가이드
  tag: style: ai-chat
  color: "#10A37F"
- icon: 💻
  title: ai-dev
  desc: AI 개발 도구 (오렌지) — Cursor·GitHub Copilot 등 개발 도구
  tag: style: ai-dev
  color: "#D97757"
- icon: 📚
  title: knowledge
  desc: 노트 & 지식관리 (퍼플) — Notion·Obsidian 등 지식 관리 도구
  tag: style: knowledge
  color: "#6366F1"
- icon: ⚡
  title: productivity
  desc: 생산성 유틸 (블루) — 일정·할일·자동화 도구
  tag: style: productivity
  color: "#1565C0"
- icon: 🎨
  title: creative
  desc: 크리에이티브 AI (마젠타) — 이미지·영상·디자인 생성 도구
  tag: style: creative
  color: "#9B59B6"
- icon: 🔒
  title: security
  desc: 보안 & 인프라 (사이언) — 보안·DevOps·클라우드 인프라
  tag: style: security
  color: "#06B6D4"
- icon: 💰
  title: finance
  desc: 재테크 & 금융 (골드) — 투자·회계·금융 분석 도구
  tag: style: finance
  color: "#D4A017"
- icon: 🚀
  title: future
  desc: 퓨처 AI (네온 라임) — 미래 기술·리서치·트렌드
  tag: style: future
  color: "#84CC16"
- icon: 🏢
  title: enterprise
  desc: 엔터프라이즈 (슬레이트) — 팀·조직·비즈니스 솔루션
  tag: style: enterprise
  color: "#475569"
- icon: 🎬
  title: media
  desc: 미디어 & 콘텐츠 (로즈) — SNS·영상·콘텐츠 제작 도구
  tag: style: media
  color: "#E11D48"
:::

# 1. 아이콘 그리드
- icon: ⚡
  title: 빠른 작업
  desc: 반복 작업을 줄이고 결과물을 빠르게 만듭니다.
- icon: 🎨
  title: 쉬운 디자인
  desc: 템플릿과 프리셋으로 초보자도 보기 좋은 결과를 만듭니다.
- icon: 📱
  title: 모바일 친화
  desc: 스마트폰에서도 주요 기능을 바로 사용할 수 있습니다.
- icon: 🤝
  title: 팀 협업
  desc: 링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다.

## icon-grid — 이모지 카드 격자

::: icon-grid
- icon: ⚡
  title: 빠른 작업
  desc: 반복 작업을 줄이고 결과물을 빠르게 만듭니다.
- icon: 🎨
  title: 쉬운 디자인
  desc: 템플릿과 프리셋으로 초보자도 보기 좋은 결과를 만듭니다.
- icon: 📱
  title: 모바일 친화
  desc: 스마트폰에서도 주요 기능을 바로 사용할 수 있습니다.
- icon: 🤝
  title: 팀 협업
  desc: 링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다.
:::

# 2. 기능 카드 feature-grid
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


## feature-grid — 태그 + 아이콘 + 설명

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

# 3. 단계 흐름 steps

- title: 계정 만들기
  desc: 공식 사이트에 접속해 이메일 또는 소셜 계정으로 로그인합니다.
- title: 새 프로젝트 만들기
  desc: 템플릿을 고르거나 빈 프로젝트에서 시작합니다.
- title: 콘텐츠 넣기
  desc: 텍스트, 이미지, 파일, 링크 등 필요한 자료를 추가합니다.
- title: 결과 내보내기
  desc: PDF, 이미지, 영상, 링크 등 목적에 맞는 형식으로 저장합니다.


## steps — 순서형 단계 목록

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

# 4. 비교 카드 compare-grid

- title: 처음 배우는 사용자
  desc: 무료 플랜과 기본 템플릿으로 시작합니다.
  note: 추천 — 기본 워크플로우
- title: 반복 제작자
  desc: 자주 쓰는 형식을 저장하고 자동화 기능을 활용합니다.
  note: 추천 — Pro 기능 검토
- title: 팀 작업
  desc: 공유 링크, 댓글, 권한 관리가 가능한 플랜을 선택합니다.
  note: 추천 — 팀 플랜

## compare-grid — 사용자 유형별 비교

::: compare-grid
- title: 처음 배우는 사용자
  desc: 무료 플랜과 기본 템플릿으로 시작합니다.
  note: 추천 — 기본 워크플로우
- title: 반복 제작자
  desc: 자주 쓰는 형식을 저장하고 자동화 기능을 활용합니다.
  note: 추천 — Pro 기능 검토
- title: 팀 작업
  desc: 공유 링크, 댓글, 권한 관리가 가능한 플랜을 선택합니다.
  note: 추천 — 팀 플랜
:::

# 5. 도구 카드 tool-card
- icon: 🎬
  title: Runway Gen-4
  desc: 영상 편집 특화 AI 플랫폼
  tag: 무료/Pro
  meta: 영상 생성|배경 제거|모션 브러시
  color: "#7C3AED"
- icon: 🖼️
  title: Midjourney
  desc: 텍스트로 고품질 이미지를 생성하는 AI
  tag: Pro
  meta: 이미지 생성|스타일 변환|업스케일링
  color: "#E11D48"

## tool-card — 브랜드 배너 카드


::: tool-card
- icon: 🎬
  title: Runway Gen-4
  desc: 영상 편집 특화 AI 플랫폼
  tag: 무료/Pro
  meta: 영상 생성|배경 제거|모션 브러시
  color: "#7C3AED"
- icon: 🖼️
  title: Midjourney
  desc: 텍스트로 고품질 이미지를 생성하는 AI
  tag: Pro
  meta: 이미지 생성|스타일 변환|업스케일링
  color: "#E11D48"
:::

# 6. 워크플로우 workflow

- icon: 💡
  title: 아이디어
  meta: Claude AI
- icon: ⚡
  title: 초안 생성
  meta: Gamma
- icon: 🎨
  title: 디자인 보정
  meta: Canva
- icon: ✅
  title: 검토·수정
  meta: 팀 협업
- icon: 📤
  title: 공유·배포
  meta: 링크/PDF
- icon: 💡
  title: 추가하면?
  meta: 어디로?

## workflow — 프로세스 흐름도

::: workflow
- icon: 💡
  title: 아이디어
  meta: Claude AI
- icon: ⚡
  title: 초안 생성
  meta: Gamma
- icon: 🎨
  title: 디자인 보정
  meta: Canva
- icon: ✅
  title: 검토·수정
  meta: 팀 협업
- icon: 📤
  title: 공유·배포
  meta: 링크/PDF
- icon: 💡
  title: 추가하면?
  meta: 어디로?
:::

# 7. 요금제 plan-grid

- title: Free
  tag: 무료
  meta: 기본 기능 모두 사용|하루 10회 사용|커뮤니티 지원|5GB 저장공간
  note: 지금 바로 시작
- title: Pro
  tag: 추천
  featured: "true"
  meta: 무제한 사용|우선 지원|고급 기능 전체|API 접근|50GB 저장공간
  note: 월 $20
- title: Enterprise
  tag: 팀
  meta: 팀 계정 관리|전용 지원 담당|SLA 보장|SSO 연동|무제한 저장
  note: 문의 필요

## plan-grid — Free / Pro / Enterprise

::: plan-grid
- title: Free
  tag: 무료
  meta: 기본 기능 모두 사용|하루 10회 사용|커뮤니티 지원|5GB 저장공간
  note: 지금 바로 시작
- title: Pro
  tag: 추천
  featured: "true"
  meta: 무제한 사용|우선 지원|고급 기능 전체|API 접근|50GB 저장공간
  note: 월 $20
- title: Enterprise
  tag: 팀
  meta: 팀 계정 관리|전용 지원 담당|SLA 보장|SSO 연동|무제한 저장
  note: 문의 필요
:::

# 8. 좌우 2단 비교

- title: 자체 호스팅
  meta: 완전한 데이터 통제|비용 최적화 가능|커스터마이징 자유|초기 설정 필요|DevOps 역량 필요
  note: 기술팀 보유 시 추천
- title: 클라우드 SaaS
  meta: 즉시 사용 가능|자동 업데이트|전용 지원 서비스|사용량 기반 과금|99.9% SLA 보장
  note: 빠른 시작에 추천


## compare-2col — 클라우드 vs 자체 호스팅

::: compare-2col
- title: 자체 호스팅
  meta: 완전한 데이터 통제|비용 최적화 가능|커스터마이징 자유|초기 설정 필요|DevOps 역량 필요
  note: 기술팀 보유 시 추천
- title: 클라우드 SaaS
  meta: 즉시 사용 가능|자동 업데이트|전용 지원 서비스|사용량 기반 과금|99.9% SLA 보장
  note: 빠른 시작에 추천
:::

# 9. 요점 정리

- title: 이 도구를 선택해야 하는 이유
  desc: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  meta: 즉시 시작|무설정 기본값|5분 온보딩|단계별 심화|무료 플랜 제공


## bottom-list — 본문 + 하단 칩 배치

::: bottom-list
- title: 이 도구를 선택해야 하는 이유
  desc: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  meta: 즉시 시작|무설정 기본값|5분 온보딩|단계별 심화|무료 플랜 제공
:::

# 10. 알림 박스 alert-box

- type: tip
  title: 💡 핵심 팁
  desc: shortcode-map.json을 수정하면 HTML→MD 변환 규칙을 추가하거나 변경할 수 있습니다.

  - type: warn
  title: ⚠️ 주의사항
  desc: 잘못된 YAML frontmatter는 build-guide.mjs 오류를 유발합니다. 들여쓰기를 확인하세요.

## alert-box — TIP / WARN / SUCCESS / DANGER

::: alert-box
- type: tip
  title: 💡 핵심 팁
  desc: shortcode-map.json을 수정하면 HTML→MD 변환 규칙을 추가하거나 변경할 수 있습니다.
:::

::: alert-box
- type: warn
  title: ⚠️ 주의사항
  desc: 잘못된 YAML frontmatter는 build-guide.mjs 오류를 유발합니다. 들여쓰기를 확인하세요.
:::

# 11. FAQ 아코디언 faq-accordion
- title: 무료로 사용할 수 있나요?
  desc: 네, 기본 기능은 무료 플랜으로 사용할 수 있습니다. 고급 기능은 Pro 플랜에서 제공됩니다.
- title: 어떤 파일 형식을 지원하나요?
  desc: HTML, Markdown, PPTX 형식을 지원합니다. shortcode-map.json으로 HTML 역변환 규칙을 관리합니다.
- title: 커스텀 스타일을 적용할 수 있나요?
  desc: config/styles.json에서 색상 프리셋을 정의하고, frontmatter의 style 키로 선택할 수 있습니다.

## faq-accordion — 자주 묻는 질문

::: faq-accordion
- title: 무료로 사용할 수 있나요?
  desc: 네, 기본 기능은 무료 플랜으로 사용할 수 있습니다. 고급 기능은 Pro 플랜에서 제공됩니다.
- title: 어떤 파일 형식을 지원하나요?
  desc: HTML, Markdown, PPTX 형식을 지원합니다. shortcode-map.json으로 HTML 역변환 규칙을 관리합니다.
- title: 커스텀 스타일을 적용할 수 있나요?
  desc: config/styles.json에서 색상 프리셋을 정의하고, frontmatter의 style 키로 선택할 수 있습니다.
:::

# 12. 프롬프트 예시 prompt-example
- title: 가이드 문서 생성 프롬프트
  desc: 다음 도구에 대한 활용 가이드를 작성해 주세요. icon-grid로 핵심 기능 4가지, feature-grid로 사용 사례 3가지, steps로 시작 방법 4단계를 포함해 주세요.

## prompt-example — 실전 프롬프트 박스
::: prompt-example
- title: 가이드 문서 생성 프롬프트
  desc: 다음 도구에 대한 활용 가이드를 작성해 주세요. icon-grid로 핵심 기능 4가지, feature-grid로 사용 사례 3가지, steps로 시작 방법 4단계를 포함해 주세요.
:::
