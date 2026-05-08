# Creative Spark

AI 도구 가이드를 모아 제공하는 정적 웹 앱입니다. React 앱으로 볼 수 있고, 인터넷 없이 열 수 있는 `standalone.html`도 생성합니다.

## 주요 명령

```bash
npm run dev                 # 개발 서버
npm run build               # standalone + Vite 빌드
npm run build:standalone    # public/standalone.html만 재생성
npm run test                # Vitest
npm run pptx:md             # MD → PPTX 변환 (예: npm run pptx:md -- mddata/Supabase.md)
```

## 새 가이드 추가 (3단계)

### 1. MD 파일 작성

`templates/template.md`를 참고해 `mddata/` 에 새 파일을 만듭니다.

```bash
# mddata/MyGuide.md 작성 후 HTML 생성
node templates/build-guide.mjs mddata/MyGuide.md public/guides/MyGuide.html
```

frontmatter에서 스타일 키를 지정합니다 (`templates/styles.json` 참고):

```yaml
style: ai-dev   # ai-chat / ai-dev / knowledge / productivity / creative / security / finance / future / enterprise / media
```

카드형 배열은 shortcode로 작성할 수 있습니다:

```md
::: icon-grid
- icon: 🎬
  title: 숏폼 편집
  desc: 세로 영상을 빠르게 제작합니다.
:::
```

지원 shortcode: `icon-grid`, `feature-grid`, `steps`, `compare-grid`

### 2. guides.json 등록

`src/data/guides.json`의 적합한 카테고리 `guides` 배열에 항목을 추가합니다.

```json
{ "slug": "myguide", "title": "My Guide", "subtitle": "한 줄 설명", "file": "MyGuide.html" }
```

| 필드 | 설명 |
|------|------|
| `slug` | URL에 사용되는 고유 ID (영문 소문자·하이픈, 전체 중복 불가) |
| `title` | 메뉴와 카드에 표시되는 이름 |
| `subtitle` | 카드 아래 짧은 설명 |
| `file` | `public/guides/` 안의 HTML 파일명 (대소문자 정확히) |

카테고리 선택 기준:

| id | 대상 |
|----|------|
| `ai-chat` | 대화형 AI (ChatGPT, Grok 등) |
| `ai-dev` | 개발·배포 도구 (VS Code, Supabase, Vercel, Cursor 등) |
| `knowledge` | 노트·지식 관리 (Notion, Obsidian, Quartz 등) |
| `productivity` | PC 유틸리티 (Everything, Snipaste 등) |
| `creative` | 이미지·영상 AI (CapCut 등) |

### 3. standalone 갱신

```bash
npm run build:standalone
```

guides.json을 변경했다면 반드시 실행해야 standalone.html 메뉴에도 반영됩니다.

---

## 주요 문서

- [가이드 제작 상세](docs/guide-creation.md) — shortcode, 스타일, 역변환 방법
- [MD → PPTX 변환](docs/md-to-pptx.md) — shortcode·색상·디자인 설정
- [Standalone 빌드](docs/standalone.md) — 오프라인 HTML 빌드 방법
- [프로젝트 구조](docs/project-structure.md) — 파일 구조, 내보내기 흐름
- [개발 현황 & 로드맵](docs/plan.md) — 구현 완료 목록, 미완료 항목
