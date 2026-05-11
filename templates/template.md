---
title: 도구 이름 완전 활용 가이드
subtitle: 한 줄 요약 설명을 여기에 적어주세요
style: ai-chat
badge: NEW · 2026
logo: 🤖
heroCta:
  label: 공식 사이트 열기
  url: https://example.com
stats:
  - value: "무료"
    label: "시작 가능"
  - value: "한국어"
    label: "지원"
  - value: "모바일"
    label: "앱 제공"
done:
  title: 이제 첫 프로젝트를 만들어보세요
  subtitle: 핵심 기능을 하나씩 눌러보며 자신만의 워크플로우를 완성해보세요.
  ctaLabel: 공식 사이트 방문
  ctaUrl: https://example.com
footer:
  - 이 파일은 새 가이드 작성용 템플릿입니다.
  - "스타일은 `templates/styles.json`의 `style` 키로 선택됩니다."
---

# 1. 빠른 소개

도구의 핵심 가치를 2-3문장으로 설명하세요. 이 영역은 일반 문단으로 렌더링됩니다.

## 이 도구가 잘하는 일

`icon-grid`는 기존 HTML의 네모 박스 아이콘 배열을 MD에서 표현하기 위한 shortcode입니다.

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
  title: 협업
  desc: 링크 공유와 댓글로 팀 작업을 이어갈 수 있습니다.
:::

## 핵심 기능 카드

`feature-grid`는 조금 더 설명이 긴 카드 배열입니다. `tag`, `icon`, `title`, `desc` 필드를 사용합니다.

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

# 2. 시작하기

처음 사용하는 사람이 따라 할 수 있는 순서로 적습니다.

## 기본 사용 흐름

`steps`는 번호가 붙은 단계형 박스입니다.

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

## 기본 명령 또는 예시

코드 블록은 어두운 박스로 렌더링됩니다.

```bash
# 예시 명령어 또는 체크리스트
open https://example.com
```

> 💡 **TIP**: 인용문은 브랜드 색의 팁 박스로 렌더링됩니다. 짧은 조언이나 주의사항에 사용하세요.

# 3. 비교와 선택

비슷한 기능이나 플랜을 비교할 때는 표 또는 `compare-grid`를 사용합니다.

## 상황별 추천

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

## 표 예시

| 항목 | 무료 | 유료 |
|------|------|------|
| 기본 사용 | 가능 | 가능 |
| 고급 기능 | 제한 | 확장 |
| 팀 협업 | 제한 | 지원 |

# 4. 도구 소개 카드

`tool-card`는 도구/서비스의 컬러 헤더 배너입니다. `color`에 hex를 지정하면 그라디언트가 자동 적용됩니다.

::: tool-card
- icon: 🎬
  name: Runway Gen-4
  tagline: runwayml.com · 영상 편집 특화 AI 플랫폼
  badge: 무료/Pro
  color: "#7C3AED"
:::

`workflow`는 화살표로 연결된 수평 프로세스 흐름입니다. `tool` 필드는 각 단계의 부제(사용 도구 등)입니다.

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
- icon: 📤
  name: 공유·배포
  tool: 링크/PDF
:::

# 5. 플랜·가격표 (plan-grid)

`plan-grid`는 요금제·플랜 카드입니다. `featured: "true"`를 설정하면 강조 스타일이 적용됩니다.

## 플랜 비교

::: plan-grid
- title: Free
  badge: 무료
  features: 기본 기능 모두 사용 | 하루 10회 사용 | 커뮤니티 지원
  note: 지금 바로 시작
- title: Pro
  badge: 추천
  featured: "true"
  features: 무제한 사용 | 우선 지원 | 고급 기능 전체 | API 접근
  note: 월 $20
- title: Enterprise
  badge: 팀
  features: 팀 계정 관리 | 전용 지원 담당 | SLA 보장 | SSO 연동
  note: 문의 필요
:::

# 6. 스킬·기능 목록 (skill-list)

`skill-list`는 아이콘 + 제목 + 설명이 가로로 나열되는 행 형태입니다. 기능 목록이나 연동 서비스를 나열할 때 사용합니다.

## 주요 기능

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

# 7. 연동 서비스 뱃지 (badge-grid)

`badge-grid`는 많은 서비스·도구를 작은 카드로 조밀하게 표시합니다. `name`과 `type`(카테고리) 필드를 사용합니다.

## 지원 연동 서비스

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
:::

# 8. 좌우 N단 배치 (columns)

`columns`는 2~5단을 균등하게 배치하는 레이아웃입니다. 아이템 수에 따라 자동으로 열 수가 결정됩니다.

## 사용 시나리오별 비교

::: columns
- title: 개인 사용자
  desc: 직관적인 UI와 기본 템플릿으로 별도 설정 없이 바로 시작할 수 있습니다.
- title: 팀·조직
  desc: 권한 관리와 공유 설정으로 여러 명이 함께 작업 환경을 구성합니다.
- title: 개발자
  desc: API와 웹훅으로 기존 시스템에 통합하거나 자체 워크플로우를 자동화합니다.
:::

# 9. 하단 요점 배치 (bottom-list)

`bottom-list`는 상단에 본문 설명을 넣고 하단에 핵심 요점을 칩(pill) 형태로 배치합니다. 단일 아이템(`-`)만 사용합니다. `points`는 `|`로 구분합니다.

## 핵심 정리

::: bottom-list
- title: 이 도구를 선택해야 하는 이유
  body: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  points: 즉시 시작 | 무설정 기본값 | 5분 온보딩 | 단계별 심화 | 무료 플랜 제공
:::

# 10. 2단 비교 (compare-2col)

`compare-2col`은 두 가지 선택지를 나란히 비교하고 각 항목의 특징을 `|`로 구분된 목록으로 보여줍니다. 왼쪽은 강조 스타일, 오른쪽은 일반 스타일이 자동 적용됩니다.

## A vs B 비교

::: compare-2col
- col: 자체 호스팅
  items: 완전한 데이터 통제 | 비용 최적화 가능 | 커스터마이징 자유 | 초기 설정 필요
  note: 기술팀 보유 시 추천
- col: 클라우드 SaaS
  items: 즉시 사용 가능 | 자동 업데이트 | 전용 지원 서비스 | 사용량 기반 과금
  note: 빠른 시작에 추천
:::

# 11. 마무리 체크리스트

## 배포 전 확인

- 제목, 부제목, `style` 키를 채웠는가
- 카드 배열은 아래 shortcode 중 하나로 표현했는가
- 긴 설명은 일반 문단이나 표로 분리했는가
- 링크와 푸터 정보가 정확한가

---

## 작성 규칙 요약 (전체 shortcode)

| shortcode | 용도 | 주요 필드 |
|-----------|------|-----------|
| `::: icon-grid` | 아이콘 박스 배열 | icon, title, desc |
| `::: feature-grid` | 설명형 카드 배열 | tag, icon, title, desc |
| `::: steps` | 번호 단계형 리스트 | title, desc |
| `::: compare-grid` | 비교 카드 (note 칩 포함) | title, desc, note |
| `::: tool-card` | 색상 헤더 도구 배너 | icon, name, tagline, badge, color |
| `::: workflow` | 화살표 연결 수평 흐름 (4~5단 순서도) | icon, name, tool |
| `::: plan-grid` | 요금제·플랜 카드 | title, badge, featured, features, note |
| `::: skill-list` | 아이콘 가로 행 목록 | icon, title, desc |
| `::: badge-grid` | 조밀한 서비스 뱃지 그리드 | icon, name, type |
| `::: columns` | 2~5단 균등 배치 | title, desc |
| `::: bottom-list` | 본문 + 하단 칩 배치 | title, body, points(파이프 구분) |
| `::: compare-2col` | 2단 비교 + 하단 결론 | col, items(파이프 구분), note |

- 스타일 색상은 `templates/styles.json`에서 가져옵니다.
- PPTX 변환은 `scripts/md-to-pptx.mjs`, HTML 변환은 `templates/build-guide.mjs`를 사용합니다.
- 레이아웃·치수 설정은 `scripts/pptdesign.config.json`에서 JSON으로 관리합니다.
