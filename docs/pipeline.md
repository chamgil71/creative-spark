# 콘텐츠 파이프라인

> 최종 업데이트: 2026-05-31 (md_src 폴더 구조 반영)

---

## 전체 흐름

```
md_src/guides/*.md  ←──────────── 신규 가이드 직접 작성 및 에디터 저장
      │
      ├── scripts/build-guide.mjs ──→ public/guides/*.html ──→ 웹 서비스
      │
      └── scripts/md-to-pptx.mjs ──→ dist-pptx/*.pptx
```

---

## 1. 마크다운 기반 신규 가이드 편집 (에디터)

현재는 웹 브라우저 통합 에디터(`/converter.html`) 또는 로컬 에디터를 사용하여 마크다운 가이드를 직접 생성/수정하며 실시간으로 렌더링을 확인합니다. 기존 HTML에서 마크다운을 역변환하는 도구(`html-to-md.mjs`)는 [docs/backup/](file:///c:/ai/creative-spark/docs/backup/) 디렉토리로 백업 이전되었습니다.

---

## 2. MD → HTML

```bash
# 단일 파일
node scripts/build-guide.mjs md_src/guides/Supabase.md

# 출력 경로 지정
node scripts/build-guide.mjs md_src/guides/Supabase.md public/guides/Supabase.html

# 스타일 강제 지정
node scripts/build-guide.mjs md_src/guides/Supabase.md --style knowledge
```

**설정 파일:** `config/styles.json` (색상), `config/pptdesign.config.json` (둥글기)

---

## 3. MD → PPTX

```bash
# 단일 파일
node scripts/md-to-pptx.mjs md_src/guides/Supabase.md

# 옵션 지정
node scripts/md-to-pptx.mjs md_src/guides/Supabase.md --out dist/Supabase.pptx --style ai-dev

# 전체 일괄 변환
node scripts/md-to-pptx.mjs --all "md_src/guides/*.md"

# 상세 로그
node scripts/md-to-pptx.mjs md_src/guides/Supabase.md --verbose
```

**설정 파일:** `config/pptdesign.config.json`, `config/styles.json`

> `md_src/guides/` 폴더의 MD 파일을 직접 작성하거나 에디터를 사용하여 생성.

---

## 4. MD Frontmatter 규격

```yaml
---
title: 가이드 제목
subtitle: 한 줄 설명
style: ai-chat          # styles.json 키
logo: 🤖                # 선택: hero 로고 이모지
badge: 영상 편집 · AI  # 선택: hero 상단 배지 텍스트
heroCta:               # 선택: hero CTA 버튼
  label: 시작하기
  url: https://example.com
stats:                  # 선택: hero 통계 행
  - value: "100+"
    label: 기능 수
done:                   # 선택: 본문 하단 완료 섹션
  title: 마무리 메시지
  subtitle: 부연 설명
  ctaLabel: 시작하기
  ctaUrl: https://example.com
footer:                 # 선택: 푸터 텍스트 목록
  - 저작권 또는 출처 표기
  - "[링크텍스트](https://url)"
---
```

**style 키 목록:** `ai-chat` · `ai-dev` · `knowledge` · `productivity` · `creative` · `security` · `finance` · `future` · `enterprise` · `media`

---

## 5. Shortcode 레퍼런스

모든 숏코드는 `:::` 펜스로 감싼다.

```
::: shortcode-type [블록 인자]
- key: value
  key2: value2
:::
```

**블록 인자** (숏코드명 뒤 공백으로 지정, 복수 조합 가능):

| 인자 | 대상 | 설명 |
|------|------|------|
| `cols=N` | grid 계열 5종 | CSS 컬럼 수 강제 지정 (`cols=3`) |
| `bullet=X` | 전체 | 블록 기본 불릿 기호 지정 (`bullet=✅`) |

```
::: feature-grid cols=3 bullet=✅
```

### 표준 필드 키

| 키 | 설명 | 이전 필드명 (자동 매핑) |
|----|------|----------------------|
| `icon` | 이모지 또는 아이콘 | `icon` |
| `title` | 항목 제목 | `name`, `col` |
| `desc` | 설명 텍스트 (`\n`으로 다중 불릿 목록) | `description`, `tagline`, `body` |
| `tag` | 배지/레이블 | `badge` |
| `meta` | 부가 데이터(파이프`\|` 구분 목록) | `tool`, `features`, `points`, `items` |
| `note` | 하단 배지·메모 (`\n` → ` · ` 구분) | `note` |
| `color` | 강조 색상 (Hex) — 카드 + SVG 불릿 색 | `color` |
| `bullet` | 아이템별 불릿 기호 오버라이드 | — |

---

### 숏코드 목록

#### icon-grid — 아이콘 카드 격자

```
::: icon-grid
- icon: 🚀
  title: 빠른 시작
  desc: 5분 안에 완료
  color: "#6366F1"
:::
```

#### feature-grid — 기능 소개 카드

```
::: feature-grid
- icon: ⚡
  title: 실시간 동기화
  desc: 변경사항 즉시 반영
  tag: NEW
:::
```

#### tool-list — 브랜드 컬러 배너

```
::: tool-list
- icon: 🛠
  title: Supabase
  desc: Firebase 대체 오픈소스
  tag: v2.0
  color: "#3ECF8E"
:::
```

#### workflow-flow — 프로세스 흐름

```
::: workflow-flow
- icon: 📝
  title: 작성
  meta: VS Code
- icon: 🔄
  title: 변환
  meta: build-guide.mjs
- icon: 🚀
  title: 배포
  meta: npm run build
:::
```

#### step-list — 순서형 단계 목록

```
::: step-list
- title: 프로젝트 초기화
  desc: npm init으로 시작
- title: 의존성 설치
  desc: pptxgenjs, gray-matter 설치
:::
```

#### compare-grid — 비교 카드

```
::: compare-grid
- title: 무료 플랜
  desc: 기본 기능 포함
  note: 월 500건 제한
- title: Pro 플랜
  desc: 모든 기능 무제한
  note: $20/월
:::
```

#### plan-grid — 요금제/플랜 비교

```
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

#### compare-split — 좌우 2단 비교

```
::: compare-split
- title: 기존 방식
  meta: 복잡함|설정 많음|속도 느림
  note: 레거시
- title: 새 방식
  meta: 간단함|자동 설정|빠름
  note: 권장
:::
```

#### summary-box — 요점 칩 목록

```
::: summary-box
- title: 핵심 포인트
  desc: 이 도구로 할 수 있는 것들
  meta: 자동화|협업|배포|모니터링
:::
```

#### alert-box — 알림 박스 (tip / warn / success / danger)

```
::: alert-box
- type: tip
  title: 💡 핵심 팁
  desc: shortcode-map.json을 수정해 HTML→MD 변환 규칙을 추가할 수 있습니다.
:::
```

#### faq-list — 자주 묻는 질문 목록

```
::: faq-list
- title: 무료로 사용할 수 있나요?
  desc: 네, 기본 기능은 무료 플랜으로 사용할 수 있습니다.
- title: 어떤 파일 형식을 지원하나요?
  desc: HTML, Markdown, PPTX를 지원합니다.
:::
```

#### console-box — 실전 프롬프트 박스

```
::: console-box
- title: 가이드 생성 프롬프트
  desc: 다음 도구에 대한 활용 가이드를 작성해 주세요. icon-grid로 핵심 기능 4가지를 포함해 주세요.
:::
```

#### stat-grid — 통계 강조

```
::: stat-grid
- icon: 100+
  title: 사용자 수
  desc: 월간 활성 사용자
- icon: 99.9%
  title: 가동률
  desc: SLA 보장
:::
```

---

### 기타 지원 항목

- **`blockquote`** (`> 텍스트`) — HTML 출력 시 브랜드 컬러 배경·왼쪽 테두리 스타일 적용
- **`table`** — 마크다운 표 그대로 지원

---

## 6. 보완 예정 항목

| 항목 | 상태 | 위치 |
|------|------|------|
| Playwright 기반 HTML 캡처 PPTX | 현재 공식 파이프라인 밖의 보류 아이디어 | 별도 구현 없음 |
