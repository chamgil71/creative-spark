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

# 5. 마무리 체크리스트

## 배포 전 확인

- 제목, 부제목, `style` 키를 채웠는가
- 카드 배열은 `icon-grid`, `feature-grid`, `steps`, `compare-grid`, `tool-card`, `workflow` 중 하나로 표현했는가
- 긴 설명은 일반 문단이나 표로 분리했는가
- 링크와 푸터 정보가 정확한가

---

## 작성 규칙 요약

- `# 제목`은 큰 섹션입니다.
- `## 제목`은 카드 제목입니다.
- `::: icon-grid`는 아이콘 네모 박스 배열입니다.
- `::: feature-grid`는 설명형 카드 배열입니다.
- `::: steps`는 번호가 붙은 단계형 리스트입니다.
- `::: compare-grid`는 비교 카드 배열입니다.
- `::: tool-card`는 색상 헤더 도구 배너입니다. (`color` hex 지정 가능)
- `::: workflow`는 화살표 연결 수평 프로세스 흐름입니다.
- 스타일 색상은 `templates/styles.json`에서 가져옵니다.
