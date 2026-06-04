# Creative Spark 현행화 점검 보고서

> 점검일: 2026-06-04  
> 범위: 현재 문서화 상태, 계획 대비 미완성 항목, 코드 위험사항, 개선 권장사항  
> 기준 명령: `rg`, `npm run test`, `npm run lint`, `npm run build`
> 전제: `public/`은 임시 부산물이 아니라 웹 서비스와 프레젠테이션에 직접 사용되는 생성 산출물 관리 영역이다.

---

## 1. 현재 문서화 상태 요약

### 1-1. 현행화된 문서

| 문서 | 상태 | 확인 내용 |
|------|------|----------|
| `README.md` | 부분 현행화 | 루트 README는 29종 숏코드, `scripts/` 통합, `docs/report/worklog.md` 링크를 반영함 |
| `docs/README.md` | 부분 현행화 | `docs/report/`, `pipeline.md`, `shortcode-style-guide.md` 목록이 반영되어 있음 |
| `docs/pipeline.md` | 현행화 | `md_src/guides/`, `scripts/*.mjs`, `public/` 산출물 흐름을 설명함 |
| `docs/shortcode-refactoring-plan.md` | 현행화 | devtools 구문 수정, plan-grid 필드 정리, PPTX fallback 로그 완료 상태를 반영함 |
| `docs/report/worklog.md` | 작업 이력 위치 정리 완료 | 기존 보고서의 "report/ 이동 권장" 항목은 완료된 상태 |

### 1-2. `public/` 산출물의 역할

`public/` 폴더는 현재 구조상 단순 배포 전 임시 폴더가 아니다. `md_src/`의 원본 Markdown을 HTML 가이드, 시리즈 컬렉션 HTML, 쇼케이스 HTML/PPTX, standalone 통합 입력으로 변환해 웹 서비스와 프레젠테이션에 직접 공급하는 산출물 저장소다.

| 경로 | 역할 |
|------|------|
| `public/guides/*.html` | 개별 가이드 Markdown을 HTML로 변환한 실제 웹 서비스 대상 |
| `public/vibecoding/*.html` | 장편 컬렉션/시리즈 문서의 HTML 서비스 대상 |
| `public/presentation/*.html` | 횡형 슬라이드 HTML 프레젠테이션 대상 |
| `public/showcase/showcase.html` | 숏코드 쇼케이스 HTML |
| `public/showcase/showcase.pptx` | 쇼케이스 PPTX 프레젠테이션 산출물 |
| `public/standalone.html` | `public/`의 가이드/컬렉션을 통합한 오프라인 단일 파일 |

따라서 `public/` 변경은 "생성되었으니 무조건 제외"가 아니라, 원본 MD와 변환 스크립트 변경에 의해 의도적으로 갱신되는 서비스 산출물로 관리해야 한다. 다만 산출물 추적 정책은 명확해야 한다. 원본과 산출물을 함께 커밋할지, 배포 파이프라인에서 재생성할지는 팀 운영 원칙으로 고정하는 편이 좋다.

### 1-3. 이번에 현행화한 문서

| 문서 | 조치 | 비고 |
|------|------|------|
| `docs/guide-creation.md` | 29종 기준으로 정정 | 기존 숏코드 체계만 문서화, 신규 생성 없음 |
| `docs/shortcode-style-guide.md` | 29종 기준 및 `scripts/build-guide.mjs` 경로로 정정 | 신규 5종은 현재 HTML 구현 위치와 PPTX 제외 경고 상태를 명시 |
| `docs/guide-build.md` | 현재 파이프라인 기준으로 재작성 | `md_src/` 원본, `scripts/` 변환기, `public/` 산출물 흐름 중심 |
| `docs/pipeline.md` | `templates/*.mjs` 예시를 `scripts/*.mjs`로 정정 | 현행 숏코드 이름도 함께 정정 |
| `docs/standalone.md` | 신규 가이드 작성 시작점을 `md_src/guides/`로 정정 | standalone 입력으로서 `public/` 역할 유지 |
| `scripts/README.md` | 제목이 HTML -> PPTX 중심이고 현재 `scripts/` 전체 역할을 설명하지 않음 | `build-guide`, `build-publish`, `sync-guides-index`, `md-to-pptx` 사용자가 문서에서 빠짐 |

---

## 2. 계획 대비 미완성 항목

`docs/shortcode-refactoring-plan.md` 기준의 즉시 처리 항목은 이번 작업에서 반영했다.

| 계획 항목 | 현재 상태 | 근거 |
|----------|----------|------|
| Phase 1: `devtools.md` 구문 오류 수정 | 완료 | `cmd-box`, `compare-split` 현행 이름으로 전환 |
| Phase 2: `plan-grid` 필드 역할 통일 | 완료 | `chatGPT.md`, `Grok.md`, `perplexity.md`의 요금 값을 `note`로 이전 |
| Phase 3: PPTX silent drop -> fallback 로그 | 완료 | `scripts/md-to-pptx.mjs`에서 미지원 숏코드 경고 출력 |
| Phase 4: 고빈도 PPTX 미구현 숏코드 구현 | 보류 | 이번 범위에서는 신규 숏코드/렌더러를 만들지 않음 |
| 문서 후속 조치: `guide-creation.md` 29종 반영 | 완료 | 24종 표기 제거 및 기존 29종 기준 보강 |
| 문서 후속 조치: `shortcode-style-guide.md` 29종 반영 | 완료 | 29종 기준과 현재 경로 반영 |

`worklog.md`는 이미 `docs/report/`로 이동되어 있고, 루트 README와 `docs/README.md`의 큰 목차는 29종 기준으로 보강되어 있다.

---

## 3. 현재 코드 위험사항

### HIGH

| 위험 | 위치 | 설명 | 권장 조치 |
|------|------|------|----------|
| 린트 실패 | `src/pages/CollectionViewer.tsx:80` | `collection`이 없을 때 조기 return 이후 두 번째 `useEffect`가 호출되어 Hook 호출 순서 규칙을 위반함 | 두 번째 `useEffect`를 조기 return 위로 올리고 내부에서 `collection` 존재 여부를 처리 |
| 신규 HTML 숏코드의 PPTX 제외 | `scripts/md-to-pptx.mjs:1035` | 미지원 타입은 이제 경고 후 제외됨. PPTX 전용 구현은 이번 범위에서 보류 | 실제 PPTX가 필요한 숏코드부터 별도 구현 |
| 문서와 실제 CLI 경로 불일치 | 일부 과거 보고서/작업일지 | 현재 사용 문서는 `scripts/` 기준으로 정리됨. 과거 보고서는 히스토리로 남음 | 신규 사용자용 문서는 현재 경로만 유지 |

### MEDIUM

| 위험 | 위치 | 설명 | 권장 조치 |
|------|------|------|----------|
| 산출물 추적 정책 불명확 | `public/`, `dist/`, `dist-pptx/` | `public/`은 서비스 산출물로 추적되지만 `dist/`, `dist-pptx/`는 ignore된다. 산출물별 커밋/배포 책임이 문서에 분리되어 있지 않음 | `public/`은 서비스 산출물, `dist/`는 빌드 결과, `dist-pptx/`는 배포/보관 정책 별도 등으로 명확히 문서화 |
| `guides.json` 수동 메타 보존 방식의 한계 | `scripts/sync-guides-index.mjs` | 기존 `title/subtitle/slug`를 우선 보존하므로 MD frontmatter를 수정해도 기존 JSON 값이 자동 갱신되지 않을 수 있음 | 보존 정책을 문서화하거나 `--refresh-meta` 옵션을 별도 제공 |
| `scripts/README.md` 정보 범위 축소 | `scripts/README.md` | 현재는 HTML -> PPTX 도구 문서처럼 보이며 실제 핵심 빌드 파이프라인을 설명하지 않음 | `scripts-guide.md`와 역할을 맞춰 전체 CLI 색인으로 개편 |

### LOW

| 위험 | 위치 | 설명 | 권장 조치 |
|------|------|------|----------|
| 린트 스타일 오류 | `src/components/ui/command.tsx:24`, `src/components/ui/textarea.tsx:5`, `tailwind.config.ts:90` | 빈 interface, CommonJS `require()` 사용으로 ESLint 실패 | 타입 alias 또는 직접 타입 사용, Tailwind plugin import 방식 변경 |
| 빌드 경고 | Vite build output | 번들 청크 913KB, Browserslist DB 오래됨, React SWC 플러그인 권장사항 경고 | 코드 스플리팅 검토, Browserslist 갱신, Vite 플러그인 정책 결정 |
| 테스트 범위 부족 | `src/test/example.test.ts` | 테스트는 1건뿐이며 빌드 파이프라인, shortcode 렌더러, sync 로직 검증이 없음 | 스크립트 단위 테스트와 fixture 기반 HTML/PPTX 누락 검증 추가 |

---

## 4. 검증 결과

| 명령 | 결과 | 비고 |
|------|------|------|
| `npm run test` | 통과 | Vitest 1개 테스트 통과 |
| `npm run lint` | 실패 | 4 errors, 7 warnings |
| `npm run build` | 통과 | `build-publish`, Vite build, `dist/standalone.html` 생성 성공 |

빌드는 통과하지만 린트가 실패하므로, 배포 산출물 생성은 가능하되 코드 품질 게이트로는 현재 실패 상태다.

---

## 5. 우선 개선 순서

1. 린트 실패 4건을 먼저 해결한다.
   - `CollectionViewer.tsx` Hook 순서 위반은 런타임 안정성과 직접 관련이 있다.
   - `command.tsx`, `textarea.tsx`, `tailwind.config.ts`는 빠르게 정리 가능한 정적 오류다.
2. 산출물 관리 정책을 문서에 명시한다.
   - `public/`은 실제 웹 서비스/프레젠테이션 산출물로 관리
   - `dist/standalone.html`은 최종 통합 빌드 결과로 관리
   - `dist-pptx/`는 보관/배포 여부를 별도 정책화
3. PPTX 구현은 실제 사용 우선순위에 따라 별도 진행한다.
   - 이번 작업에서는 신규 숏코드/렌더러를 만들지 않고 경고 로그까지만 반영했다.

---

## 6. 문서 현행화 체크리스트

- [x] `docs/guide-creation.md`: 24종 문구 제거, 29종 목록 및 신규 5종 예시 추가
- [x] `docs/shortcode-style-guide.md`: 24종 문구 제거, `scripts/build-guide.mjs` 링크 및 최신 라인 기준으로 재작성
- [x] `docs/guide-build.md`: `templates/` 기반 절차를 `md_src/guides/` + `scripts/build-guide.mjs` 기준으로 교체
- [x] `docs/pipeline.md`: 모든 명령 예시의 `templates/*.mjs`를 `scripts/*.mjs`로 교체
- [x] `docs/standalone.md`: 신규 가이드 작성 시작점을 `md_src/guides/`로 정정
- [ ] `scripts/README.md`: HTML -> PPTX 단일 설명에서 scripts 전체 색인 문서로 개편
- [x] `scripts/build-guide.mjs`, `scripts/html-to-md.mjs`: CLI help 문구의 `templates/` 잔재 제거
- [ ] `docs/pipeline.md` 또는 `docs/scripts-guide.md`: `public/`을 웹 서비스/프레젠테이션 산출물 관리 영역으로 명시

---

## 7. 결론

현재 프로젝트는 빌드 가능한 상태이며, 루트 README와 문서 인덱스는 큰 방향에서 최신 구조를 따라가고 있다. 또한 `public/`은 Markdown 원본을 웹 서비스 및 프레젠테이션 산출물로 확장하는 핵심 관리 영역으로 기능한다. 이번 작업으로 세부 제작 지침과 스타일 튜닝 문서도 현재의 `md_src/` + `scripts/` + `public/` 구조에 맞췄다.

가장 큰 잔여 코드 문제는 린트 실패다. PPTX 변환은 HTML과 달리 지원 범위 차이가 있을 수 있으므로, 현재처럼 경고 로그를 기반으로 실제 발표에 필요한 숏코드부터 구현 범위를 좁히는 것이 좋다.
