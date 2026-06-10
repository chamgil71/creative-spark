# Creative Spark 프로젝트 현황 검토 보고서

> 검토일: 2026-05-28  
> 기준 브랜치: main (최신 커밋: cfe0fb1)

---

## 1. 프로젝트 전체 현황 요약

### 빌드 파이프라인 (scripts/)

| 스크립트 | 역할 | 상태 |
|---------|------|------|
| `build-guide.mjs` | MD → 반응형 가이드 HTML (숏코드 렌더러 핵심) | ✅ v1.4 갱신 |
| `build-presentation.mjs` | MD → PPT형 횡 슬라이드 HTML | ✅ v1.3 신설 |
| `build-publish.mjs` | 전체 퍼블리셔 오케스트레이터 | ✅ |
| `build-standalone.mjs` | public/ → 오프라인 단일 standalone.html | ✅ v1.4 Shadow DOM 수정 |
| `sync-guides-index.mjs` | md_src/ → guides.json 자동 인덱싱 | ✅ |
| `md-to-pptx.mjs` | MD → 실제 PPTX 파일 변환기 | ✅ |
| `html-to-md.mjs` / `html-to-pptx.mjs` | 역변환 도구 | ✅ |

### 콘텐츠 현황

- 가이드 MD 파일: 37+ (`md_src/guides/`)
- 시리즈 컬렉션: vibecoding(8편), showcase, test
- 스타일 프리셋: 11종 (`config/styles.json`)

---

## 2. 숏코드 반영 현황 검토 (핵심)

### 2-1. 현재 숏코드 전체 목록 (build-guide.mjs 실제 기준)

| # | 숏코드명 | 별칭 | 분류 | 도입 시점 |
|---|---------|------|------|---------|
| 1 | `icon-grid` | - | 격자형 | 기존 |
| 2 | `feature-grid` | - | 격자형 | 기존 |
| 3 | `badge-grid` | - | 격자형 | 기존 |
| 4 | `stat-grid` | - | 격자형 | 기존 |
| 5 | `plan-grid` | - | 격자형 | 기존 |
| 6 | `compare-grid` | - | 격자형 | 기존 |
| 7 | `columns-grid` | - | 격자형 | 기존 |
| 8 | `summary-box` | - | 격자형 | 기존 |
| 9 | `tool-list` | - | 특화 | 기존 |
| 10 | `workflow-flow` | - | 특화 | 기존 |
| 11 | `step-list` | - | 특화 | 기존 |
| 12 | `skill-list` | - | 특화 | 기존 |
| 13 | `compare-split` | `compare-2col` | 특화 | 기존 |
| 14 | `alert-box` | - | 특화 | 기존 |
| 15 | `cmd-box` | `command-block` | 특화 | 기존 |
| 16 | `os-tabs` | `tabs` | 특화 | 기존 |
| 17 | `faq-list` | - | 인터랙티브 | 기존 |
| 18 | `console-box` | - | 인터랙티브 | 기존 |
| 19 | `git-flow` | - | 시각화 | 기존 |
| 20 | `editor-box` | - | 시각화 | 기존 |
| 21 | `network-box` | - | 시각화 | 기존 |
| 22 | `part-banner` | - | 시리즈 | v1.3 |
| 23 | `chapter-list` | - | 시리즈 | v1.3 |
| 24 | `summary-bar` | - | 시리즈 | v1.3 |
| 25 | `step-flow` | - | 데이터/흐름 | **v1.4 NEW** |
| 26 | `level-grid` | - | 데이터/흐름 | **v1.4 NEW** |
| 27 | `checkpoint-grid` | - | 데이터/흐름 | **v1.4 NEW** |
| 28 | `compare-diff` | - | 데이터/흐름 | **v1.4 NEW** |
| 29 | `takeaway-banner` | - | 데이터/흐름 | **v1.4 NEW** |

**총 29개 선언 (aliases 포함), 26종 고유 숏코드**  
(aliases: `compare-split`=`compare-2col`, `cmd-box`=`command-block`, `os-tabs`=`tabs`)

---

### 2-2. 문서별 숏코드 반영 현황

| 문서 | 현재 표기 | 실제 현황 | 상태 |
|------|---------|---------|------|
| `README.md` (루트) | 24종 | 29종 | ❌ 미반영 |
| `docs/README.md` | 24종 | 29종 | ❌ 미반영 |
| `docs/guide-creation.md` | 24종 | 29종 | ❌ v1.4 5종 명세 누락 |
| `docs/shortcode-style-guide.md` | 24종 | 29종 | ❌ v1.4 5종 튜닝 가이드 누락 |
| `docs/worklog.md` | 25~29번 기록 | - | ✅ 작업 이력 기록됨 |
| `md_src/showcase/showcase.md` | 29종 예제 포함 | - | ✅ 업데이트됨 |

### 2-3. 신규 5종 숏코드 문서 공백 상세

v1.4에서 추가된 `step-flow`, `level-grid`, `checkpoint-grid`, `compare-diff`, `takeaway-banner`가 다음 위치에 **미반영**:

- `docs/guide-creation.md` — "총 24종 지원" 표기 + 신규 5종 마크다운 표현법/6-key 스키마 명세 없음
- `docs/shortcode-style-guide.md` — "24종 표준 숏코드" 표기 + 신규 5종 CSS 클래스 튜닝 섹션 없음
- `README.md` (루트, docs/) — "24종" 표기 그대로

단, `worklog.md`에 "25번~29번 숏코드"로 도입 사실이 기록되어 있으며, `showcase.md`에는 예제가 추가되었음.

---

## 3. README.md (루트) 현행화 필요 항목

### 3-1. 숏코드 수 오기

- **현재**: `"24종의 풍부한 시각화 숏코드"` (line 28)  
- **수정**: `"29종의 풍부한 시각화 숏코드"`
- **현재**: 참고자료 링크 `"24종 숏코드의 마크다운 표현법"` (line 223)  
- **수정**: `"29종 숏코드의 마크다운 표현법"`

### 3-2. 디렉토리 구조 항목 누락

현재 README의 `docs/` 섹션에 없는 파일들:

| 누락 항목 | 실제 경로 |
|---------|---------|
| `shortcode-style-guide.md` | `docs/shortcode-style-guide.md` |
| `pipeline.md` | `docs/pipeline.md` |
| `plan/` 서브폴더 | `docs/plan/` |
| `prompt/` 서브폴더 | `docs/prompt/` |
| `report/` 서브폴더 | `docs/report/` (신설) |

---

## 4. docs/ 디렉토리 구조 현행화

### 4-1. 현재 구조

```
docs/
├── guide-creation.md          ✅ 가이드 (내용 업데이트 필요: 24→29종)
├── guide-build.md             ✅ 가이드
├── scripts-guide.md           ✅ 가이드
├── pipeline.md                ✅ 가이드 (README 목록에 미기재)
├── standalone.md              ✅ 가이드
├── shortcode-style-guide.md   ✅ 가이드 (내용 업데이트 필요: 24→29종, README 목록 미기재)
├── README.md                  ✅ 인덱스 (내용 업데이트 필요)
├── worklog.md                 ⚠️  작업 이력 → report/ 이동 권장
├── standalone-integrity-report.md  ❌ 검토보고서 → report/ 이동 완료
├── plan/
│   └── html-to-shortcode-analysis.md  ✅
└── prompt/
    ├── generate-guide-prompt.md       ✅
    └── shortcode-reference.md         ✅
```

### 4-2. 권장 구조 (이번 작업 후 목표)

```
docs/
├── guide-creation.md          가이드 (v1.4 5종 추가 필요)
├── guide-build.md             가이드
├── scripts-guide.md           가이드
├── pipeline.md                가이드
├── standalone.md              가이드
├── shortcode-style-guide.md   가이드 (v1.4 5종 추가 필요)
├── README.md                  인덱스
├── plan/
│   └── html-to-shortcode-analysis.md
├── prompt/
│   ├── generate-guide-prompt.md
│   └── shortcode-reference.md
└── report/
    ├── project-review-2026-05-28.md  ← 이 파일
    ├── standalone-integrity-report.md  ← 이동
    └── (worklog.md 이동 권장)
```

---

## 5. 문제점 및 개선사항 목록

| # | 우선순위 | 분류 | 문제 | 권장 조치 |
|---|---------|------|------|---------|
| 1 | HIGH | 문서 정합성 | `README.md` "24종 숏코드" 오기 | 29종으로 수정 |
| 2 | HIGH | 문서 정합성 | `docs/guide-creation.md` "총 24종" + 신규 5종 명세 누락 | 29종 수정 + step-flow/level-grid/checkpoint-grid/compare-diff/takeaway-banner 명세 추가 |
| 3 | HIGH | 디렉토리 구조 | `standalone-integrity-report.md` docs/ 루트 위치 | `docs/report/` 이동 (완료) |
| 4 | MEDIUM | 문서 정합성 | `docs/shortcode-style-guide.md` "24종" + 신규 5종 CSS 튜닝 섹션 누락 | 29종 수정 + 섹션 추가 |
| 5 | MEDIUM | 문서 정합성 | `docs/README.md` "24종" 오기 + 문서 목록 불완전 | 29종 수정 + pipeline.md, shortcode-style-guide.md, report/ 추가 |
| 6 | MEDIUM | 디렉토리 구조 | `worklog.md` docs/ 루트 위치 (작업 이력 ≠ 가이드) | `docs/report/` 이동 권장 |
| 7 | LOW | README 구조 | `docs/` 디렉토리 항목 불완전 (pipeline.md, shortcode-style-guide.md, plan/, prompt/, report/ 누락) | README.md 구조 섹션 업데이트 |
| 8 | LOW | README 참조 | `docs/shortcode-style-guide.md` 링크 미기재 | 참고자료 섹션에 추가 |

---

## 6. v1.4 기준 shadow DOM / 버그 수정 완료 항목 확인

아래 항목들은 `standalone-integrity-report.md`에 기록된 것으로, 정상 반영 확인됨.

| 항목 | 수정 내용 | 상태 |
|------|---------|------|
| Shadow DOM 탭 전환 | `switchTab()` → `btn.getRootNode()` 방식으로 패치 | ✅ 완료 |
| 빈 "목차" 링크 버그 | `build-standalone.mjs` 파일 존재 여부 검사 추가 | ✅ 완료 |
| 동적 카드 래핑 예외 | 숏코드 출력 시 `.card` 이중 래핑 방지 로직 | ✅ 완료 |
| SVG 체크 불릿 HSL 동기화 | `stroke="currentColor"` SVG로 교체 | ✅ 완료 |
| 타이틀 블록 데이터 분리 | `title:` 스칼라 블록에서 리스트 데이터 분리 | ✅ 완료 |

---

## 7. 즉시 조치 완료 항목

- [x] `docs/report/` 폴더 신설
- [x] `standalone-integrity-report.md` → `docs/report/` 이동
- [x] `README.md` 숏코드 수 24 → 29 수정
- [x] `docs/README.md` 숏코드 수 24 → 29 수정 + 문서 목록 보완

## 7-1. 후속 조치 필요 항목

- [ ] `docs/guide-creation.md` — v1.4 신규 5종 숏코드 명세 추가
- [ ] `docs/shortcode-style-guide.md` — 신규 5종 CSS/PPTX 튜닝 섹션 추가
- [ ] `worklog.md` → `docs/report/` 이동 검토
- [ ] `README.md` 디렉토리 구조 섹션 상세 업데이트 (report/ 서브폴더 추가)
