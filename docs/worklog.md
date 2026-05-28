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

## 🚀 향후 제언 및 마일스톤
* **특화 시각화 확장**: 추가적인 동적 SVG 애니메이션 숏코드를 신설할 경우, 이번 21종 숏코드 렌더링에 구축한 독립 스키마(`standardizeItem` 및 렌더러단 Fallback) 원칙을 계승하여 안전하게 연동할 것을 적극 권장합니다.

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

