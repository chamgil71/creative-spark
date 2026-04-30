# 가이드 템플릿 시스템

마크다운(.md)으로 가이드 콘텐츠를 작성하면 카테고리별 디자인이 적용된 HTML로 변환됩니다.

## 사용법

### 1. 새 가이드 작성
`templates/template.md`를 복사해서 내용을 채워주세요.

```bash
cp templates/template.md templates/MyGuide.md
# MyGuide.md 편집
```

frontmatter(상단 `---` 사이)에서 스타일을 지정합니다:
```yaml
---
title: 도구 이름
subtitle: 한 줄 설명
style: ai-chat   # ← styles.json의 키
badge: NEW · 2025
logo: 🤖
stats:
  - { value: "10M+", label: "사용자" }
---
```

### 2. HTML로 변환
```bash
node templates/build-guide.mjs templates/MyGuide.md public/guides/MyGuide.html
```

옵션 없이 출력 경로를 생략하면 `public/guides/<파일명>.html`로 저장됩니다.

스타일을 명시적으로 강제하려면:
```bash
node templates/build-guide.mjs templates/MyGuide.md --style creative
```

### 3. 카탈로그에 등록 (메뉴에 노출)
`src/data/guides.ts`의 해당 카테고리 `guides` 배열에 추가:
```ts
{ slug: "myguide", title: "My Guide", subtitle: "...", file: "MyGuide.html" }
```

## 사용 가능한 스타일 (styles.json)

| 키 | 카테고리 | 메인 색 |
|------|---------|--------|
| `ai-chat` | AI 챗봇 & 어시스턴트 | 그린 `#10A37F` |
| `ai-dev` | AI 개발 도구 | 오렌지 `#D97757` |
| `knowledge` | 노트 & 지식 관리 | 퍼플 `#6366F1` |
| `productivity` | 생산성 유틸리티 | 블루 `#1565C0` |
| `creative` | 크리에이티브 AI | 마젠타 `#9B59B6` |

색상 / 그라디언트를 바꾸고 싶으면 `templates/styles.json`만 수정하면 됩니다 — 새 변환 시 반영.

## 마크다운 매핑 규칙

| 마크다운 | 변환 결과 |
|----------|----------|
| `# 1. 제목` | 섹션 (왼쪽에 번호 박스) |
| `## 소제목` | 카드 박스 + 카드 제목 |
| `### 작은 제목` | 카드 내부 소제목 |
| `> 인용문` | 브랜드 색 팁 박스 |
| ``` ```코드``` ``` | 다크 코드 블록 |
| `\| 표 \|` | 브랜드 색 헤더 표 |
| `---` | 섹션 구분 (새 섹션 시작) |
---

## 🔄 기존 HTML을 MD로 역변환 (보조 도구)

이미 만들어진 `public/guides/*.html` 을 MD로 옮기고 싶을 때:

```bash
node templates/html-to-md.mjs public/guides/github.html templates/Github.md
```

- frontmatter (title, subtitle, badge, stats, heroCta, done, footer) 와 색상 기반 `style` 키를 자동 추출합니다.
- 본문은 100% 완벽하지 않으므로 **반드시 사람이 검토/정리**한 뒤 `build-guide.mjs` 로 다시 빌드하세요.
- 잘 변환된 깔끔한 예시는 `templates/Github.md` 를 참고하세요.
