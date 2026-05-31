# 숏코드 시스템 리팩터링 계획

> 작성일: 2026-05-31 (md_src/ 실분석 기반 전면 개정)  
> 목적: 네이밍 혼용·필드 역할 불일치·HTML↔PPTX 구현 격차 해소  
> 우선순위: 1) devtools.md 구문 오류 수정 → 2) plan-grid 필드 정합 → 3) PPTX 미구현 fallback

---

## 1. 현황 진단 요약

### 1-1. md_src/ 소스 파일 현황

```
md_src/guides/      → 38개 MD 가이드 파일 (현행 소스)
md_src/showcase/    → showcase.md
md_src/vibecoding/  → vibecoding 콘텐츠
md_src/test/        → 테스트용 MD
```

→ 모든 MD 파일에서 숏코드를 직접 사용 중 → 필드·네이밍 변경 시 md_src/ 파일도 영향받음.  
→ `public/guides/` HTML은 md_src/ 재빌드 시 변경 반영.

---

### 1-2. 숏코드 사용 빈도 (md_src/ 실측)

| 숏코드 | 사용 파일 수 | 중요도 |
|--------|------------|--------|
| `icon-grid` | 36 | 🔴 핵심 |
| `alert-box` | 25 | 🔴 핵심 |
| `feature-grid` | 25 | 🔴 핵심 |
| `step-list` | 23 | 🔴 핵심 |
| `compare-grid` | 19 | 🔴 핵심 |
| `console-box` | 8 | 🟠 주요 |
| `tool-box` | 7 | 🟠 주요 |
| `workflow-strip` | 7 | 🟠 주요 |
| `flow` | 8 | 🟠 주요 |
| `plan-grid` | 4 | 🟡 보통 |
| `takeaway` | 3 | 🟡 보통 |
| `editor-box` | 3 | 🟡 보통 |
| `columns-grid` | 3 | 🟡 보통 |
| `cmd-box` | 3 | 🟡 보통 |
| `summary-bar` | 2 | 🟢 낮음 |
| `stat-grid` | 2 | 🟢 낮음 |
| `part-deck` | 2 | 🟢 낮음 |
| `os-tabs` | 2 | 🟢 낮음 |
| `network-box` | 2 | 🟢 낮음 |
| `level-grid` | 2 | 🟢 낮음 |
| `faq-list` | 2 | 🟢 낮음 |
| `compare-split` | 2 | 🟢 낮음 |
| `compare-before-after` | 2 | 🟢 낮음 |
| `checkpoint-grid` | 2 | 🟢 낮음 |
| `chapter-list` | 2 | 🟢 낮음 |
| `badge-grid` | 2 | 🟢 낮음 |
| `skill-list` | 1 | ⬜ 최소 |
| `git-flow-strip` | 1 | ⬜ 최소 |
| `bottom-list` | 1 | ⬜ 최소 |

> 이전 계획의 숏코드 목록(`steps`, `compare-2col`, `tool-card`, `prompt-example` 등)은 구 HTML 파일 기준이었음.  
> 현재 md_src/ 파일들은 이미 HTML 렌더러의 현행 이름(step-list, compare-split, tool-box, console-box 등)을 사용 중.

---

### 1-3. 렌더러별 지원 숏코드 (전체 목록)

| 숏코드 | HTML (build-guide.mjs) | PPTX (md-to-pptx.mjs) | md_src 사용 수 |
|--------|:---:|:---:|:---:|
| `icon-grid` | ✅ | ✅ | 36 |
| `feature-grid` | ✅ | ✅ | 25 |
| `alert-box` | ✅ | ✅ | 25 |
| `step-list` | ✅ | ✅ (alias: `steps`) | 23 |
| `compare-grid` | ✅ | ✅ | 19 |
| `console-box` | ✅ | ✅ (alias: `prompt-example`) | 8 |
| `flow` | ✅ | ❌ | 8 |
| `tool-box` | ✅ | ✅ (alias: `tool-card`) | 7 |
| `workflow-strip` | ✅ | ✅ (alias: `workflow`) | 7 |
| `plan-grid` | ✅ | ✅ | 4 |
| `takeaway` | ✅ | ❌ | 3 |
| `editor-box` | ✅ | ✅ (alias: `command-block`) | 3 |
| `columns-grid` | ✅ | ✅ (alias: `columns`) | 3 |
| `cmd-box` | ✅ | ✅ (alias: `command-block`) | 3 |
| `stat-grid` | ✅ | ✅ (alias: `stat-highlight`) | 2 |
| `part-deck` | ✅ | ❌ | 2 |
| `os-tabs` | ✅ | ✅ (alias: `tabs`) | 2 |
| `network-box` | ✅ | ⚠️ compare-grid 우회 | 2 |
| `level-grid` | ✅ | ❌ | 2 |
| `faq-list` | ✅ | ✅ (alias: `faq-accordion`) | 2 |
| `compare-split` | ✅ | ✅ (alias: `compare-2col`) | 2 |
| `compare-before-after` | ✅ | ❌ | 2 |
| `checkpoint-grid` | ✅ | ❌ | 2 |
| `chapter-list` | ✅ | ❌ | 2 |
| `badge-grid` | ✅ | ❌ | 2 |
| `skill-list` | ✅ | ❌ | 1 |
| `git-flow-strip` | ✅ | ⚠️ workflow 우회 | 1 |
| `bottom-list` | ✅ | ✅ | 1 |
| `summary-bar` | ✅ | ❌ | 2 |

**HTML 전용 (PPTX 미구현, md_src 사용 중):** `flow`(8), `takeaway`(3), `part-deck`(2), `level-grid`(2), `compare-before-after`(2), `checkpoint-grid`(2), `chapter-list`(2), `badge-grid`(2), `summary-bar`(2), `skill-list`(1)

---

## 2. 긴급 수정: devtools.md 구문 오류

`md_src/guides/devtools.md`는 다음 두 가지 문제를 가짐.

### 2-1. 스페이스 누락 구문 오류

```
현재 (오류): :::badge-grid, :::command-block, :::feature-grid, :::compare-2col, :::compare-grid, :::alert-box
정상 형식:   ::: badge-grid, ::: cmd-box, ::: feature-grid, ::: compare-split, ::: compare-grid, ::: alert-box
```

→ 현재 파서(`parseShortcodeItems`)는 `:::` 다음 공백을 기준으로 타입을 분리하므로, 스페이스 없는 형식은 무시됨.

### 2-2. 구 이름 사용

| devtools.md 사용 이름 | 현행 HTML 이름 | PPTX alias 존재 |
|---------------------|-------------|:---:|
| `command-block` | `cmd-box` | ✅ |
| `compare-2col` | `compare-split` | ✅ |

→ PPTX는 alias 덕분에 동작하지만, HTML 렌더러는 `cmd-box`, `compare-split` 이름만 처리함.  
→ **devtools.md에서 구 이름 + 스페이스 누락을 함께 수정해야 HTML 출력이 정상화됨.**

---

## 3. 핵심 문제: plan-grid 필드 역할 불일치

compare-split/compare-2col 불일치는 **이미 해소됨** (HTML과 PPTX 모두 desc=단락, note=배지).

### 3-1. plan-grid 불일치

```
HTML:   tag + title + meta(기능목록) + desc(하단배지 .plan-note)
PPTX:   tag + title + meta(기능목록) + note(하단배지)
목표:   tag + title + meta(기능목록) + note(하단배지)  — 통일
```

**수정 위치:** `scripts/build-guide.mjs` (plan-grid 렌더링 섹션, 299–317줄 부근)

```javascript
// BEFORE
${it.desc ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.desc)}</div>` : ""}

// AFTER
${it.note ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.note)}</div>` : ""}
```

**영향:**
- 기존 컴파일된 HTML(public/guides/) → **영향 없음**
- md_src/guides/ 내 plan-grid 사용 파일(4개): `desc` → `note`로 필드 이동 필요
- 영향 대상 파일 확인: `grep -rl "plan-grid" md_src/`

---

## 4. HTML ↔ PPTX 클래스명·이름 불일치 현황

### 4-1. 타입명과 HTML 컨테이너 클래스명 불일치

| 숏코드 타입명 | HTML 클래스명 | 비고 |
|-------------|-------------|------|
| `compare-split` | `.compare-2col` | 구 이름이 클래스명으로 남음 |
| `cmd-box` | `.cmd-block` | `-box` vs `-block` |
| `console-box` | `.prompt-box` | 의미 불일치 |
| `editor-box` | `.editor-sim` | `-box` vs `-sim` |
| `network-box` | `.graph-visual` | 의미 불일치 |
| `part-deck` | `.part` | 축약 클래스명 |
| `bottom-list` | `.bottom-list-card` | `-card` 접미사 과잉 |
| `os-tabs` | `.tabs-wrap` | `os-` 프리픽스 불일치 |
| `git-flow-strip` | `.git-flow-container` | `-strip` vs `-container` |

> 클래스명 변경은 CSS 파급 범위가 크고 기존 HTML 파일을 파괴할 수 있어 낮은 우선순위.  
> 내부 렌더러 코드에서의 의미 혼선이 주된 문제이므로, 문서화로 정리하는 것으로 대체.

### 4-2. PPTX 미구현 숏코드 (md_src 사용 중인 것)

| 숏코드 | md_src 사용 수 | PPTX 현재 동작 |
|--------|:---:|--------|
| `flow` | 8 | silent drop (렌더링 없음) |
| `takeaway` | 3 | silent drop |
| `part-deck` | 2 | silent drop |
| `level-grid` | 2 | silent drop |
| `compare-before-after` | 2 | silent drop |
| `checkpoint-grid` | 2 | silent drop |
| `chapter-list` | 2 | silent drop |
| `badge-grid` | 2 | silent drop |
| `summary-bar` | 2 | silent drop |
| `skill-list` | 1 | silent drop |

→ `flow`(8개)와 `takeaway`(3개)가 가장 빈번하게 누락됨. PPTX 변환 시 해당 슬라이드가 통째로 빠짐.

---

## 5. 필드 역할 표준 정의 (현행 기준)

| 필드 | 고정 역할 | 비고 |
|------|----------|------|
| `icon` | 이모지/아이콘 | standardizeItem()이 타이틀에서 자동 추출 |
| `title` | 카드 제목 | - |
| `desc` | 설명 문단 (`\n` 줄바꿈 지원) | plan-grid만 현재 예외(하단배지) → 수정 예정 |
| `tag` | 상단 배지/레이블 | alert-box는 type 필드도 병행 사용 |
| `meta` | `\|` 구분 불릿 목록 | splitMeta()로 파싱 |
| `note` | 하단 배지/요약 메모 | compare-split, compare-grid, plan-grid, compare-2col |
| `color` | 강조 색상 Hex | hexClean()으로 정규화 |
| `featured` | 강조 카드 표시 | plan-grid 전용 (`"true"` 문자열) |

---

## 6. 숏코드별 역할 레퍼런스 (현행 + 변경 예정)

| 숏코드 | icon | title | desc | tag | meta | note | color |
|--------|:----:|:-----:|:----:|:---:|:----:|:----:|:-----:|
| `icon-grid` | 이모지 | 카드 제목 | 설명 | - | - | - | 강조색 |
| `feature-grid` | 이모지 | 카드 제목 | 설명 | 상단 레이블 | - | - | 강조색 |
| `badge-grid` | 이모지 | 카드 제목 | - | 배지 텍스트 | - | - | 강조색 |
| `stat-grid` | **수치값** | 지표명 | 설명 | - | - | - | 강조색 |
| `tool-box` | 이모지 | 도구명 | 부제목 | 버전/레이블 | `\|`기능 목록 | - | 배경색 |
| `workflow-strip` | 이모지 | 단계명 | - | - | 도구/부연 | - | 강조색 |
| `step-list` | - | 단계 제목 | 단계 설명 | - | - | - | 강조색 |
| `compare-grid` | - | 항목명 | 설명 | - | - | 하단 메모 | 강조색 |
| `compare-split` | - | 제목 | 단락 텍스트 | - | `\|`불릿 목록 | 하단 배지 | 강조색 |
| **`plan-grid`** | - | 플랜명 | ~~하단배지~~ → **미사용** | 배지 레이블 | `\|`기능 목록 | **하단 배지** | 강조색 |
| `columns-grid` | - | 칼럼 제목 | 설명 | - | - | 하단 메모 | 강조색 |
| `bottom-list` | - | 섹션 제목 | 설명 | - | `\|`칩 항목 | - | 강조색 |
| `alert-box` | 이모지 | 제목 | 설명 | 타입(tip/warn) | - | - | - |
| `cmd-box` | - | 라벨 | **코드 본문** | - | 언어(bash 등) | - | - |
| `editor-box` | - | 파일명 | **코드 본문** | 언어 | - | - | - |
| `os-tabs` | - | 탭 라벨 | 탭 내용(md) | OS | - | - | - |
| `faq-list` | - | 질문 | 답변 | - | - | - | 강조색 |
| `console-box` | - | 프롬프트 제목 | 프롬프트 본문 | - | - | - | 강조색 |
| `flow` | 이모지 | 단계명 | 설명 | 레이블 | - | - | 강조색 |
| `level-grid` | - | 레벨명 | 레벨 설명 | - | 도구명 | 부연 | 강조색 |
| `takeaway` | 이모지 | 제목 | 설명 | - | - | - | 강조색 |

---

## 7. 실행 계획 (단계별)

### Phase 1: devtools.md 구문 오류 수정 【즉시 필요】

**수정 대상:** `md_src/guides/devtools.md`

- `:::badge-grid` → `::: badge-grid`
- `:::command-block` → `::: cmd-box`
- `:::feature-grid` → `::: feature-grid`
- `:::compare-2col` → `::: compare-split`
- `:::compare-grid` → `::: compare-grid`
- `:::alert-box` → `::: alert-box`

```bash
node scripts/build-guide.mjs md_src/guides/devtools.md  # 빌드 후 확인
```

---

### Phase 2: plan-grid 필드 역할 수정 【HTML 렌더러】

**수정 대상:** `scripts/build-guide.mjs` (plan-grid 섹션)

1. `desc` → `note`로 교체 (하단 배지 소스 필드 변경)
2. 동시에 md_src/guides/ 내 plan-grid 사용 4개 파일에서 `desc:` → `note:` 필드명 변경

```bash
grep -rl "plan-grid" md_src/  # 영향 파일 목록 확인
node scripts/build-guide.mjs md_src/guides/Grok.md  # 대표 파일 검증
```

---

### Phase 3: PPTX silent drop → fallback 로그 【md-to-pptx.mjs】

미구현 숏코드 사용 시 경고 출력:

```javascript
// scripts/md-to-pptx.mjs renderItem() 마지막 줄
console.warn(`  ⚠️  PPTX 미구현 숏코드: "${item.type}" — 슬라이드에서 제외됨`);
return 0;
```

---

### Phase 4 (선택): 고빈도 PPTX 미구현 숏코드 구현

우선순위: `flow`(8개) > `takeaway`(3개) > 나머지

`flow` 는 `workflow-strip`과 구조가 유사하므로 renderWorkflow()를 기반으로 확장 가능.  
`takeaway` 는 `alert-box`와 유사하므로 renderAlertBox() 기반 확장.

---

## 8. 기존 디자인 파괴 여부

| 변경 항목 | 기존 public/guides/ HTML | 재빌드 시 | 새 MD 파일 |
|-----------|:---:|:---:|:---:|
| devtools.md 구문 수정 | 파괴 없음 | devtools.html 정상화 | - |
| plan-grid `note`→배지 수정 | 파괴 없음 | plan-grid 있는 4개 재빌드 시 `note` 필드 필요 | 새 규칙 따름 |
| PPTX fallback 로그 | 파괴 없음 | 경고만 추가 | - |
| Phase 4 PPTX 구현 | 파괴 없음 | flow/takeaway 슬라이드 생성됨 | - |

---

## 9. 변경 파일 목록

| 파일 | Phase | 변경 내용 |
|------|:-----:|---------|
| `md_src/guides/devtools.md` | 1 | 구문 오류 수정, 구 이름 교체 |
| `scripts/build-guide.mjs` | 2 | plan-grid: `desc` → `note` 필드 변경 |
| md_src/ 내 plan-grid 사용 4개 파일 | 2 | `desc:` → `note:` 필드명 변경 |
| `scripts/md-to-pptx.mjs` | 3,4 | fallback 로그, flow/takeaway 구현 |
