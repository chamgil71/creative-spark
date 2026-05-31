# 숏코드 시스템 리팩터링 계획

> 작성일: 2026-05-31  
> 목적: 네이밍 혼용·필드 역할 불일치·HTML↔PPTX 구현 격차 해소  
> 우선순위: 1) 필드 역할 재정립 → 2) 네이밍 정리 → 3) HTML/PPTX 동기화

---

## 1. 현황 진단 요약

### 1-1. mddata/ 소스 파일 현황
```
/home/user/creative-spark/mddata/  →  존재하지 않음
```
MD 소스 파일이 저장소에 없음. 기존 가이드는 모두 **컴파일된 HTML**만 존재.  
→ 필드 변경 영향도는 "앞으로 새로 작성할 MD 파일" 기준으로만 적용됨.  
→ 기존 39개 HTML 파일은 재생성하지 않는 한 변경 불필요.

### 1-2. 숏코드 사용 빈도 (기존 HTML 기준)

| 숏코드 | 파일 수 | 중요도 |
|--------|---------|--------|
| icon-grid | 25 | 🔴 핵심 |
| feature-grid | 22 | 🔴 핵심 |
| steps | 21 | 🔴 핵심 |
| alert-box | 17 | 🔴 핵심 |
| compare-grid | 16 | 🟠 주요 |
| compare-2col | 39 (전 파일) | 🔴 핵심 |
| prompt-example | 5 | 🟡 보통 |
| tool-card | 6 | 🟡 보통 |
| workflow | 7 | 🟡 보통 |
| plan-grid | 4 | 🟡 보통 |
| faq-accordion | 2 | 🟢 낮음 |
| tabs | 1 | 🟢 낮음 |
| badge-grid | 1 | 🟢 낮음 |
| bottom-list | 1 | 🟢 낮음 |
| skill-list | 0 | ⬜ 미사용 |
| columns | 0 | ⬜ 미사용 |
| command-block | 0 | ⬜ 미사용 |
| stat-highlight | 0 | ⬜ 미사용 |

---

## 2. 핵심 문제: 필드 역할 불일치

### 2-1. `desc`가 숏코드마다 다른 역할

| 숏코드 | HTML에서 `desc` 역할 | PPTX에서 `desc` 역할 | 올바른 역할 |
|--------|---------------------|---------------------|------------|
| icon-grid | 설명 텍스트 `<p>` | 설명 텍스트 | ✅ 일관 |
| feature-grid | 설명 텍스트 | 설명 텍스트 | ✅ 일관 |
| steps | 설명 텍스트 | 설명 텍스트 | ✅ 일관 |
| compare-grid | 설명 텍스트 | 설명 텍스트 | ✅ 일관 |
| tool-card | 부제목 | 부제목 | ✅ 일관 |
| **compare-2col** | **하단 배지 (`c2-note`)** | **단락 텍스트** | ❌ **불일치** |
| **plan-grid** | **하단 배지 (`plan-note`)** | **미사용** | ❌ **불일치** |
| command-block | 코드 본문 | 미구현 | ⚠️ 예외 |

**핵심 충돌:** `compare-2col`에서 HTML은 `desc`를 하단 배지로, PPTX는 `desc`를 단락 텍스트로 사용.  
→ 같은 MD를 HTML·PPTX로 각각 변환하면 결과가 달라짐.

### 2-2. `note`·`desc`·`meta` 역할 표준 정의 (Before → After)

#### Before (현재 상태)

| 필드 | 의도된 역할 | 실제 동작 (숏코드별 다름) |
|------|------------|------------------------|
| `desc` | 설명 텍스트 | 대부분 설명, compare-2col·plan-grid에서는 하단 배지 |
| `note` | 하단 배지/메모 | PPTX compare-2col에서만 하단 배지, HTML compare-2col에서는 미사용 |
| `meta` | 파이프(`\|`) 구분 목록 | 대부분 불릿, plan-grid/compare-2col에서는 기능 목록 |

#### After (목표 상태)

| 필드 | 고정 역할 | 예외 없음 |
|------|----------|----------|
| `icon` | 이모지/아이콘 | - |
| `title` | 카드 제목 | - |
| `desc` | 설명 문단 (줄바꿈 `\n` 지원) | - |
| `tag` | 상단 배지/레이블 | - |
| `meta` | `\|` 구분 불릿 목록 | - |
| `note` | 하단 배지/요약 메모 | - |
| `color` | 강조 색상 Hex | - |

---

## 3. 숏코드 네이밍 규칙 통일

### 3-1. 접미사 규칙 제안

| 접미사 | 의미 | 해당 숏코드 |
|--------|------|------------|
| `-grid` | 격자형 다중 카드 | icon-grid, feature-grid, compare-grid, plan-grid, stat-grid |
| `-list` | 세로 목록 | steps(→step-list), skill-list |
| `-card` | 단일/소수 카드 | tool-card |
| `-box` | 단일 강조 박스 | alert-box, prompt-box |
| `-block` | 코드/고정폭 블록 | command-block |
| 단독 명사 | UI 컴포넌트 | workflow, tabs, faq-accordion, compare-2col, bottom-list |

### 3-2. 숏코드 이름 Before → After

| 현재 이름 | 제안 이름 | 변경 이유 | 영향 파일 수 |
|-----------|-----------|-----------|-------------|
| `icon-grid` | **유지** | 명확하고 일관성 있음 | 25개 |
| `feature-grid` | **유지** | 명확 | 22개 |
| `badge-grid` | **유지 또는 icon-grid 흡수** | 사용 1개, 구조 동일 | 1개 |
| `tool-card` | **유지** | 명확 | 6개 |
| `workflow` | **유지** | 단독 컴포넌트, 직관적 | 7개 |
| `steps` | **유지** | 직관적 | 21개 |
| `compare-grid` | **유지** | 명확 | 16개 |
| `compare-2col` | **유지** | 구조 설명적 | 39개 |
| `plan-grid` | **유지** | 명확 | 4개 |
| `skill-list` | **유지** | 미사용 → 리네임 낮은 우선순위 | 0개 |
| `columns` | `col-grid` | CSS 클래스명 `columns-grid`와 정합 | 0개 |
| `bottom-list` | `chip-list` | 실제 모양(칩 태그 묶음)을 반영 | 1개 |
| `alert-box` | **유지** | 명확 | 17개 |
| `command-block` | **유지** | 명확 | 0개 |
| `tabs` | **유지** | 직관적 | 1개 |
| `faq-accordion` | **유지** | 명확 | 2개 |
| `prompt-example` | `prompt-box` | CSS 클래스명 `.prompt-box`와 정합 | 5개 |
| `stat-highlight` | `stat-grid` | CSS 클래스명 `.stat-grid`와 정합 | 0개 |

**실질적 변경:** `columns→col-grid`, `bottom-list→chip-list`, `prompt-example→prompt-box`, `stat-highlight→stat-grid` — 이 중 기존 HTML 파일 영향은 `prompt-example` 5개뿐.

---

## 4. HTML ↔ PPTX 구현 격차

### 4-1. PPTX 미구현 숏코드 (HTML 전용)

| 숏코드 | 기존 HTML 파일 수 | PPTX 구현 여부 | 우선순위 |
|--------|-----------------|----------------|---------|
| `stat-grid` (stat-highlight) | 0 | ❌ | 낮음 |
| `command-block` | 0 | ❌ | 낮음 |
| `tabs` | 1 | ❌ | 낮음 |
| `skill-list` | 0 | ❌ | 낮음 |
| `col-grid` (columns) | 0 | ❌ | 낮음 |
| `badge-grid` | 1 | ❌ | 낮음 |

→ 모두 사용 빈도가 0~1개. PPTX 구현 급하지 않음. 단, 렌더 시 **silent drop 아닌 fallback 처리** 권장.

### 4-2. HTML ↔ PPTX 클래스명 불일치 목록

| 숏코드 | HTML 컨테이너 클래스 | PPTX 렌더함수 | 비고 |
|--------|---------------------|--------------|------|
| `icon-grid` | `.icon-grid` | `renderIconGrid` | ✅ 일관 |
| `feature-grid` | `.feature-grid` | `renderFeatureGrid` | ✅ 일관 |
| `workflow` | `.workflow-strip` | `renderWorkflow` | HTML 클래스에 `-strip` 접미사 |
| `steps` | `.step-list` | `renderSteps` | HTML 클래스가 복수→단수 |
| `faq-accordion` | `.faq-list` | `renderFaqAccordion` | HTML 클래스명이 숏코드명과 다름 |
| `stat-highlight` | `.stat-grid` | 미구현 | HTML 클래스명이 숏코드명과 다름 |
| `bottom-list` | `.bottom-list-card` | `renderBottomList` | HTML에 `-card` 접미사 |

---

## 5. 변경별 영향도 분석

### 5-1. 【핵심】 `compare-2col` 필드 역할 수정

**문제:** `desc`가 HTML에서는 하단 배지(`c2-note`), PPTX에서는 단락 텍스트로 다르게 처리됨.

```
현재 HTML: title + meta(불릿) + desc(하단배지)
현재 PPTX: title + desc(단락) + meta(불릿) + note(하단배지)
목표:      title + desc(단락) + meta(불릿) + note(하단배지)  — 둘 다 동일
```

**HTML 수정 내용 (`build-guide.mjs` line 210-225):**
```javascript
// BEFORE: desc → c2-note (하단 배지)
${it.desc ? `<div class="c2-note">${escapeHtml(it.desc)}</div>` : ""}

// AFTER: desc → 단락 텍스트, note → c2-note (하단 배지)
${it.desc ? `<div class="c2-desc">${escapeHtml(it.desc)}</div>` : ""}
${it.note ? `<div class="c2-note">${escapeHtml(it.note)}</div>` : ""}
```

**영향 파일:**
- 기존 HTML 39개: 이미 컴파일됨 → **영향 없음** (재생성 시에만 적용)
- 새 MD → HTML 변환: `desc` 위치가 하단배지 → 단락으로 변경됨
- 새 MD → PPTX 변환: 이미 desc=단락, note=배지로 구현됨 → **이미 정합**

### 5-2. 【핵심】 `plan-grid` 필드 역할 수정

**문제:** HTML에서 `desc`가 하단 배지(`plan-note`) 역할.

```
현재 HTML: tag + title + meta(기능목록) + desc(하단배지)
목표:      tag + title + meta(기능목록) + note(하단배지)
```

**HTML 수정 내용 (`build-guide.mjs` line 174):**
```javascript
// BEFORE
${it.desc ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.desc)}</div>` : ""}

// AFTER
${it.note ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.note)}</div>` : ""}
```

**영향 파일:**
- 기존 HTML 4개(plan-grid 사용): 이미 컴파일됨 → **영향 없음**
- 새 MD 작성 시: `note` 필드에 하단 배지 텍스트 입력 필요

### 5-3. 네이밍 변경 영향

| 변경 | 수정 파일 | 기존 HTML 영향 |
|------|---------|----------------|
| `prompt-example` → `prompt-box` | build-guide.mjs, md-to-pptx.mjs | 5개 재생성 시 |
| `stat-highlight` → `stat-grid` | build-guide.mjs, md-to-pptx.mjs | 0개 |
| `bottom-list` → `chip-list` | build-guide.mjs, md-to-pptx.mjs | 1개 재생성 시 |
| `columns` → `col-grid` | build-guide.mjs | 0개 |

→ 기존 숏코드명 alias 지원(`if (type === "prompt-example" || type === "prompt-box")`)으로 하위 호환 가능.

---

## 6. 실행 계획 (단계별)

### Phase 1: 필드 역할 수정 (가장 중요, 기존 파일 영향 없음)

**수정 대상:** `templates/build-guide.mjs`

1. `compare-2col`: `desc` → 단락 텍스트(`.c2-desc`), `note` → 하단 배지(`.c2-note`)
   - CSS에 `.c2-desc { ... }` 추가
   - line 222 수정
   
2. `plan-grid`: `desc` → 제거, `note` → 하단 배지(`.plan-note`)
   - line 174 수정

**검증:** `node templates/build-guide.mjs test.md` 후 브라우저 확인

---

### Phase 2: HTML ↔ PPTX 필드 정합 확인

`compare-2col` 수정 후 두 파일의 동작이 일치하는지 검증:
```bash
node templates/build-guide.mjs test.md    # HTML 확인
node scripts/md-to-pptx.mjs test.md      # PPTX 확인
```

---

### Phase 3: 네이밍 정리 (alias 병행 지원으로 무중단)

**수정 대상:** `templates/build-guide.mjs`, `scripts/md-to-pptx.mjs`

```javascript
// alias 패턴 예시 (기존 이름도 동작)
if (type === "prompt-example" || type === "prompt-box") { ... }
if (type === "stat-highlight"  || type === "stat-grid")  { ... }
if (type === "bottom-list"     || type === "chip-list")  { ... }
if (type === "columns"         || type === "col-grid")   { ... }
```

---

### Phase 4: PPTX 미구현 숏코드 fallback 처리

현재 미구현 숏코드는 PPTX 변환 시 아무것도 출력 안 됨 (silent drop).  
최소한 경고 로그라도 출력하도록 `renderItem()` 수정:

```javascript
// md-to-pptx.mjs renderItem() 마지막 줄
// return 0;
console.warn(`  ⚠️  PPTX 미구현 숏코드: ${item.type}`);
return 0;
```

---

## 7. 필드 역할 최종 레퍼런스 (After)

| 숏코드 | icon | title | desc | tag | meta | note | color |
|--------|------|-------|------|-----|------|------|-------|
| icon-grid | 이모지 | 카드 제목 | 설명 | - | - | - | 강조색 |
| feature-grid | 이모지 | 카드 제목 | 설명 | 상단 레이블 | - | - | 강조색 |
| badge-grid | 이모지 | 카드 제목 | - | 배지 텍스트 | - | - | 강조색 |
| tool-card | 이모지 | 도구명 | 부제목 | 버전/레이블 | `\|`기능 목록 | - | 배경색 |
| workflow | 이모지 | 단계명 | - | - | 도구/부연 | - | 강조색 |
| steps | - | 단계 제목 | 단계 설명 | - | - | - | 강조색 |
| compare-grid | - | 항목명 | 설명 | - | 요약 메모 | - | 강조색 |
| **compare-2col** | - | 제목 | **단락 텍스트** | - | `\|`불릿 목록 | **하단 배지** | 강조색 |
| **plan-grid** | - | 플랜명 | - | 배지 레이블 | `\|`기능 목록 | **하단 배지** | 강조색 |
| skill-list | 이모지 | 스킬명 | 설명 | - | - | - | 강조색 |
| col-grid (columns) | - | 칼럼 제목 | 설명 | - | - | - | 강조색 |
| chip-list (bottom-list) | - | 섹션 제목 | 설명 | - | `\|`칩 항목 | - | 강조색 |
| alert-box | 이모지 | 제목 | 설명 | 타입(tip/warn) | - | - | - |
| command-block | - | 라벨 | **코드 본문** | - | 언어(bash 등) | - | - |
| tabs | - | 탭 라벨 | 탭 내용(md) | - | - | - | - |
| faq-accordion | - | 질문 | 답변 | - | - | - | 강조색 |
| prompt-box (prompt-example) | - | 프롬프트 제목 | 프롬프트 본문 | - | - | - | - |
| stat-grid (stat-highlight) | **수치값** | 지표명 | 설명 | - | - | - | 강조색 |

> **굵게** 표시 = 이번 변경으로 역할이 명확해지는 필드  
> `command-block`의 `desc` = 코드 본문 역할은 예외적이나, "desc = 이 숏코드의 주 내용"이라는 원칙에는 부합함

---

## 8. 기존 디자인 파괴 여부

| 변경 항목 | 기존 HTML 39개 | 재생성 시 | 새 MD 파일 |
|-----------|--------------|----------|-----------|
| compare-2col `desc`→단락 / `note`→배지 | **파괴 없음** (이미 컴파일) | desc 내용이 배지→단락으로 이동 | 새 필드 규칙 따름 |
| plan-grid `note`→배지 | **파괴 없음** | desc→note로 필드 이동 필요 | 새 필드 규칙 따름 |
| 숏코드 alias 추가 | **파괴 없음** | - | 구·신 이름 둘 다 사용 가능 |
| PPTX fallback 로그 | **파괴 없음** | 경고 로그 추가됨 | - |

**결론: 기존 컴파일된 HTML 파일은 어떤 변경에도 영향 없음. 변경은 앞으로 MD → HTML/PPTX 변환 시에만 적용됨.**

---

## 9. 변경 파일 목록

| 파일 | Phase | 변경 내용 |
|------|-------|---------|
| `templates/build-guide.mjs` | 1,3 | compare-2col/plan-grid 필드 수정, alias 추가, CSS `.c2-desc` 추가 |
| `scripts/md-to-pptx.mjs` | 2,3,4 | alias 추가, fallback 로그 추가 (compare-2col은 이미 올바름) |
| `config/shortcode-map.json` | 3 | tabs `tabs-wrap` 클래스 추가, alias 이름 등록 |
| `docs/pipeline.md` | 4 | 필드 역할 레퍼런스 업데이트 |
