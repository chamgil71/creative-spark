# 기본 가이드 템플릿 및 숏코드 사용 예시

> 용도: 새 `md_src/guides/*.md` 파일을 만들 때 복사해서 시작하는 기본 템플릿입니다.  
> 참고: 전체 29종 예제는 `md_src/showcase/showcase.md`를 기준으로 확인합니다.

---

## 1. 기본 Frontmatter

```yaml
---
title: "도구명 완전 활용 가이드"
subtitle: "도구의 핵심 가치와 활용 목적을 한 줄로 설명"
badge: "Category · 2026"
style: "ai-chat"
logo: "🤖"
stats:
  - value: "무료"
    label: "시작 가능"
  - value: "웹"
    label: "사용 환경"
  - value: "자동화"
    label: "핵심 가치"
done:
  title: "가이드 완료"
  subtitle: "이제 실제 워크플로우에 적용해 보세요."
  ctaLabel: "맨 위로"
  ctaUrl: "#top"
footer:
  - "ⓒ 2026 Creative Spark Guide. All rights reserved."
  - "본 문서는 Creative Spark 29종 숏코드 표준을 기준으로 작성되었습니다."
---
```

현재 기존 가이드 대부분은 `footer`를 생략하고 있습니다. 새 문서는 위처럼 `footer`를 넣는 것을 권장합니다.

---

## 2. 기본 본문 구조

```md
# 1. 도입

## 이 도구는 무엇인가

도구의 목적, 대상 사용자, 핵심 장점을 짧게 설명합니다.

::: alert-box
- type: tip
  icon: "💡"
  title: "핵심 포인트"
  desc: "처음 읽는 사람이 바로 기억해야 할 내용을 적습니다."
:::

# 2. 핵심 기능

::: feature-grid cols=3
- icon: "⚡"
  title: "빠른 작업"
  tag: "핵심"
  desc: "반복 작업을 줄이고 결과를 빠르게 만듭니다."
  color: "#6366F1"
- icon: "🧰"
  title: "템플릿"
  tag: "실전"
  desc: "자주 쓰는 작업 형식을 재사용합니다."
  color: "#10B981"
- icon: "🔗"
  title: "공유"
  tag: "협업"
  desc: "결과물을 링크나 파일로 전달합니다."
  color: "#F59E0B"
:::
```

---

## 3. 자주 쓰는 숏코드 패턴

### 아이콘 카드

```md
::: icon-grid cols=3
- icon: "🚀"
  title: "빠른 시작"
  desc: "가입 후 바로 사용할 수 있습니다."
- icon: "🔒"
  title: "보안"
  desc: "업무 데이터 보호 옵션을 확인합니다."
- icon: "📦"
  title: "내보내기"
  desc: "HTML, PPTX 등 산출물로 변환합니다."
:::
```

### 단계 목록

```md
::: step-list
- title: "1단계: 계정 만들기"
  desc: "공식 사이트에서 가입하고 기본 설정을 마칩니다."
- title: "2단계: 첫 프로젝트 생성"
  desc: "템플릿을 선택하고 샘플 데이터를 넣습니다."
- title: "3단계: 결과 검토"
  desc: "출력물을 확인하고 공유합니다."
:::
```

### 요금제/플랜

`plan-grid`에서 가격이나 하단 배지는 `note`에 씁니다. `desc`는 가격 용도로 쓰지 않습니다.

```md
::: plan-grid cols=3
- title: "Free"
  tag: "무료"
  meta: "기본 기능|제한된 사용량|개인 테스트"
  note: "₩0"
- title: "Pro"
  tag: "추천"
  meta: "무제한 프로젝트|고급 내보내기|우선 지원"
  note: "$20 / 월"
  featured: "true"
- title: "Team"
  tag: "팀"
  meta: "공동 작업|관리자 기능|권한 관리"
  note: "문의"
:::
```

### 좌우 비교

```md
::: compare-split
- title: "기존 방식"
  desc: "수동 편집과 반복 복사로 시간이 오래 걸립니다."
  meta: "느린 반복|품질 편차|공유 어려움"
  note: "Before"
- title: "개선 방식"
  desc: "Markdown 원본을 HTML/PPTX 산출물로 자동 변환합니다."
  meta: "자동화|일관된 품질|배포 쉬움"
  note: "After"
:::
```

### 명령어/콘솔

```md
::: cmd-box
title: "가이드 빌드"
meta: bash
desc: |
  npm run sync:guides
  node scripts/build-guide.mjs md_src/guides/MyGuide.md
  npm run build:standalone
:::
```

```md
::: console-box
- title: "프롬프트 예시"
  desc: "이 도구를 처음 쓰는 사용자를 위한 5분 시작 가이드를 작성해줘."
:::
```

### FAQ

```md
::: faq-list
- title: "무료로 시작할 수 있나요?"
  desc: "대부분의 도구는 무료 플랜이나 체험판을 제공합니다."
- title: "PPTX도 만들 수 있나요?"
  desc: "Markdown 원본을 `scripts/md-to-pptx.mjs` 또는 횡형 HTML 프레젠테이션으로 변환할 수 있습니다."
:::
```

---

## 4. 빌드 명령

```bash
npm run sync:guides
node scripts/build-guide.mjs md_src/guides/MyGuide.md
node scripts/build-presentation.mjs md_src/guides/MyGuide.md --out public/presentation/MyGuide.html
npm run build:standalone
```

`public/`은 실제 웹 서비스와 프레젠테이션에 쓰이는 생성 산출물 관리 영역입니다. 원본 MD를 바꾼 뒤에는 관련 HTML 산출물도 함께 갱신합니다.
