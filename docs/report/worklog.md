# Creative Spark 작업 일지 (Worklog)

본 작업 일지는 Creative Spark 마크다운 변환 파이프라인(HTML / PPTX 슬라이드 자동 생성 및 standalone 통합 빌드)의 기능 고도화, 파서 정합성 복원 및 문서화 보강 내역을 기록하는 영구 작업 일지입니다.

---

## 📅 2026-05-27 작업 로그 (v1.2)

### 1. 6대 표준 키 독립 정합성 복원
* **이슈 배경**: `desc`와 `note`를 멀티라인 스칼라(`|`)로 확장하는 과정에서 `meta`와 `note`를 강제로 결합해버린 상호 Fallback 로직(`meta = rawMeta || rawNote` 등)으로 인해 필드 간 고유 구분이 완전히 지워지는 오류가 있었습니다. 이로 인해 `meta`에 기재한 단칩 뱃지 목록이 팁박스에 통째로 결합되어 한 덩어리로 뭉뚱그려져 출력되거나, 하단 메모가 빈 영역에서 오작동이 유발되었습니다.
* **조치 및 수정 사항**:
  * [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) 및 [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs)의 `standardizeItem`에서 강제 상호 결합을 완벽하게 제거했습니다.
  * `meta`와 `note`를 독립 스키마 변수로 철저하게 격리 보존하여 고유 영역 가시성을 살렸습니다.

### 2. 하위 호환성 (Fallback) 튜닝 적용
* **조치 내용**: 기존 마크다운 파일들의 메모란(과거 `meta`로 표기되었던 부분)의 깨짐 현상을 원천 방어하기 위해, **메모 성격을 띠는 숏코드(`compare-grid`, `columns-grid`)**의 렌더러 수준에서만 똑똑하게 `it.note || it.meta`를 Fallback으로 삼아 하단 팁박스로 출력하도록 조정했습니다.
* **결과**: 이전 가이드 파일들을 건드리지 않고도 100% 정상 부활했으며, `plan-grid`나 `compare-split` 등 칩 목록 숏코드에서는 뱃지가 정상적으로 쪼개져 렌더링되는 정합성을 완벽 복원했습니다.

### 3. 마스터 쇼케이스 및 전체 가이드 일괄 변환 패스
* **수행 결과**:
  * `node templates/build-guide.mjs --all "data/md_final/*.md"` 가동 ➡️ **37종의 마크다운 가이드 0-Warning 클린 컴파일 통과.**
  * `node scripts/md-to-pptx.mjs --all "data/md_final/*.md"` 가동 ➡️ **37종 발표용 슬라이드 PPTX 일괄 컴파일 통과.**
  * `npm run build` 가동 ➡️ **Vite React 프로덕션 컴파일 및 1.3MB 크기의 전천후 단일 standalone.html 통합 릴리즈 빌드 패스.**
  * 쇼케이스 마스터 가이드([showcase.html](file:///c:/ai/creative-spark/public/showcase/showcase.html) 및 `showcase.pptx`) 안전 리빌드 완료.

### 4. 스타일 가이드 신설 및 가이드라인 현행화
* **신규 제작**: [shortcode-style-guide.md](file:///c:/ai/creative-spark/docs/shortcode-style-guide.md)
  * 21종의 모든 표준 숏코드 및 시각화 특화 숏코드에 대해, HTML / PPTX 렌더링 수준에서 마진, 패딩, 폰트 크기, HSL 테마 등이 파일 내 어떤 클래스와 함수에서 결정되는지 세세한 튜닝 매핑 정보 기술.
* **보강 업데이트**: [guide-creation.md](file:///c:/ai/creative-spark/docs/guide-creation.md)
  * `desc`, `note` 필드의 멀티라인 작성 룰과 `meta` 필드의 한 줄 파이프 표현법 vs 멀티라인 스칼라(`|`) 칩 분할 규칙 및 주의점 공식 보완 수록 완료.

---

## 📅 2026-05-28 작업 로그 (v1.3)

### 1. 횡형 슬라이드 빌더 (`build-presentation.mjs`) 기능 고도화
* **다중 파일 및 폴더 병합 지원**:
  * 단일 마크다운 변환에서 나아가, 여러 마크다운 파일의 경로 목록을 인자로 받아 하나의 파일로 합치거나, **특정 폴더 경로를 지정하면 폴더 내의 모든 마크다운 파일(*.md)을 이름순으로 자동 병합**하는 다중 스캔 기능 구현 완료.
  * Glob 패턴(예: `md_src/**/*.md`)을 와일드카드로 매칭하여 수십 개의 문서를 하나의 슬라이드 쇼로 정밀 빌드할 수 있는 FS 유틸 연동 완료.
* **슬라이드별 브랜드 테마 연동**:
  * 여러 문서가 하나로 묶였을 때 모든 슬라이드가 단일 색상으로 보이지 않도록, **각 마크다운 파일의 Frontmatter 스타일(`style` 속성)을 분석하여 슬라이드 컨테이너마다 인라인 HSL 테마 CSS 속성(`style="--brand: ...;"`)을 다이내믹하게 주입**.
  * 슬라이드를 가로로 넘길 때마다 브랜드가 자연스럽게 전환(예: Cursor 슬라이드는 초록색 테마, Claude 슬라이드는 인디고 테마)되는 프리미엄 사용자 경험 선사.

### 2. npm run 단축 명령어 보강
* **`build:slide` 신설**:
  * CLI를 직접 기동하던 번거로움을 줄이기 위해 `package.json`의 `scripts` 섹션에 `"build:slide": "node scripts/build-presentation.mjs"` 단축 명령어를 신규 장착 완료.
  * 이제 `npm run build:slide -- <인자>` 형태로 손쉽게 다중 파일/폴더를 횡 슬라이드로 병합 컴파일 가능.

### 3. 디렉토리 정리 및 스크래치 보관함 재배치
* **templates/ 폴더 영구 삭제 및 scripts/ 통합**:
  * 과거 유물로 흩어져 있던 `templates/build-guide.mjs`, `templates/html-to-md.mjs` 등을 `scripts/` 디렉토리 하위로 완전히 이전하고 관련 import 및 실행 참조 경로 일제 업데이트 완료.
  * templates 내 `guide-build.md` 문서는 `docs/guide-build.md`로 이동 및 현행화 후, `templates/` 폴더를 원천 삭제하여 프로젝트 루트를 대단히 깔끔하게 청소함.
* **storage/ scratch/ 하위 이동 및 디렉토리명 교체**:
  * 루트에 존재하던 임시 폴더 `scratch/`를 `data/` 내부로 중첩시키고, `data/` 폴더 전체를 영구적이고 체계적인 로컬 저장 공간인 **`storage/`**로 이름을 변경함 (최종 경로: `storage/scratch/`).
  * 이에 따라 마크다운 파이프라인 및 백업 복원 도구 내의 모든 하드코딩 경로 참조를 `storage/`로 정밀 변경하고 빌드 정합성 최종 검증 통과.

### 4. 고품질 문서화 및 프리미엄 README 이식
* **문서 현행화**: `docs/scripts-guide.md` 가이드에 횡형 슬라이드 프레젠테이션 다중 파일/폴더 병합 옵션 및 단축 명령어(`npm run build:slide`) 가이드 추가 완료.
* **README 전면 개편**: `C:\ai\README_exam.md` 규격을 철저하게 본따서, 뱃지 세트 구성, 배포/개발 환경 정보, 핵심 Key Features, Mermaid 다이어그램 파이프라인, 디렉토리 구조도, 시작하기, 가이드 추가 및 퍼블리시 상세 워크플로우, 자주 쓰는 명령어, 트러블슈팅을 완벽 반영한 **최상급 프리미엄 README.md**를 이식 및 신설 완료.

---

## 📅 2026-05-28 작업 로그 (v1.4) — Vibecoding 비주얼 복원 및 파서 정합성 패치

### 1. 프리미엄 시각 숏코드 5종 도입 및 빌더 고도화 (`build-guide.mjs`, `build-presentation.mjs`)
* **이슈 배경**: 바이브코딩 컬렉션의 풍부한 원본 HTML 시각 도형 및 컴포넌트(흐름도, 스펙트럼 등)들이 마크다운 변환 시 유실 및 뭉개져 쌩 텍스트 문단으로 노출되던 미학적 regressions를 완벽 해결했습니다.
* **신규 숏코드 구현**:
  * `step-flow`: 가로 흐름 다이어그램 (`step-flow`, `flow-step`, `flow-arrow`) 복원.
  * `level-grid`: 난이도 및 5단계 로드맵 진행 스펙트럼 카드 그리드 복원.
  * `checkpoint-grid`: 이모지 기반 5단계 중간 체크포인트 수평 정렬 그리드 복원.
  * `compare-diff`: Bad vs Good 1:1 대비 전후 비교 레이아웃 복원.
  * `takeaway-banner`: 그라데이션 프리미엄 요약 배너 박스 복원.
* **쇼케이스 문서화**: `md_src/showcase/showcase.md` 가이드 맨 끝에 신규 숏코드 5종의 스키마 명세 및 마크다운 예제를 영구 추가 및 업데이트 완료(25번~29번 숏코드).

### 2. 동적 카드(`.card`) 래핑 개선으로 레이아웃 버그 척결
* **원인 규명**: 제목 아래에 본문 콘텐츠 없이 숏코드만 바로 나오거나 빈 공백일 때, 컴파일러가 사각형 카드 테두리 `.card`를 즉시 열어 빈 상자가 남거나 숏코드가 이중 래핑되어 찌그러지던 버그를 정밀 분석했습니다.
* **조치 사항**:
  * 본문 파서의 토큰 순회 루프 내에서 **실제 순수 본문 텍스트 콘텐츠(p, list, table)가 감지될 때만 카드가 동적으로 열리도록** 튜닝했습니다.
  * 독자 디자인을 지닌 숏코드 렌더링 결과물이 들어올 경우 기존 카드를 닫고 카드 외부의 넓은 가로 공간에 100% 반응형으로 미려하게 배치되도록 예외 차단 로직을 추가했습니다.
* **결과**: 제목이나 숏코드 밑에 빈 테두리 박스가 생기던 버그가 완벽하게 치유되었습니다.

### 3. SVG 체크 불릿(✔️) 도입으로 HSL 브랜드 컬러 동적 동기화
* **원인 규명**: 시스템 이모지 `✔️`는 운영체제 이미지 파일이라 CSS `color` 색상 조절이 불가능한 한계를 확인했습니다.
* **조치 사항**:
  * 여러 줄 목록(`desc`)의 기호들을 **인라인 SVG 체크 기호**로 자동 치환하여 불릿 렌더러에 장착하고 `stroke="currentColor"` 방식을 부여했습니다.
  * 이제 목록 불릿이 부모 컴포넌트의 HSL 브랜드 색상(`var(--brand)`)에 맞춰 지능적이고 깔끔하게 채색됩니다.
  * `part01-concepts.md` 및 `part02-conversation.md`에서 타이틀이 리스트로 깨져 나오던 `title: |` 마크다운 파일들의 서식 오류를 정밀 리팩토링하여 `title`(단일 문자열)과 `desc`(여러 줄 목록)로 이원화 완료했습니다.

### 4. Shadow DOM 탭 전환 오작동 해결 및 목차 예외 안전망 완비
* **Shadow DOM 탭 패치**:
  * `standalone.html` 내부 섀도 돔 격리 환경에서 `document.getElementById`가 돔 격리벽을 뚫지 못해 탭 숏코드(`os-tabs`)의 탭 전환이 먹통이 되던 결함을 해결하기 위해, 글로벌 `switchTab` 리스너를 **`btn.getRootNode()` 기반의 동적 돔Fragment 탐색 방식**으로 패치 완료했습니다.
* **목차 예외 방어망 구축**:
  * `guides.json`에서 `test` 컬렉션의 `indexFile`로 설정된 목차 파일이 디스크에 없음에도 빈 목차 링크를 연결해 에러를 내던 standalone 번들 버그를 해결했습니다.
  * `build-standalone.mjs`에 디스크상 실제 파일 실재 여부를 사전 확인하는 코드를 추가하여, 없을 시 목차 링크 생성을 안전하게 건너뛰도록 처리했습니다. test 컬렉션은 빈 목차 없이 `1 parts`로 정교하게 정비되었습니다.

### 5. 종합 정합성 보고서 출판 및 빌드 성공
* **보고서 수록**: 정밀 검증 내역 및 해결 설계를 격조 높은 한글 보고서 문서인 **`docs/standalone-integrity-report.md`**에 정식 등재 완료했습니다.
* **빌드 결과**: `npm run build:publish` 등 전체 빌드 파이프라인을 구동하여 0-Error 완벽 통과 및 Standalone 번들 `1828.7 KB` 무결함 릴리즈 완료했습니다.

---

## 📅 2026-06-10 작업 로그 (v1.5) — 숏코드 스타일 보완 및 git-flow 시각화 개선

### 1. 숏코드 4종 스타일시트 보완 (`build-guide.mjs`, `build-presentation.mjs`)
- **이슈 배경**: `level-grid`, `checkpoint-grid`, `step-flow`, `takeaway-banner` 등의 신형 숏코드들이 렌더러 로직에는 있었으나, CSS 클래스 규칙이 누락되어 브라우저에서 밋밋하게 세로 쌩 텍스트 형태로 나열되던 결함을 해결했습니다.
- **수정 및 추가 사항**:
  - `level-grid`: 난이도 로드맵용 가로형 카드 그리드 CSS를 추가하고, `highlight` 태그 시 브랜드 HSL 테두리와 부드러운 배경이 동적으로 돋보이도록 구현했습니다.
  - `checkpoint-grid`: 이모지와 가로 뱃지 형식의 체크포인트 수평 카드로 시각화하는 CSS 규칙을 삽입했습니다.
  - `step-flow`: `display: flex`와 가로 스크롤(`overflow-x: auto`)을 부여하여 두 줄로 찌그러지지 않고 깔끔하게 한 줄 가로 스크롤로 단계가 표현되도록 교정하고, 노드 사이에 가로 화살표가 예쁘게 배치되도록 `.step-flow-arrow` 스타일을 신규 작성했습니다.
  - `takeaway-banner`: "그라데이션 프리미엄 배너" 설명에 걸맞게 그라데이션 가로 띠와 둥근 모서리, 브랜드 보더를 입힌 시각 디자인을 구현하고, `.takeaway-banner-banner` 등 컴파일러 내 오타를 제거했습니다.

### 2. `git-flow` 다차원 버전 흐름 오버홀
- **이슈 배경**: 기존의 `git-flow` 렌더러는 하나의 브랜치에 가로로 여러 커밋을 그릴 때 좌표 겹침 현상이 발생해 모든 노드가 한가운데에 중첩되어 보이고, `tag`와 `meta` 정보가 정상적으로 나타나지 않던 렌더링 결함이 있었습니다.
- **수정 및 추가 사항**:
  - `.branch-line`을 가로 flex 구조로 변경하고, `.commit`을 `position: relative;` 형태로 겹치지 않게 정렬했습니다.
  - 마크다운의 `tag` (버전 뱃지 목록)와 `meta` (커밋 설명글 목록)를 파이프(`|`) 기호로 각각 파싱하여, 1:1 동적 매핑을 통해 가로 방향으로 여러 버전의 커밋 노드들을 다중 생성하도록 렌더러 함수를 고도화했습니다.
  - 브랜치 행의 최소 높이(`min-height: 80px`)를 확보하여 상단 버전 뱃지(`.commit-label`)와 하단 커밋 설명(`.commit-desc`)이 세로로 겹치거나 간섭하지 않도록 정교하게 배치했습니다.
  - `git-flow` 컨테이너 배경이 어둡기 때문에 하단 텍스트 색상을 밝은 회색(`#94A3B8`)으로 고정 지정하여, 라이트 모드 웹브라우저에서도 텍스트가 묻히지 않도록 프리미엄 가독성 처리를 완료했습니다.

### 3. 컴파일러 구버전 숏코드 별칭 매핑 정비 (`md-to-pptx.mjs` 포함)
- **조치 사항**: 숏코드 명칭 표준화에 대응하여 `scripts/md-to-pptx.mjs`, `scripts/build-guide.mjs`, `scripts/build-presentation.mjs`의 분기문 조건에 `tool-box`, `workflow-strip`, `bottom-list`, `flow`, `compare-before-after`, `takeaway` 등의 구버전 숏코드 별칭(Alias) 조건을 유실 없이 정비하여 하위 호환성을 완벽히 보완했습니다.

### 4. PowerPoint 파일 락 해제 및 최종 프로덕션 빌드 성공
- **빌드 및 락 우회**: 로컬 MS PowerPoint가 잡고 있던 `public/showcase/showcase.pptx` 파일의 쓰기 락을 해제한 후, 빌드 스크립트를 재구동하여 무오류 릴리즈 완료했습니다.
- **최종 빌드 패스**: `npm run build` 및 `npm run build:publish`를 가동하여, 가이드 및 횡형 슬라이드용 정적 HTML을 안전하게 리빌드하고, React 가이드북 배포 에셋 컴파일 및 오프라인 통합 단일 standalone.html 번들(`2045.1 KB`) 컴파일에 에러 없이 성공했습니다.

---

## 📅 2026-06-11 작업 로그 (v1.6) — Marp 기능 통합 및 커스텀 슬라이드 설정 고도화

### 1. 슬라이드 분할 로직 보완 (H1, H2 및 `---` 공존)
* **수정 파일**: [build-presentation.mjs](file:///c:/ai/creative-spark/scripts/build-presentation.mjs), [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs)
* **조치 내용**: 헤더 기반 자동 분할과 `---` 수평선 기준 수동 분할이 단일 문서 내에서 혼용될 수 있도록 빌더들의 토큰 파싱 로직을 보완했습니다. 분할 지시어가 연속해서 발생하거나 본문이 없는 빈 레이아웃 상황에서 내용이 아예 없는 빈 페이지(빈 슬라이드)가 중복으로 렌더링되지 않도록 세이프가드 필터링을 완비했습니다.

### 2. 프론트메터 전역 스타일 오버라이드 구현
* **수정 파일**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs)
* **조치 내용**: 개별 마크다운 문서 상단 Frontmatter에 `fontFace`, `titleSize`, `bodySize` 등의 디자인 변수를 임시 지정하면, 전역 기본 설정인 `pptdesign.config.json` 값을 오버라이드하여 최우선 반영되도록 데이터 바인딩을 추가했습니다.

### 3. 로컬 슬라이드 스타일 `::: slide-config` 숏코드 개발
* **수정 파일**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs), [build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs), [build-presentation.mjs](file:///c:/ai/creative-spark/scripts/build-presentation.mjs)
* **조치 내용**:
  * **PPTX**: 해당 숏코드 블록 내의 배경(`bg`), 글자색(`color`), 크기 옵션들이 **현재 슬라이드 범위에만 적용**되고 다음 페이지 분할 지점에서 원본 기본값으로 완벽하게 리셋되는 슬라이드 단위의 일시 스타일 주입 메커니즘을 적용했습니다.
  * **HTML 및 횡형 슬라이드**: 브라우저 렌더링 시 타 요소에 사이드 이펙트를 주지 않도록 `:has()` 가상 선택자와 임의 생성된 고유 `uid` 클래스를 결합하여, 오직 **해당 슬라이드/섹션 범위에만 인라인 CSS 변수 및 스타일을 Scoped하게 주입**하도록 구현했습니다.

### 4. 마크다운 이미지 렌더링 지원 (PPTX 및 HTML)
* **수정 파일**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs)
* **조치 내용**: 
  * 기존에는 마크다운 이미지 구문(`![alt](url)`)의 URL 주소가 변환기에서 소거되던 현상이 있었습니다. 이를 해결하기 위해 `tokenToBlock`에서 단독 이미지 문단을 감지하여 `{ type: "image", src, alt }` 블록으로 추출하고, `blockH` 높이 계산 및 `renderBlock` 렌더러에 연동했습니다.
  * PPTX 변환 시 `slide.addImage`를 활용하여 파워포인트 내에 외부 이미지 링크가 깨짐 없이 자동 배치되도록 고도화하였으며, 이미지 다운로드/로딩 실패 시를 대비해 안정적인 텍스트 대체 박스 예외 처리를 내장했습니다.
  * 기존 HTML 및 횡형 슬라이드 빌더는 `marked`에 의해 `<img>` 태그로 자동 변환되던 내장 강점을 유지하면서 PPTX와의 시각적 정합성을 동기화했습니다.

### 5. 검증 파일 작성 및 빌드 통과
* **검증 내용**: 
  * 마크다운 테스트 원본 [test-marp-features.md](file:///c:/ai/creative-spark/md_src/guides/test-marp-features.md)에 외부 이미지 링크를 포함한 5번 슬라이드 검증 섹션을 추가하여 `npm run build:publish` 및 PPTX 수동 변환을 재가동했습니다.
  * H1, H2, `---`가 동시 공존함에도 빈 페이지 없이 정확히 5개의 슬라이드로 쪼개지고, `::: slide-config` 다크 테마 및 PPTX 내의 외부 이미지 렌더링이 경고 없이 고화질 파워포인트 슬라이드로 최종 빌드 완료됨을 교차 검증했습니다.
  * `npm run test` 유닛 테스트 스크립트 실행으로 0-Error 통과를 확인했습니다.

---

## 📅 2026-06-17 작업 로그 (v1.7) — 테마 안전한 숏코드 색상 키워드(main, sub, deep 등) 지원

### 1. 숏코드용 의미론적(Semantic) 색상 키워드 기능 도입
* **배경 및 필요성**: 기존 숏코드 컴포넌트들의 개별 아이템 색상을 다르게 지정하려면 마크다운 원본 내에 `#6366F1`과 같은 Hex 색상 코드를 하드코딩해야 했습니다. 이로 인해 스타일 프리셋(예: `ai-chat`, `ai-dev` 등)을 전환하더라도 마크다운에 하드코딩된 색상이 우선 적용되어 디자인 일관성이 깨지는 서식 이식성 결함이 있었습니다.
* **해결 방안 및 구현**:
  * 마크다운 숏코드의 `color:` 필드에 하드코딩된 Hex 값 대신 의미론적 키워드(`main`, `sub`, `deep`, `mid`, `light` 등)를 지정할 수 있는 색상 키워드 해석 시스템을 신설했습니다.
  * 기존 Hex 코드 사용성도 100% 정상 지원하는 하이브리드 인터프리팅 방식으로 하위 호환성을 완벽 보장합니다.

### 2. 가이드 및 프레젠테이션 빌더 고도화
* **수정 파일**: [build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs), [build-presentation.mjs](file:///c:/ai/creative-spark/scripts/build-presentation.mjs)
* **조치 내용**:
  * `resolveColorKeyword(color)` 공통 함수를 추가하여 `"main"`/`"brand"` ➡️ `var(--brand)`, `"sub"`/`"brand-dark"` ➡️ `var(--brand-dark)`, `"deep"`/`"brand-deep"` ➡️ `var(--brand-deep)`, `"mid"`/`"brand-mid"` ➡️ `var(--brand-mid)`, `"light"`/`"brand-light"` ➡️ `var(--brand-light)`로 매핑했습니다.
  * `renderAccent`, `renderTextColor`, `renderCompareNote`, `renderDesc` 및 각 숏코드 렌더러 분기(`stat-card`, `tool-list`, `plan-grid`, `columns-grid` 등) 내에서 이 키워드를 파싱하여, CSS 변수일 때는 `color-mix()`와 조합하여 투명도나 그라데이션이 알맞게 처리되도록 인라인 CSS 코드를 정교하게 작성했습니다.

### 3. PPTX 렌더러 키워드 매핑 및 컨텍스트 바인딩
* **수정 파일**: [registry.mjs](file:///c:/ai/creative-spark/scripts/pptx-renderers/registry.mjs), [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs)
* **조치 내용**:
  * PPTX 공통 유틸리티인 `helpers.hexClean(hex, pal)` 함수에 `pal` 매개변수를 추가하여 PPTX 생성 환경에서도 의미론적 키워드가 해당 슬라이드의 활성화된 팔레트 색상 Hex값으로 즉시 자동 번역되도록 개선했습니다.
  * 22개 PPTX 개별 숏코드 렌더러 파일을 일일이 고치지 않고도, `md-to-pptx.mjs` 디스패처 레벨(`itemH` 및 `renderItem`)에서 `helpers`의 `hexClean`을 현재 슬라이드의 `pal` 컨텍스트와 바인딩(`helpers.hexClean(hex, pal)`)하여 호출하도록 우아하게 설계했습니다.

### 4. 마스터 가이드 검증 및 프로덕션 빌드 성공
* **수수료 조치**: [ai-tools-guide.md](file:///c:/ai/creative-spark/md_src/claudeguide/ai-tools-guide.md)의 특정 `step-list` 숏코드에서 하드코딩되어 있던 `#6366F1`, `#10B981`, `#F59E0B` 색상을 각각 `main`, `sub`, `deep` 키워드로 변환하여 실전 작동을 검증했습니다.
* **빌드 검증**: `npm run build`를 재가동하여 0-Error로 컴파일 통과 및 단독 standalone.html 번들 생성 완료를 확인했습니다.


