# 가이드 제작 가이드

마크다운(.md)으로 콘텐츠를 작성하면 카테고리별 디자인이 적용된 HTML로 변환됩니다.

---

## 전체 워크플로우

```
1. mddata/MyGuide.md 작성
        ↓
2. build-guide.mjs 실행 → public/guides/MyGuide.html 생성
        ↓
3. src/data/guides.json 에 slug/title/file 등록
        ↓
4. npm run build:standalone  (standalone.html 갱신)
        ↓
5. npm run build             (배포 빌드)
```

---

## 1단계. MD 파일 작성

`templates/template.md`를 복사해 `mddata/` 에 새 파일을 만듭니다.

```bash
cp templates/template.md mddata/MyGuide.md
```

### frontmatter 필수 항목

```yaml
---
title: 도구 이름
subtitle: 한 줄 설명
style: ai-dev        # ← styles.json 키 (아래 표 참고)
badge: 🛠️ 도구 · 카테고리
logo: 🤖
heroCta:
  label: 공식 사이트
  url: https://example.com
stats:
  - value: "무료"
    label: "시작 가능"
done:
  title: 마무리 문구
  subtitle: 짧은 설명
  ctaLabel: 바로 시작하기
  ctaUrl: https://example.com
footer:
  - "공식 사이트: [example.com](https://example.com)"
---
```

### 마크다운 매핑 규칙

| 마크다운 | 변환 결과 |
|----------|----------|
| `# 1. 제목` | 섹션 (왼쪽에 번호 박스) |
| `## 소제목` | 카드 박스 + 카드 제목 |
| `### 작은 제목` | 카드 내부 소제목 |
| `> 인용문` | 브랜드 색 팁 박스 |
| ` ```코드``` ` | 다크 코드 블록 |
| `\| 표 \|` | 브랜드 색 헤더 표 |
| `---` | 섹션 구분 (새 섹션 시작) |

### Shortcode 카드/그리드

```md
::: icon-grid
- icon: 🎬
  title: 숏폼 편집
  desc: 세로 영상을 빠르게 제작합니다.
:::
```

| 타입 | 용도 | 필드 |
|------|------|------|
| `icon-grid` | 아이콘 중심의 작은 네모 카드 배열 | `icon`, `title`, `desc` |
| `feature-grid` | 태그와 설명이 있는 기능 카드 배열 | `tag`(선택), `icon`(선택), `title`, `desc` |
| `steps` | 번호가 붙은 단계형 리스트 | `title`, `desc` |
| `compare-grid` | 상황별 추천/비교 카드 배열 | `title`, `desc`, `note`(선택) |

예시: `templates/template.md`

---

## 2단계. HTML 생성

```bash
node templates/build-guide.mjs mddata/MyGuide.md public/guides/MyGuide.html

# 출력 경로 생략 시 public/guides/<파일명>.html 로 자동 저장
node templates/build-guide.mjs mddata/MyGuide.md

# 스타일 강제 지정
node templates/build-guide.mjs mddata/MyGuide.md --style knowledge
```

---

## 3단계. guides.json 등록

`src/data/guides.json`의 적합한 카테고리 `guides` 배열에 항목을 추가합니다.

```json
{ "slug": "myguide", "title": "My Guide", "subtitle": "한 줄 설명", "file": "MyGuide.html" }
```

### 필드 설명

| 필드 | 설명 |
|------|------|
| `slug` | URL 고유 ID (영문 소문자·하이픈, 전체 중복 불가) |
| `title` | 메뉴/카드 표시 이름 |
| `subtitle` | 카드 아래 짧은 설명 |
| `file` | `public/guides/` 안의 HTML 파일명 (대소문자 정확히) |

### 카테고리 선택 기준

| 카테고리 id | 대상 도구 유형 |
|------------|--------------|
| `ai-chat` | ChatGPT, Claude, Grok 등 대화형 AI |
| `ai-dev` | VS Code, Claude Code, Copilot, Codex 등 AI 코딩 도구 |
| `webdev` | GitHub, Vercel, Supabase, Lovable 등 개발·배포 플랫폼 |
| `knowledge` | Notion, Obsidian, Quartz 등 노트·지식 관리 |
| `productivity` | Everything, Snipaste 등 PC 유틸리티 |
| `creative` | CapCut, 이미지·영상 AI 등 크리에이티브 도구 |

---

## 4단계. standalone 갱신 및 빌드

```bash
npm run build:standalone   # standalone.html 갱신 (guides.json 변경 후 필수)
npm run build              # 배포 빌드
```

---

## 스타일 프리셋 (templates/styles.json)

| 키 | 카테고리 | 메인 색 |
|------|---------|--------|
| `ai-chat` | AI 챗봇 & 어시스턴트 | 그린 `#10A37F` |
| `ai-dev` | AI 개발 도구 | 오렌지 `#D97757` |
| `knowledge` | 노트 & 지식 관리 | 퍼플 `#6366F1` |
| `productivity` | 생산성 유틸리티 | 블루 `#1565C0` |
| `creative` | 크리에이티브 AI | 마젠타 `#9B59B6` |
| `security` | 보안 & 인프라 | 사이언 `#06B6D4` |
| `finance` | 재테크 & 금융 | 골드 `#D4A017` |
| `future` | 퓨처 AI | 네온 라임 `#84CC16` |
| `enterprise` | 엔터프라이즈 | 슬레이트 `#475569` |
| `media` | 미디어 & 콘텐츠 | 로즈 `#E11D48` |

색상·그라디언트 변경은 `templates/styles.json`만 수정하면 됩니다.

---

## 기존 HTML을 MD로 역변환

```bash
node templates/html-to-md.mjs public/guides/Supabase.html mddata/Supabase.md
# → 검수 후 build-guide.mjs 로 재빌드
```

| HTML 요소 | 복원 결과 |
|-----------|----------|
| `.hero` 영역 | frontmatter (title, subtitle, badge, logo, stats, heroCta) |
| CSS `--brand` 변수 | `styles.json` 키 자동 감지 |
| `section.section` | `# N. 제목` 섹션 |
| `.card` | `## 카드제목` + 내부 내용 |
| `.icon-grid` / `.feature-grid` / `.step-list` / `.compare-grid` | shortcode 복원 |
| `<blockquote>`, `<pre>`, `<ul>`, `<table>` | 마크다운 표준 문법 |
| `.done-section` / `footer > div` | frontmatter `done` / `footer` 블록 |

반드시 사람이 검토·정리한 뒤 `build-guide.mjs`로 재빌드하세요.
