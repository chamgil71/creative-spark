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
  * `flow`: 가로 흐름 다이어그램 (`flow`, `flow-step`, `flow-arrow`) 복원.
  * `level-grid`: 난이도 및 5단계 로드맵 진행 스펙트럼 카드 그리드 복원.
  * `checkpoint-grid`: 이모지 기반 5단계 중간 체크포인트 수평 정렬 그리드 복원.
  * `compare-before-after`: Bad vs Good 1:1 대비 전후 비교 레이아웃 복원.
  * `takeaway`: 그라데이션 프리미엄 요약 배너 박스 복원.
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
