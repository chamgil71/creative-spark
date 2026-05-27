---
title: Creative Spark 숏코드 완전 가이드
subtitle: "HTML ➡️ MD ➡️ PPTX 파이프라인이 지원하는 전체 표준 숏코드 및 프리미엄 시각화 스펙 시연"
style: creative
badge: 2026 · DEMO HUB (v1.1)
logo: ✨
heroCta:
  label: 쇼케이스 시작하기
  url: #visualizations
stats:
  - value: "18종"
    label: "전체 표준 숏코드"
  - value: "3단계"
    label: "자동 컴파일 파이프라인"
  - value: "cols=N"
    label: "가변 격자 제어"
done:
  title: 나만의 가이드를 만들어보세요
  subtitle: templates/template.md를 복사해서 내용을 채우면 정교하게 자동 빌드됩니다.
  ctaLabel: 공식 제작 지침서 읽기
  ctaUrl: "/docs/guide-creation.md"
footer:
  - "이 파일은 Creative Spark v1.1 스펙 전체를 보여주는 통합 마스터 쇼케이스입니다."
  - "정석 연동: src/data/guides.json 설정을 통해 자동 React/스탠드얼론 통합 구동 완료."
---

# 1. 신규 3대 동적 시각화 특화 숏코드
오리지널의 아름답고 독창적인 3대 비주얼 요소를 온전히 마크다운으로 포용하여 CSS drift, pulse, popover 애니메이션을 통해 입체적으로 재현합니다.

## Obsidian 둥둥 지식 그래프 (network-box)
Obsidian의 노드 성단 뷰어를 모방하여 넘실넘실 유영하는 3D형 은하수 그래프 펄스 비주얼입니다.

**[작성 방법 마크다운 예시]**
```md
::: network-box
- title: "크리에이티브 스파크 코어"
  color: "#EC4899"
- title: "깃 플로우 스트립"
  meta: "git-flow-strip"
  color: "#10B981"
- title: "가상 에디터 박스"
  meta: "editor-box"
  color: "#3B82F6"
- title: "가변 그리드 파서"
  meta: "cols=N"
  color: "#F59E0B"
:::
```

**[실제 동작 비주얼 결과물]**
::: network-box
- title: "크리에이티브 스파크 코어"
  color: "#EC4899"
- title: "깃 플로우 스트립"
  meta: "git-flow-strip"
  color: "#10B981"
- title: "가상 에디터 박스"
  meta: "editor-box"
  color: "#3B82F6"
- title: "가변 그리드 파서"
  meta: "cols=N"
  color: "#F59E0B"
:::

---

## VS Code 가상 에디터 창 (editor-box)
VS Code 모양의 어두운 테마 디자인, 파일 탭 UI, 좌측 행 번호 자동 배열 기능이 가미된 가상 코드 편집기 화면입니다.

**[작성 방법 마크다운 예시]**
```md
::: editor-box
- title: "shortcode-map.json"
  tag: "json"
  desc: |
    {
      "git-flow-strip": {
        "htmlClasses": ["flow-branches", "branch-row"],
        "itemSelector": ".branch-row"
      },
      "editor-box": {
        "htmlClasses": ["editor-sim"],
        "itemSelector": ".editor-sim"
      }
    }
:::
```

**[실제 동작 비주얼 결과물]**
::: editor-box
- title: "shortcode-map.json"
  tag: "json"
  desc: |
    {
      "git-flow-strip": {
        "htmlClasses": ["flow-branches", "branch-row"],
        "itemSelector": ".branch-row"
      },
      "editor-box": {
        "htmlClasses": ["editor-sim"],
        "itemSelector": ".editor-sim"
      }
    }
:::

---

## GitHub 브랜치 커밋 로그 흐름도 (git-flow-strip)
깃허브 브랜치와 커밋 트리를 어두운 터미널 다이어그램 형식으로 표현하며, 커밋 노드에 마우스를 올릴 시 디테일한 커밋 상세 목록 팝오버가 사르르 노출됩니다.

**[작성 방법 마크다운 예시]**
```md
::: git-flow-strip
- title: "main"
  tag: "v1.1.0"
  meta: "신규 컴포넌트 숏코드 규격 탑재 완료|PPTX 슬라이드 렌더러 안전 동기화 완수"
  color: "#10B981"
- title: "feature/visuals"
  tag: "Commit 701"
  meta: "Obsidian 3D 지식 그래프 drift 애니메이션 완비|VS Code 에디터 창 라인 넘버러 구현 완료"
  color: "#3B82F6"
:::
```

**[실제 동작 비주얼 결과물]**
::: git-flow-strip
- title: "main"
  tag: "v1.1.0"
  meta: "신규 컴포넌트 숏코드 규격 탑재 완료|PPTX 슬라이드 렌더러 안전 동기화 완수"
  color: "#10B981"
- title: "feature/visuals"
  tag: "Commit 701"
  meta: "Obsidian 3D 지식 그래프 drift 애니메이션 완비|VS Code 에디터 창 라인 넘버러 구현 완료"
  color: "#3B82F6"
:::

---

# 2. cols=N 가변 다단 격자 제어 데모
작성자가 숏코드 선언 시 `cols=N` 인수를 지정하여 격자형 카드들의 단수를 직접 통제하고 화면이 찌그러지는 현상을 원천 방어합니다.

## cols=3 컬럼 그리드 카드
**[작성 방법 마크다운 예시]**
```md
::: feature-grid cols=3
- icon: "🔮"
  title: "기획 & 디자인"
  desc: " harmony 색상 테마 및 HSL 컬러 자동 생성"
  color: "#FFF7ED"
- icon: "⚡"
  title: "초고속 렌더링"
  desc: "Vite & React 번들링 파이프라인 가동"
  color: "#F0FDF4"
- icon: "📦"
  title: "스탠드얼론"
  desc: "1.3MB 크기의 전천후 단일 HTML 번들 파일"
  color: "#EBF2FF"
:::
```

**[실제 동작 비주얼 결과물]**
::: feature-grid cols=3
- icon: "🔮"
  title: "기획 & 디자인"
  desc: " harmony 색상 테마 및 HSL 컬러 자동 생성"
  color: "#FFF7ED"
- icon: "⚡"
  title: "초고속 렌더링"
  desc: "Vite & React 번들링 파이프라인 가동"
  color: "#F0FDF4"
- icon: "📦"
  title: "스탠드얼론"
  desc: "1.3MB 크기의 전천후 단일 HTML 번들 파일"
  color: "#EBF2FF"
:::

---

## cols=4 요금/플랜 격자 카드
**[작성 방법 마크다운 예시]**
```md
::: plan-grid cols=4
- title: "Free 체험판"
  tag: "체험용"
  meta: "기본 숏코드 10종 지원|로컬 빌드 및 PPTX 변환|기본 가이드라인 포함"
  desc: "비용 없음"
- title: "Spark Pro"
  tag: "추천"
  meta: "3대 특화 숏코드 100% 지원|cols=N 컬럼 통제 기능|프리미엄 HSL 테마 무제한"
  desc: "$9.99 / 월"
  featured: "true"
  color: "#6366F1"
- title: "Spark Enterprise"
  tag: "기업용"
  meta: "독점 비주얼 커스텀 지원|전용 빌더 서브에이전트 배치|SLA 성능 및 업타임 보증"
  desc: "별도 문의"
  color: "#1E293B"
- title: "Custom DIY"
  tag: "맞춤형"
  meta: "필요한 기능만 조립|자율 파트너십 구축|일대일 빌딩 밀착 서포트"
  desc: "견적 기반"
  color: "#64748B"
:::
```

**[실제 동작 비주얼 결과물]**
::: plan-grid cols=4
- title: "Free 체험판"
  tag: "체험용"
  meta: "기본 숏코드 10종 지원|로컬 빌드 및 PPTX 변환|기본 가이드라인 포함"
  desc: "비용 없음"
- title: "Spark Pro"
  tag: "추천"
  meta: "3대 특화 숏코드 100% 지원|cols=N 컬럼 통제 기능|프리미엄 HSL 테마 무제한"
  desc: "$9.99 / 월"
  featured: "true"
  color: "#6366F1"
- title: "Spark Enterprise"
  tag: "기업용"
  meta: "독점 비주얼 커스텀 지원|전용 빌더 서브에이전트 배치|SLA 성능 및 업타임 보증"
  desc: "별도 문의"
  color: "#1E293B"
- title: "Custom DIY"
  tag: "맞춤형"
  meta: "필요한 기능만 조립|자율 파트너십 구축|일대일 빌딩 밀착 서포트"
  desc: "견적 기반"
  color: "#64748B"
:::

---

# 3. 스타일 프리셋 (`style` 키 선택)
마크다운 frontmatter에서 `style: <키>`를 선택하여 고유의 고대비 Harmony 브랜드 칼라셋을 컴파일러가 자동 적용합니다.

**[작성 방법 마크다운 예시]**
```md
::: tool-box
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
:::
```

**[실제 동작 비주얼 결과물]**
::: tool-box
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
:::

---

# 4. 표준 컴포넌트 숏코드 라이브러리
기존 및 신형 표준 규격 숏코드들의 HTML 변환 스펙과 PPTX 도식화 레이아웃을 설명하고 시연합니다.

## icon-grid — 이모지 카드 격자
**[작성 방법 마크다운 예시]**
```md
::: icon-grid
- icon: ⚡
  title: 빠른 작업
  desc: 반복 작업을 줄이고 결과물을 빠르게 만듭니다.
:::
```

**[실제 동작 비주얼 결과물]**
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

---

## feature-grid — 태그 + 아이콘 + 설명
**[작성 방법 마크다운 예시]**
```md
::: feature-grid
- tag: 핵심
  icon: 🧠
  title: AI 자동화
  desc: 사용자의 입력을 바탕으로 초안, 편집, 요약, 추천을 자동 생성합니다.
:::
```

**[실제 동작 비주얼 결과물]**
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

---

## step-list — 순서형 단계 목록
**[작성 방법 마크다운 예시]**
```md
::: step-list
- title: 계정 만들기
  desc: 공식 사이트에 접속해 이메일 또는 소셜 계정으로 로그인합니다.
:::
```

**[실제 동작 비주얼 결과물]**
::: step-list
- title: 계정 만들기
  desc: 공식 사이트에 접속해 이메일 또는 소셜 계정으로 로그인합니다.
- title: 새 프로젝트 만들기
  desc: 템플릿을 고르거나 빈 프로젝트에서 시작합니다.
- title: 콘텐츠 넣기
  desc: 텍스트, 이미지, 파일, 링크 등 필요한 자료를 추가합니다.
- title: 결과 내보내기
  desc: PDF, 이미지, 영상, 링크 등 목적에 맞는 형식으로 저장합니다.
:::

---

## compare-grid — 사용자 유형별 비교 (독립된 note 필드 시연)
하단의 연한 보라색 박스는 `meta`가 아니라 독립된 **`note` 필드**를 통해 여러 줄 텍스트로 안전하게 렌더링된 메모란입니다.

**[작성 방법 마크다운 예시]**
```md
::: compare-grid cols=3
- title: "처음 배우는 사용자"
  desc: "무료 플랜과 기본 템플릿으로 시작합니다."
  note: "💡 권장 사항: 기본 온보딩 워크플로우 숙지"
- title: "반복 제작자"
  desc: "자주 쓰는 형식을 저장하고 자동화 기능을 활용합니다."
  note: "💡 권장 사항: Spark Pro 멤버십 전환"
- title: "팀 작업"
  desc: "공유 링크, 댓글, 권한 관리가 가능한 플랜을 선택합니다."
  note: "💡 권장 사항: 팀 전용 라이선스 부여"
:::
```

**[실제 동작 비주얼 결과물]**
::: compare-grid cols=3
- title: "처음 배우는 사용자"
  desc: "무료 플랜과 기본 템플릿으로 시작합니다."
  note: "💡 권장 사항: 기본 온보딩 워크플로우 숙지"
- title: "반복 제작자"
  desc: "자주 쓰는 형식을 저장하고 자동화 기능을 활용합니다."
  note: "💡 권장 사항: Spark Pro 멤버십 전환"
- title: "팀 작업"
  desc: "공유 링크, 댓글, 권한 관리가 가능한 플랜을 선택합니다."
  note: "💡 권장 사항: 팀 전용 라이선스 부여"
:::

---

## workflow-strip — 프로세스 흐름도
**[작성 방법 마크다운 예시]**
```md
::: workflow-strip
- icon: 💡
  title: 아이디어
  meta: Claude AI
:::
```

**[실제 동작 비주얼 결과물]**
::: workflow-strip
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
:::

---

## compare-split — 클라우드 vs 자체 호스팅 (meta 칩박스 쪼개기 + note 메모 정석 시연)
`meta`에 파이프(`|`) 기호로 나열하면 각각 **개별 단추 칩박스(Badge) 형태로 쪼개져 렌더링**되며, 여러 줄 지원 메모인 **`note` 필드**는 하단의 가이드라인 박스로 독립 안착합니다!

**[작성 방법 마크다운 예시]**
```md
::: compare-split
- title: "자체 호스팅 (On-Premise)"
  meta: "완전한 데이터 주권|초기 비용 절감|커스터마이징 자유"
  note: "💡 사내 인프라 관리 조직 및 DevOps 기술팀 보유 시 적극 추천"
- title: "클라우드 SaaS 서비스"
  meta: "가입 즉시 사용 가능|자동 최신 업데이트|SLA 보장"
  note: "💡 초기 인프라 투자가 불필요하고 빠른 비즈니스 가동에 추천"
:::
```

**[실제 동작 비주얼 결과물]**
::: compare-split
- title: "자체 호스팅 (On-Premise)"
  meta: "완전한 데이터 주권|초기 비용 절감|커스터마이징 자유"
  note: "💡 사내 인프라 관리 조직 및 DevOps 기술팀 보유 시 적극 추천"
- title: "클라우드 SaaS 서비스"
  meta: "가입 즉시 사용 가능|자동 최신 업데이트|SLA 보장"
  note: "💡 초기 인프라 투자가 불필요하고 빠른 비즈니스 가동에 추천"
:::

---

## bottom-list — 본문 + 하단 칩 배치 (meta 칩박스 쪼개기 시연)
하단의 앙증맞은 배지 칩들은 `meta`에 파이프 `|` 기호로 지정하여 쪼개어 나타낸 결과물입니다.

**[작성 방법 마크다운 예시]**
```md
::: bottom-list
- title: 이 도구를 선택해야 하는 이유
  desc: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  meta: 즉시 시작|무설정 기본값|5분 온보딩|단계별 심화|무료 플랜 제공
:::
```

**[실제 동작 비주얼 결과물]**
::: bottom-list
- title: 이 도구를 선택해야 하는 이유
  desc: 기존 도구와의 가장 큰 차이는 설정 없이도 강력한 기본값이 제공된다는 점입니다. 복잡한 구성 없이 5분 안에 첫 번째 결과를 만들 수 있으며, 필요할 때만 세부 설정을 조정하면 됩니다.
  meta: 즉시 시작|무설정 기본값|5분 온보딩|단계별 심화|무료 플랜 제공
:::

---

## alert-box — 알림 및 팁 박스
**[작성 방법 마크다운 예시]**
```md
::: alert-box tip
- title: 💡 핵심 팁
  desc: shortcode-map.json을 수정하면 HTML→MD 변환 규칙을 추가하거나 변경할 수 있습니다.
:::
```

**[실제 동작 비주얼 결과물]**
::: alert-box tip
- title: 💡 핵심 팁
  desc: shortcode-map.json을 수정하면 HTML→MD 변환 규칙을 추가하거나 변경할 수 있습니다.
:::

::: alert-box warn
- title: ⚠️ 주의사항
  desc: 잘못된 YAML frontmatter는 build-guide.mjs 오류를 유발합니다. 들여쓰기를 확인하세요.
:::

---

## faq-list — 자주 묻는 질문 아코디언
**[작성 방법 마크다운 예시]**
```md
::: faq-list
- title: 무료로 사용할 수 있나요?
  desc: 네, 기본 기능은 무료 플랜으로 사용할 수 있습니다.
:::
```

**[실제 동작 비주얼 결과물]**
::: faq-list
- title: 무료로 사용할 수 있나요?
  desc: 네, 기본 기능은 무료 플랜으로 사용할 수 있습니다. 고급 기능은 Pro 플랜에서 제공됩니다.
- title: 어떤 파일 형식을 지원하나요?
  desc: HTML, Markdown, PPTX 형식을 지원합니다. shortcode-map.json으로 HTML 역변환 규칙을 관리합니다.
- title: 커스텀 스타일을 적용할 수 있나요?
  desc: config/styles.json에서 색상 프리셋을 정의하고, frontmatter의 style 키로 선택할 수 있습니다.
:::

---

## console-box — 실전 프롬프트 박스
**[작성 방법 마크다운 예시]**
```md
::: console-box
- title: 가이드 문서 생성 프롬프트
  desc: 다음 도구에 대한 활용 가이드를 작성해 주세요.
:::
```

**[실제 동작 비주얼 결과물]**
::: console-box
- title: 가이드 문서 생성 프롬프트
  desc: 다음 도구에 대한 활용 가이드를 작성해 주세요. icon-grid로 핵심 기능 4가지, feature-grid로 사용 사례 3가지, steps로 시작 방법 4단계를 포함해 주세요.
:::
