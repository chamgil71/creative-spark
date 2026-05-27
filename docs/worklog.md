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
