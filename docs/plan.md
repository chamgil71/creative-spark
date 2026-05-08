# Creative Spark — 개발 현황 및 로드맵

> 마지막 업데이트: 2026-05-08

---

## 1. 현재 파이프라인 (구현 완료)

### 콘텐츠 제작 흐름

```text
mddata/*.md
    │
    │  node templates/build-guide.mjs
    ▼
public/guides/*.html   ←── 생성 산출물 (직접 편집 금지)
    │
    ├── React iframe (GuideViewer.tsx)
    ├── standalone.html  ←── scripts/build-standalone.mjs
    ├── PDF              ←── window.print()
    └── PPTX             ←── scripts/html-to-pptx.mjs
                              src/lib/exportGuide.ts (브라우저)
```

역방향 (기존 HTML 편집):
```text
public/guides/*.html
    │  node templates/html-to-md.mjs
    ▼
templates/*.md  →  검수 후 build-guide.mjs 재빌드
```

### 구현 완료 목록

| 변환 | 담당 | 비고 |
|------|------|------|
| MD → HTML | `templates/build-guide.mjs` | shortcode 4종 포함 |
| HTML → MD | `templates/html-to-md.mjs` | shortcode 역변환 완료 (2026-05-08) |
| MD → PPTX (CLI) | `scripts/md-to-pptx.mjs` | shortcode 4종 포함, 디자인 설정 분리 (2026-05-08) |
| HTML → PPTX (CLI) | `scripts/html-to-pptx.mjs` | `--style`, `--verbose`, `--all` 옵션 (개선 필요) |
| 브라우저 PPT(이미지) | `src/lib/exportGuide.ts` | html2canvas 캡처 방식 |
| 브라우저 PPT(편집) | `src/lib/exportGuide.ts` | pptxgenjs 네이티브 방식 |
| 브라우저 PDF | `src/lib/exportGuide.ts` | window.print() |
| Standalone HTML | `scripts/build-standalone.mjs` | Shadow DOM 격리, 다크/라이트 테마 |

### Shortcode 지원 현황

MD 안에서 `:::` 블록 문법으로 카드 UI를 표현하며, HTML → MD 역변환도 완전히 지원함.

| Shortcode | HTML 클래스 | 필드 |
|-----------|------------|------|
| `icon-grid` | `.icon-grid > .icon-card` | `icon`, `title`, `desc` |
| `feature-grid` | `.feature-grid > .feature-card` | `tag`(선택), `icon`(선택), `title`, `desc` |
| `steps` | `.step-list > .step-item` | `title`, `desc` |
| `compare-grid` | `.compare-grid > .compare-card` | `title`, `desc`, `note`(선택) |

### 스타일 시스템

- `templates/styles.json` — 5개 색상 프리셋의 단일 원천
- `build-guide.mjs`가 프리셋을 CSS 변수(`--brand` 등)로 주입
- `html-to-md.mjs`가 `--brand` 값으로 프리셋 키 자동 역추정
- standalone의 Shadow DOM이 가이드별 CSS 충돌 차단

| 키 | 색상 | 용도 |
|----|------|------|
| `ai-chat` | #10A37F (그린) | ChatGPT, Grok 등 |
| `ai-dev` | #D97757 (오렌지) | Claude, VS Code, Supabase 등 |
| `knowledge` | #6366F1 (퍼플) | Notion, Obsidian 등 |
| `productivity` | #1565C0 (블루) | Everything, Snipaste 등 |
| `creative` | #9B59B6 (마젠타) | CapCut, 이미지/영상 AI 등 |

### 콘텐츠 현황

신규 파일 (`build-guide.mjs` 생성, styles.json 기반):
- CapCut, Supabase, Vercel, Cloudflare, Lovable, Quartz, Resend

기존 파일 (수동 작성, 파일별 독자 CSS):
- Chatgpt, Claude, ClaudeCode, Notion, Obsidian, Gemini 등

---

## 2. 미완료 / 향후 작업

### 우선순위 높음

#### 기존 HTML 가이드 스타일 통일 마이그레이션

현재 `public/guides/` 안에는 수동 작성 HTML과 `build-guide.mjs` 생성 HTML이 혼재.  
수동 작성 파일은 파일마다 다른 CSS 변수명, 전역 선택자, 인라인 스타일을 가짐.

전환 순서:
1. `src/data/guides.json` 각 항목에 `styleKey` 필드 추가
   - 예: `{ slug: "chatgpt", styleKey: "ai-chat", ... }`
2. 대표 2개를 먼저 변환해 검증
   - `html-to-md.mjs` → 검수 → `build-guide.mjs` 재빌드
   - 라이트 계열: ChatGPT(`ai-chat`)
   - 오렌지 계열: Claude(`ai-dev`)
3. React 뷰어, standalone, PDF, PPTX에서 비교
4. 문제 없으면 나머지 일괄 전환
5. 기존 수동 HTML을 `legacy/` 또는 아카이브로 이동

#### `src/data/guides.json` styleKey 필드 추가

- PPT CLI 변환 시 `--style` 명시 없이도 자동 프리셋 적용 가능
- 향후 `build-guide.mjs` 재생성 자동화의 기반

---

### 우선순위 보통

#### `html-to-pptx.mjs` 개선

현재 `html-to-pptx.mjs`는 기존 수동 HTML 파일 대상으로 작성되어 불안정.  
신규 가이드는 `md-to-pptx.mjs`를 사용. `html-to-pptx.mjs`는 별도 점검 예정.

#### overflow 처리: 섹션 자동 분할

현재 `md-to-pptx.mjs`는 섹션 콘텐츠가 슬라이드를 초과하면 경고만 출력.  
향후 개선 방향: 아이템 수가 많으면 슬라이드를 자동 분할 (`--split` 옵션).

---

### 우선순위 낮음

- `scripts/html-to-pptx-grok.js` 실험 파일 정리 (canonical 버전: `html-to-pptx.mjs`만 유지)
- `src/lib/exportGuide.ts`의 브라우저 편집 PPT 품질 개선 (현재 `html-to-pptx.mjs` 대비 단순)
- `public/vibecoding/` 시리즈를 별도 컬렉션 템플릿으로 전환

---

## 3. 설계 원칙

- `styles.json`이 색상 토큰의 단일 원천
- `public/guides/*.html`은 `build-guide.mjs`의 생성 산출물 (직접 편집 금지)
- 콘텐츠 원본은 `mddata/*.md`에서 관리
- HTML은 React iframe / standalone / PDF / PPTX의 공통 소스
- 기존 수동 작성 HTML은 마이그레이션 완료 후 아카이브
