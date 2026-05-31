# 독립형 HTML 및 마크다운 소스 정합성 검증 결과 보고서

본 보고서는 마크다운 원본 소스 파일(`md_src/`)들과 단일 오프라인 실행 배포판(`publish/standalone.html`) 간의 구조적 분석 및 정합성 검증 결과를 정리한 문서입니다. 

중요한 레이아웃 결함이었던 테스트 폴더의 빈 "목차" 내비게이션 링크 생성 버그와, 섀도 돔(Shadow DOM) 격리 환경에서 발생한 인터랙티브 요소(탭 전환 등)의 작동 무효화 버그에 대한 원인 및 기술적 해결책을 상세히 기록합니다.

---

## 1. 마크다운 소스 구조 리팩토링 및 시각 요소 복원
`md_src/vibecoding/` 하위의 핵심 가이드 문서들을 정밀 진단하여 마크다운 저작 규격과 렌더링 스타일 간의 불일치를 완전히 보정했습니다.

### A. 타이틀 블록 데이터 이원화 및 헤더 뭉개짐 해결
- **기존 문제점:** 일부 마크다운 파일(`part01-concepts.md`, `part02-conversation.md`)에서 여러 줄 목록(bullet list) 데이터가 YAML 스칼라 블록 키인 `title: |` 내부에 잘못 정의되어 있었습니다. 이로 인해 빌드 시 타이틀 영역에 거대한 불릿 리스트들이 강제 주입되어 대제목 글꼴 크기로 화면 레이아웃이 완전히 붕개되는 현상이 있었습니다.
- **해결 방안:** 리스트 데이터와 대제목의 스코프를 깔끔하게 분리했습니다. 제목은 일반 한 줄 문자열(`title: "..."`)로 명료하게 유지하고, 여러 줄 목록은 `desc: |` YAML 리터럴 필드로 매핑을 바로잡았습니다.
- **최종 결과:** 가이드의 헤더 제목이 올바른 크기로 프리미엄하게 렌더링되며, 여러 줄 목록도 설명 영역에 차분하게 배치됩니다.

### B. HSL 색상 제어가 가능한 SVG 체크 불릿 기호(✔️) 도입
- **기존 문제점:** 단순 시스템 이모지인 `✔️`는 운영체제(OS)의 내장 폰트 이미지로 렌더링되므로, CSS의 `color` 속성 색상 변경이 불가능하여 카드의 테마 색상과 동기화되지 못하는 미학적 결함이 있었습니다.
- **해결 방안:** 빌더의 `renderMultiLineText` 렌더링 엔진을 고도화했습니다. 목록 기호가 `-`, `*`, `✅`, 또는 `✔️`로 시작할 경우, 이를 **인라인 SVG 체크 기호**(`<svg>`)로 자동 치환하도록 패치했습니다. 이 SVG는 `stroke="currentColor"`를 사용하도록 선언되어 있습니다.
- **최종 결과:** 목록 앞의 체크 불릿 기호가 부모 카드에 적용된 HSL 브랜드 색상(`var(--brand)`)을 지능적으로 자동 상속받아, 모던하고 통일감 있는 색조로 아름답게 빛납니다.

---

## 2. Standalone HTML의 섀도 돔(Shadow DOM) 호환성 완벽 확보

`standalone.html`은 개별 가이드의 CSS 스타일이 외부로 번져 오염되는 것을 원천 차단하기 위해, 각 콘텐츠를 **섀도 돔(Shadow DOM)** 격리 벽(`#guideHost`) 내부에 동적으로 렌더링하는 첨단 웹 아키텍처를 채택하고 있습니다. 그러나 이 격리 구조로 인해 발생했던 중요한 인터랙티브 버그를 추적 및 완벽히 해소했습니다.

### A. 탭 전환 버튼 작동 불능 버그 해결 (`switchTab` 고도화)
- **기존 문제점:** OS 탭 숏코드(`os-tabs`) 등은 탭 전환을 위해 글로벌 `switchTab(btn, id)` 자바스크립트 함수를 실행합니다. 기존 헬퍼 스크립트는 `document.getElementById(id)`를 호출하여 활성화할 패널을 찾았습니다.
- **결함 원인:** 섀도 돔 내부의 요소들은 전역 `document` 트리와 분리된 별도의 문서 조각(Document Fragment)에 속해 있으므로, `document.getElementById` 호출은 언제나 `null`을 반환하게 됩니다. 이 때문에 탭 버튼을 클릭해도 탭 전환이 완전히 먹통이 되던 심각한 호환성 정합성 위배 버그가 존재했습니다.
- **기술적 해결:** 빌더 컴파일러(`build-guide.mjs`) 내에서 주입되는 `switchTab` 함수 정의를 **동적 루트 노드 탐색 방식**으로 우아하게 개정했습니다:
  ```javascript
  function switchTab(btn, id) {
    var w = btn.closest('.tabs-wrap');
    w.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    w.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    
    // 섀도 돔(Shadow DOM) 경계 돌파 및 일반 돔 하위 호환성 동시 사수
    var r = btn.getRootNode();
    var panel = r.getElementById ? r.getElementById(id) : document.getElementById(id);
    if (panel) panel.classList.add('active');
  }
  ```
- **최종 결과:** standalone.html의 격리된 섀도 돔 환경이든 일반 가이드 HTML 환경이든 상관없이 탭 전환 인터랙션이 100% 견고하게 작동하는 완벽한 정합성을 달성했습니다.

### B. 동적 카드 래핑(`.card`) 예외 처리로 레이아웃 무결성 확보
- **기존 문제점:** 독자적인 가로/세로 그리드 레이아웃을 가진 숏코드들(`chapter-list`, `flow`, `checkpoint-grid` 등)이 본문 파서의 일괄적 처리로 인해 불필요하게 일반 사각형 카드 클래스(`.card`)에 이중으로 감싸져 그리드가 찌그러지고 외관을 해치던 문제가 있었습니다.
- **해결 방안:** 빌더 컴파일러의 `buildHtml` 내 토큰 루프 구조를 개편했습니다. 순수 텍스트 계열 토큰(paragraph, list, table 등)이 나타날 때만 `.card` 래퍼가 **동적으로 열리도록 제어**하고, 독자 디자인을 지닌 숏코드 렌더링 결과물이 감지되면 기존 카드를 깔끔히 닫고 카드 외부 공간에 100% 가로 너비로 미려하게 배치되도록 튜닝했습니다.
- **최종 결과:** 제목 바로 뒤에 숏코드가 올 때 빈 사각형 테두리 박스가 덩그러니 남는 버그가 완전히 소멸되었으며, 프리미엄한 컴포넌트 레이아웃들이 오차 없이 시각적 무결성을 사수하게 되었습니다.

---

## 3. 테스트(Test) 폴더 내 빈 "목차" 생성 버그 해소

### A. 결함 원인 분석
`src/data/guides.json`에서 `test` 컬렉션은 다음과 같이 지정되어 있었습니다:
```json
{
  "id": "test",
  "label": "test 시리즈",
  "folder": "test",
  "indexFile": "table-of-contents.html"
}
```
- **발생한 현상:** `md_src/test/` 폴더 내부에는 실무용 `xlsx_json.md` 단 한 파일만 들어 있었고, 목차 파일(`table-of-contents.md`)은 애초에 작성되어 있지 않았습니다.
- **결함 원인:** 오프라인 번들 빌더(`build-standalone.mjs`)가 컬렉션 빌드 시 무조건 `indexFile`("목차")을 강제로 내비게이션 리스트의 첫 파트로 조립하도록 하드코딩되어 있었던 것이 문제였습니다:
  ```javascript
  const indexPart = { slug: "table-of-contents", title: "목차", file: "table-of-contents.html" };
  const allParts = [indexPart, ...parts];
  ```
  이로 인해 실재하지도 않는 `public/test/table-of-contents.html`을 사이드바가 렌더링하려 시도했고, 사용자가 이를 누르면 "콘텐츠를 찾을 수 없습니다" 라는 빈 에러 페이지가 노출되었습니다.

### B. 방어적 예외 안전망 추가
`build-standalone.mjs` 스크립트를 업그레이드하여, 특정 컬렉션의 `indexFile`이 디스크 상에 **실제로 빌드되어 존재할 때만** 내비게이션 파트에 주입하고, 물리적으로 존재하지 않는 경우에는 목차 파트 조립을 건너뛰도록 **방어적 예외 코드 안전망**을 정밀 구축했습니다:
```javascript
  const parts = readCollectionParts(col.folder, col.indexFile);
  const indexFp = path.join(PUBLIC, col.folder, col.indexFile);
  
  let allParts = [];
  if (fs.existsSync(indexFp)) {
    const indexPart = {
      slug: col.indexFile.replace(/\.html$/, ""),
      title: "목차",
      file: col.indexFile,
    };
    allParts = [indexPart, ...parts];
  } else {
    allParts = [...parts];
  }
```

### C. 최종 검증 결과
빌드 파이프라인 구동 시 디스크에 없는 `table-of-contents.html`을 정확히 스킵하여, `test` 컬렉션의 파트 개수가 이전 `2 parts`에서 **`1 parts`**로 정비되었습니다.
이를 통해 사이드바에서 빈 "목차" 링크가 완전히 증발하고, 오직 존재하는 실무 가이드인 `xlsx_json.html`만 깔끔하게 노출 및 작동하게 되었습니다. 물리 목차 파일이 존재하는 `vibecoding` 컬렉션은 본래대로 세련된 목차 페이지 카드가 온전히 제공됩니다.
