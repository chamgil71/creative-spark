# 가이드 제작 가이드

마크다운(.md)으로 콘텐츠를 작성하면 카테고리별 디자인이 적용된 HTML·PPTX로 변환됩니다.

---

## 전체 워크플로우

```
1. mddata/MyGuide.md 작성
        ↓
2. build-guide.mjs 실행 → public/guides/MyGuide.html 생성
        ↓ (선택)
   md-to-pptx.mjs 실행 → dist-pptx/MyGuide.pptx 생성
        ↓
3. src/data/guides.json 에 slug/title/file 등록
        ↓
4. npm run build:standalone  (standalone.html 갱신)
        ↓
5. npm run build             (배포 빌드)
```

---

## 1단계. MD 파일 작성

`data/templates/template.md`를 복사해 `mddata/` 에 새 파일을 만듭니다.

```bash
cp data/templates/template.md mddata/MyGuide.md
```

### frontmatter 필수 항목

```yaml
---
title: 도구 이름
subtitle: 한 줄 설명
style: ai-dev        # ← styles.json 키 (아래 표 참고)
logo: 🤖             # 선택
stats:               # 선택: 표지 통계
  - value: "무료"
    label: "시작 가능"
done:                # 선택: 마지막 슬라이드/섹션
  title: 마무리 문구
  subtitle: 짧은 설명
  ctaLabel: 바로 시작하기
---
```

### 마크다운 → HTML/PPTX 매핑 규칙

| 마크다운 | 변환 결과 |
|----------|----------|
| `# 1. 제목` | 섹션 (번호 박스 + 제목) |
| `## 소제목` | 카드 박스 + 카드 제목 |
| `### 작은 제목` | 카드 내부 소제목 |
| `> 인용문` | 브랜드 색 팁 박스 |
| ` ```코드``` ` | 다크 코드 블록 |
| `\| 표 \|` | 브랜드 색 헤더 표 |
| `---` | 섹션 구분 |

---

## 2단계. Shortcode 블록

모든 숏코드는 `:::` 펜스로 감싼다.

```
::: shortcode-type
- key: value
  key2: value2
:::
```

### 6대 표준 키

| 키 | 용도 |
|----|------|
| `icon` | 이모지 아이콘 |
| `title` | 항목 제목 |
| `desc` | 설명 텍스트 |
| `tag` | 배지/레이블 |
| `meta` | 부가 데이터 (도구명·파이프`\|` 구분 목록) |
| `note` | 하단 메모 또는 CTA 버튼 텍스트 |
| `color` | 강조 색상 (Hex, 예: `"#6366F1"`) |

### 숏코드 목록

| 타입 | 용도 | 주요 필드 |
|------|------|-----------|
| `icon-grid` | 아이콘 카드 격자 | `icon`, `title`, `desc` |
| `feature-grid` | 기능 소개 카드 | `icon`, `title`, `desc`, `tag` |
| `tool-card` | 브랜드 컬러 배너 | `icon`, `title`, `desc`, `tag`, `color` |
| `workflow` | 프로세스 흐름도 | `icon`, `title`, `meta`(도구명) |
| `steps` | 번호형 단계 목록 | `title`, `desc` |
| `compare-grid` | 비교 카드 | `title`, `desc`, `note` |
| `plan-grid` | 요금제/플랜 비교 | `title`, `tag`, `meta`(기능 `\|` 구분), `note`, `featured` |
| `compare-2col` | 좌우 2단 비교 | `title`, `meta`(항목 `\|` 구분), `note` |
| `bottom-list` | 요점 칩 목록 | `title`, `desc`, `meta`(칩 `\|` 구분) |
| `alert-box` | 알림/팁 박스 | `type`(tip·warn·success·danger), `icon`, `title`, `desc` |
| `command-block` | 터미널 명령어 블록 | `label`(창 제목), `meta`(언어), `desc`(명령어) |
| `tabs` | 탭 전환 UI | `id`, `label`(탭명), `desc`(탭 내용) |
| `faq-accordion` | 아코디언 FAQ | `title`(질문), `desc`(답변) |
| `prompt-example` | AI 프롬프트 예시 | `title`(레이블), `desc`(프롬프트 내용) |
| `stat-highlight` | 수치 강조 카드 | `icon`(수치/이모지), `title`, `desc`, `color` |

**예시:**

```md
::: icon-grid
- icon: 🚀
  title: 빠른 시작
  desc: 5분 안에 완료
  color: "#6366F1"
:::

::: workflow
- icon: 📝
  title: 작성
  meta: VS Code
- icon: 🔄
  title: 변환
  meta: build-guide.mjs
:::

::: plan-grid
- title: Free
  tag: 무료
  meta: 기능A|기능B|기능C
  note: 지금 시작
- title: Pro
  tag: 추천
  meta: 기능A|기능B|기능C|기능D
  note: 업그레이드
  featured: "true"
:::
```

---

## 3단계. HTML 생성

```bash
# 기본 (public/guides/<파일명>.html 자동 저장)
node templates/build-guide.mjs mddata/MyGuide.md

# 출력 경로 지정
node templates/build-guide.mjs mddata/MyGuide.md public/guides/MyGuide.html

# 스타일 강제 지정
node templates/build-guide.mjs mddata/MyGuide.md --style knowledge
```

### PPTX 생성 (선택)

```bash
node scripts/md-to-pptx.mjs mddata/MyGuide.md
node scripts/md-to-pptx.mjs mddata/MyGuide.md --style ai-dev --verbose
node scripts/md-to-pptx.mjs --all "mddata/*.md"
```

---

## 4단계. guides.json 등록

`src/data/guides.json`의 적합한 카테고리 `guides` 배열에 항목 추가.

```json
{ "slug": "myguide", "title": "My Guide", "subtitle": "한 줄 설명", "file": "MyGuide.html" }
```

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

## 5단계. 빌드

```bash
npm run build:standalone   # standalone.html 갱신 (guides.json 변경 후 필수)
npm run build              # 배포 빌드
```

---

## 스타일 프리셋 (config/styles.json)

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

---

## 기존 HTML을 MD로 역변환

```bash
node templates/html-to-md.mjs public/guides/Supabase.html mddata/Supabase.md
# → 검수 후 build-guide.mjs 로 재빌드
```

| HTML 요소 | 복원 결과 |
|-----------|----------|
| `.hero` 영역 | frontmatter (title, subtitle, logo, stats) |
| CSS `--brand` 변수 | `styles.json` 키 자동 감지 |
| `section.section` | `# N. 제목` 섹션 |
| `.card` | `## 카드제목` + 내부 내용 |
| `.icon-grid` / `.feature-grid` / `.step-list` / `.compare-grid` | shortcode 복원 |
| `<blockquote>`, `<pre>`, `<ul>`, `<table>` | 마크다운 표준 문법 |
