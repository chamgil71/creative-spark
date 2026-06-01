# Creative Spark 숏코드 디자인 튜닝 및 미세 조정 가이드 (Shortcode Style Guide)

본 지침서는 Creative Spark가 지원하는 **24종 표준 숏코드 및 특화 시각화 컴포넌트**의 HTML 변환 스타일과 PPTX 슬라이드 도식화 결과물을 직접 커스텀하고 미세 조정(마진, 패딩, 폰트 크기, HSL 컬러, 그리드 폭 등)하고자 할 때 사용하는 **클래스/스크립트 매핑 및 튜닝 가이드**입니다.

---

## 1. 전역 디자인 설정 및 공통 토큰

### 1) HTML 전역 디자인 변수
* **위치**: `scripts/build-guide.mjs` 내의 `<style>` 태그 (:root 선택자)
* **주요 제어 토큰**:
  * `--radius`: 모든 카드와 버튼의 모서리 둥글기 값.
    * *튜닝 원리*: `scripts/build-guide.mjs` 상단에서 `CONFIG?.slide?.globalRadius` (기본 `0.08` 인치) 값을 읽어 `Math.round(radiusVal * 150)px` 형태로 자동 환산 적용하므로, `config/pptdesign.config.json`에서 조율하면 HTML and PPTX 모서리가 동기화되어 같이 조절됩니다.
  * `--shadow`, `--shadow-lg`: 카드 호버 효과 및 깊이감 제어.
  * `--brand`, `--brand-dark`, `--brand-light`: frontmatter의 `style` 설정값에 따라 매핑되는 컬러 팔레트 토큰.

### 2) PPTX 전역 디자인 변수
* **위치**: `config/pptdesign.config.json`
* **주요 제어 토큰**:
  * `"slide.globalRadius"`: 도형의 둥글기 인치 (기본 `0.08` -> 약 `12px`).
  * `"card.padX"`, `"card.padY"`: 카드의 내부 상하좌우 패딩 (각각 `0.25`, `0.2` 인치).
  * `"card.gap"`: 컴포넌트들 간의 세로축 숨통 간격 (기본 `0.15` 인치).
  * `"card.titleSize"`, `"card.bodySize"`: 대제목 및 상세 본문의 기본 글꼴 포인트 (`14` pt, `11` pt).

---

## 2. 24종 숏코드별 상세 디자인 튜닝 매핑

---

## [1] plan-grid (요금제 / 플랜 비교 격자)

### 숏코드설명
* **사용 키**: `title` (플랜명), `tag` (추천 뱃지), `desc` (가격/월), `meta` (특징 칩 목록), `note` (하단 추가 메모), `featured` ("true" 여부), `color`
* **주 사용처**: 서비스 요금 요약표, 등급별 멤버십 플랜 다단 대조 비교.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 259 ~ 280)
* **해당 CSS 클래스 및 조정 방법**:
  * `.plan-grid`: 다단 배열 그리드 갭 조율 (`gap: 20px;`).
  * `.plan-card`: 플랜 카드 기본 그림자 및 내부 패딩 조율 (`padding: 25px;`).
  * `.plan-card.plan-featured`: 강조 요금제에 들어가는 광원 섀도우 튜닝 (`box-shadow: 0 8px 24px ${it.color}33;`).
  * `.plan-features li`: 특징별 체크박스 목록 줄간격 및 아이콘 튜닝 (`padding: 8px 0;`).
* **조정 포인트 예시**: 요금 가격과 특징 리스트 사이의 여백을 좁히고 싶다면, `.plan-title` 클래스의 `margin-bottom: 20px;` 수치를 `10px`로 낮춥니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 708 ~ 743)
* **해당 설정 및 조정 방법**:
  * `"planGrid.maxCols"`: 슬라이드 한 장당 들어올 수 있는 요금 카드의 최대 개수 (기본 `4`).
  * `"planGrid.featureLineH"`: `meta`로 나열되는 리스트 항목들의 세로 한 줄 높이 (기본 `0.28` 인치). 이를 조율해 전체 카드의 크기와 비례를 제어합니다.

---

## [2] feature-grid (대표 강점 / 기술 소개 격자)

### 숏코드설명
* **사용 키**: `icon` (이모지), `tag` (우측 상단 뱃지), `title` (강점 제목), `desc` (설명 본문), `color`
* **주 사용처**: 시스템의 장점 나열, 핵심 아키텍처 구성 기술 목록화.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 171 ~ 207)
* **해당 CSS 클래스 및 조정 방법**:
  * `.feature-card`: 전체 테두리색 및 호버 애니메이션 조율.
  * `.feature-tag`: 우측 상단 뱃지 배경색 및 폰트 세팅 (`font-size: 0.75rem; font-weight: 900;`).
  * `.feature-card-title`: 제목 왼쪽에 인라인 밀착하는 이모지 간격 제어.
* **조정 포인트 예시**: 카드에 마우스를 올렸을 때 위로 튀어나오는 느낌을 강하게 하려면, `.icon-card:hover, .feature-card:hover` 내의 `transform: translateY(-5px);`를 `-10px`로 상향 조절합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 389 ~ 410 / `renderItem` 루프)
* **해당 설정 및 조정 방법**:
  * `"grid.featureCardMinW"`: 카드의 최소 기준 가로 폭 (기본 `2.6` 인치). 이 값이 커질수록 가로폭이 넓어지며 한 줄에 배치되는 열의 개수가 자동으로 좁혀집니다.

---

## [3] icon-grid (이모지 범용 카드 격자)

### 숏코드설명
* **사용 키**: `icon` (빅 이모지), `title` (요약 대제목), `desc` (요약 본문), `color`
* **주 사용처**: 다목적 3단/4단 반응형 요약 카드 구성 시 활용.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 171 ~ 207)
* **해당 CSS 클래스 및 조정 방법**:
  * `.icon-card-icon`: 중앙 정렬된 대형 이모지의 폰트 크기 조율 (`font-size: 2.5rem;`).
  * `.icon-card-title`: 중앙 정렬 대제목의 크기 및 색상 조율.
* **조정 포인트 예시**: 이모지가 너무 작아 보일 경우, `.icon-card-icon` 의 `font-size` 값을 `3.2rem`으로 키워 시각적 강조 효과를 더할 수 있습니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 378 ~ 388 / `renderItem` 루프)
* **해당 설정 및 조정 방법**:
  * `"grid.iconCardMinW"`: 카드의 최소 가로 폭 (기본 `1.8` 인치). 슬라이드당 가로폭 배열 개수를 자동 통제합니다.

---

## [4] badge-grid (미니 스택 / 단어 뱃지 격자)

### 숏코드설명
* **사용 키**: `icon` (작은 이모지), `title` (키워드/스택명), `tag` (버전/강조), `color`
* **주 사용처**: 기술 스택 묶음 나열, 관련 도구 리스트의 초소형 조밀 배치.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 178 ~ 185)
* **해당 CSS 클래스 및 조정 방법**:
  * `.badge-grid`: 초소형 그리드 레이아웃 조율 (`grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));`).
  * `.badge-item`: 140px 미니멀 버튼형 카드 둥글기 및 테두리선 두께 조율.
* **조정 포인트 예시**: 키워드가 너무 뭉쳐 보인다면, `.badge-grid` 의 `gap: 15px;`를 `20px`로 늘리고 `.badge-item` 내의 `padding`을 추가 확보합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 403 ~ 409 / `renderItem` 루프)
* **해당 설정 및 조정 방법**:
  * 렌더러 루프 내의 가로 및 세로 배치 오프셋 상수를 바탕으로 동작하며, `globalRadius`에 비례하여 뱃지 카드 둥글기가 연동됩니다.

---

## [5] stat-grid (수치 지표 / 핵심 데이터 카드)

### 숏코드설명
* **사용 키**: `icon` 또는 `title` (거대 데이터 수치), `title` (수치 라벨/이름), `desc` (참조용 추가 노트), `color`
* **주 사용처**: "33% 성능 향상", "₩0 비용", "2K 해상도" 등 거대한 세리프 서체의 지표 표현.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 186 ~ 192)
* **해당 CSS 클래스 및 조정 방법**:
  * `.stat-card`: 수치 카드 상단 3px 보더 라인 조율 (`border-top: 3px solid var(--brand);`).
  * `.stat-val`: 중앙 정렬된 거대 지표 텍스트 폰트 조율 (`font-size: 2.6rem; font-family: Georgia, serif;`).
  * `.stat-name`, `.stat-note`: 서브 라벨 글꼴 사이즈 튜닝.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 956 ~ 978)
* **해당 설정 및 조정 방법**:
  * `cardH2`: 데이터 카드의 기본 세로 크기 (기본 `1.2` 인치).
  * 렌더러 내 수치 텍스트 크기 `fontSize: 22` pt를 직접 조절하여 발표 슬라이드의 지표 강조도를 극대화할 수 있습니다.

---

## [6] tool-box (도구 상세 설명 요약 상자)

### 숏코드설명
* **사용 키**: `icon` (도구 대표 아이콘), `title` (도구명), `desc` (슬로건/한 줄 설명), `tag` (사용처 배지), `meta` (도구 기능 리스트), `color`
* **주 사용처**: 추천 툴 목록, 개발 환경별 전용 에이전트 요약 설명 카드.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 210 ~ 226)
* **해당 CSS 클래스 및 조정 방법**:
  * `.tool-card` (숏코드명: `tool-box`): 카드 전체 외곽선 섀도우 조율.
  * `.tc-header`: 헤더 그라데이션 및 색상 융합 제어.
  * `.tc-list`: 하단의 기능 목록(`meta` 파이프 분할 영역) 여백 및 리스트 불렛 폰트 튜닝.
* **조정 포인트 예시**: 목록 텍스트의 크기가 너무 커서 뭉쳐 보인다면, `.tc-list li` 의 `font-size` 값을 `0.85rem`으로 조금 줄이고 `padding`을 콤팩트하게 압축합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 668 ~ 706)
* **해당 설정 및 조정 방법**:
  * `"toolCard.h"`: 배너 형태 도구 헤더의 고정 높이 (기본 `0.8` 인치).
  * `meta` 리스트 한 줄의 간격 오프셋 `my += 0.24` 수치를 수정하여 텍스트 겹침 현상을 조율할 수 있습니다.

---

## [7] workflow-strip (가로형 연쇄 흐름도)

### 숏코드설명
* **사용 키**: `icon` (단계 이모지), `title` (단계명), `meta` (활용 툴/코멘트), `color`
* **주 사용처**: 기획 -> 초안 -> 디자인 -> 검토 -> 배포 등으로 연쇄 작동하는 가로 방향 마일스톤 흐름 표현.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 229 ~ 237)
* **해당 CSS 클래스 및 조정 방법**:
  * `.workflow-strip`: 가로 정렬 플렉스박스 구조.
  * `.wf-step`: 각 단계별 개별 라운드 박스.
  * `.wf-arrow`: 연결선 역할을 하는 오른쪽 정렬 화살표 위치 조율 (`right: -15px; top: 50%; font-size: 1.2rem;`).
* **조정 포인트 예시**: 스텝 카드의 너비가 좁아 텍스트가 줄 바꿈 되는 경우, `.wf-step` 의 최소 가로폭을 명시적으로 부여하거나 패딩을 좁힙니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 651 ~ 666)
* **해당 설정 및 조정 방법**:
  * `"workflow.stepH"`: 각 스텝 박스의 높이 (기본 `0.95` 인치).
  * `"workflow.arrowW"`: 화살표(`→`)를 안전하게 그리기 위한 전용 X축 폭 마진 (기본 `0.25` 인치).

---

## [8] step-list (수직형 순서 단계 목록)

### 숏코드설명
* **사용 키**: `title` (단계 요약), `desc` (상세 실행 지침), `color`
* **주 사용처**: 튜토리얼 1단계, 2단계, 3단계의 수직 나열 및 가독성 세팅.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 240 ~ 249)
* **해당 CSS 클래스 및 조정 방법**:
  * `.step-list`: 수직형 목록 여백 조율.
  * `.step-num`: 좌측 동그란 3D형 숫자 원의 지름 및 글씨 세팅 (`width: 32px; height: 32px; font-weight: 800;`).
  * `.step-content`: 우측 상세 본문 텍스트 간격 제어.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 613 ~ 628)
* **해당 설정 및 조정 방법**:
  * `"grid.stepItemH"`: 스텝 항목 하나가 차지하는 세로 슬롯 높이 (기본 `0.72` 인치). Y축 높이를 조율해 페이지 넘침을 제어합니다.

---

## [9] compare-grid (다각도 비교 / 하단 팁박스 카드)

### 숏코드설명
* **사용 키**: `title` (비교 대상), `desc` (상세 대안 비교 내용), `note` (정식 하단 메모), `meta` (하위 호환 팁박스 텍스트 Fallback), `color`
* **주 사용처**: 장단점 대조, 사용자 유형별 최적 대안 권장 코멘트 추가 기재.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 252 ~ 260)
* **해당 CSS 클래스 및 조정 방법**:
  * `.compare-card`: 은은한 투명도를 지닌 브랜드 테마 보더 적용.
  * `.compare-note`: 최하단에 성형되는 전용 팁박스 메모 영역 (`background: var(--brand-light); color: var(--brand-dark); font-size: 0.85rem; padding: 10px 14px;`).
* **조정 포인트 예시**: 하단 메모의 가독성을 높이려면, `.compare-note` 의 배경 투명도를 인라인 값(`style="background:${it.color}15"`)에서 직접 튜닝합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 630 ~ 650)
* **해당 설정 및 조정 방법**:
  * `cardH2`: 카드의 기본 높이 (기본 `1.4` 인치).
  * 메모란 팁박스의 Y 오프셋 계산값(`cy + 1.05`)과 팁박스 높이 `0.28` 인치를 조율해 파워포인트 내 하단 배치의 균형을 맞춥니다.

---

## [10] columns-grid (범용 다단 텍스트 단 카드)

### 숏코드설명
* **사용 키**: `title` (단락 제목), `desc` (설명 본문), `note` (예시/참고란), `meta` (예시 Fallback), `color`
* **주 사용처**: 장식 요소를 배제하고 줄글 본문 자체의 레이아웃 가독성을 최대로 높이고자 할 때 활용.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 293 ~ 302)
* **해당 CSS 클래스 및 조정 방법**:
  * `.columns-grid`: 가로 다단 배치.
  * `.column-card`: 상단에만 얇게 올려둔 포인트 탑 바 레이아웃 (`.card-top-bar { height: 4px; }`).

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 980 ~ 1010)
* **해당 설정 및 조정 방법**:
  * 타이틀 부분을 연한 브랜드 배경에 Courier New 서체의 모던 고정폭 폰트 상자로 감싸 도식적 아름다움을 가미했습니다. 렌더러 함수 내 `fill: { color: ac, transparency: 93 }` 수치로 투명도를 튜닝합니다.

---

## [11] bottom-list (최하단 태그 칩 마무리 카드)

### 숏코드설명
* **사용 키**: `title` (마무리 권장 문구), `desc` (추가 요약문), `meta` (파이프 구분 태그들), `color`
* **주 사용처**: 가이드 문서 최하단에 관련 참고 자료 태그나 카테고리를 미려하게 장식하며 정리할 때 활용.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 304 ~ 312)
* **해당 CSS 클래스 및 조정 방법**:
  * `.bottom-list-card`: 보더 및 그림자 속성.
  * `.bl-chips`: 둥근 버튼 칩들의 묶음 컨테이너.
  * `.bl-chip`: 100px 필형 둥근 모서리형 뱃지 스타일 (`border-radius: 100px; padding: 5px 15px; font-weight: 800;`).

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 745 ~ 771)
* **해당 설정 및 조정 방법**:
  * `"bottomList.chipGap"`: 칩들 간의 수평 마진 간격 (기본 `0.12` 인치).
  * `"bottomList.chipRadius"`: 개별 칩 도형의 모서리 둥글기 (기본 `0.1` 인치 -> 필 모양 연출).
  * `"bottomList.chipH"`: 개별 칩의 고정 세로폭 높이 (기본 `0.45` 인치).
  * `"bottomList.fontSize"`: 칩 내부 텍스트 폰트 포인트 (기본 `11` pt).

---

## [12] compare-split (2단 대조 비교 분석 상자)

### 숏코드설명
* **사용 키**: `title` (대상 2종), `desc` (핵심 한 줄 대조), `meta` (개별 단칩 뱃지 목록), `note` (정식 메모 가이드라인)
* **주 사용처**: 클라우드 vs 자체호스팅, React vs Vue 등 주요 대안 2종을 칼각으로 양측 좌우 비교할 때 활용.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 315 ~ 331)
* **해당 CSS 클래스 및 조정 방법**:
  * `.compare-2col` (숏코드명: `compare-split`): 2분할 레이아웃 조율 (`grid-template-columns: 1fr 1fr; gap: 24px;`).
  * `.c2-card.c2-left`:  강조 디자인 세팅.
  * `.c2-list li`: `meta` 리스트가 개별 칩박스 뱃지(Badge) 형태로 쪼개져 렌더링되게 튜닝.
  * `.c2-note`: 하단 여러 줄 지원 메모란 조율.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 773 ~ 824)
* **해당 설정 및 조정 방법**:
  * `"compare2col.colGap"`: 좌우 카드 사이의 X축 간격 여백 (기본 `0.25` 인치).
  * `"compare2col.itemLineH"`: `meta` 불렛 항목 간 세로 줄 높이 (기본 `0.32` 인치). 이를 늘리면 리스트가 더 드넓고 시원하게 열립니다.

---

## [13] alert-box (팁 / 돌출 알림 상자)

### 숏코드설명
* **사용 키**: `title` (강조문 제목), `desc` (상세 꿀팁 텍스트), `icon` (알림 이모지), `type` (tip | warn | success | danger), `tag`
* **주 사용처**: 본문 진행 중 돌출되는 주의사항, 추가 예외 케이스 팁 제공.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 334 ~ 347)
* **해당 CSS 클래스 및 조정 방법**:
  * `.alert-box`: 타입별 인라인 HSL 변수 `--alert-color`를 기준으로 배경 및 보더색이 조율되는 우아한 디자인.
  * `.alert-icon`: 왼쪽 고정 이모지 폰트 및 세로 정렬 제어.
  * `.alert-body strong`: 제목과 상세 설명 사이의 내부 줄 간격 튜닝.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 826 ~ 871)
* **해당 설정 및 조정 방법**:
  * `ALERT_COLORS` 객체 사전: `tip`, `warn`, `success`, `danger`에 해당하는 PPTX 전용 헥사코드 정보 수록. X, Y 간격 상수와 Y축 가산값(`cy += boxH + c.gap`)을 조율해 파워포인트 레이아웃을 통제합니다.

---

## [14] cmd-box (가상 터미널 명령어 상자)

### 숏코드설명
* **사용 키**: `title` (터미널 창 라벨), `tag`, `meta` (언어 타입), `desc` (실제 소스코드)
* **주 사용처**: 리눅스/윈도우 명령어 라인 실행문 기재, 터미널 로그 재현.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 350 ~ 363)
* **해당 CSS 클래스 및 조정 방법**:
  * `.cmd-block`: 다크 모드 터미널 창 기본 보더 및 투명도 세팅.
  * `.cmd-header`: 상단바 제목 배지 및 우측 정렬된 복사(Copy) 작동 버튼 UI.
  * `.cmd-pre`: JetBrains Mono 폰트 및 모던 가상 터미널 다크 배경 적용.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 908 ~ 927)
* **해당 설정 및 조정 방법**:
  * `h3Size`: 터미널 제목 표시 라벨 크기.
  * `codeSize`: 실제 소스 코드의 고정폭 글꼴 크기 (기본 `10` pt).

---

## [15] os-tabs (운영체제 플랫폼별 탭 전환기)

### 숏코드설명
* **사용 키**: `title` (탭 내비 텍스트), `tag`, `desc` (탭 패널 본문)
* **주 사용처**: Windows, Mac, Linux OS 환경별 실행 명령어를 사용자가 수평으로 탭 전환해가며 선택적으로 확인할 수 있도록 제어.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 366 ~ 374)
* **해당 CSS 클래스 및 조정 방법**:
  * `.tabs-wrap`: 탭 전체 컨테이너.
  * `.tabs-nav`: 수평 탭바 마진 제어.
  * `.tab-btn`: 클릭 시 스위칭을 유도하는 자바스크립트 바인딩 및 탭 보더 색상 조율.
  * `.tab-panel.active`: 선택된 탭 활성화 본문 출력.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 929 ~ 954)
* **해당 설정 및 조정 방법**:
  * 발표용 파워포인트에서는 마우스 클릭 반응형 스위칭이 불가능하므로, 스크립트가 탭별 카드를 연속 다중 행 형태로 자동 분할하여 안전하게 목록 형태로 동시 출력합니다. 각 행 오프셋을 튜닝하려면 Y축 누적 변수인 `cy += totalH + c.gap` 식을 활용합니다.

---

## [16] faq-list (자주 묻는 질문 아코디언 목록)

### 숏코드설명
* **사용 키**: `title` (질문 Q), `desc` (답변 A)
* **주 사용처**: FAQ 아코디언 질의응답 리스트 구성 시 활용.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 377 ~ 386)
* **해당 CSS 클래스 및 조정 방법**:
  * `.faq-item`: 클릭하면 열리는 클래스 `.open` 전환 토글.
  * `.faq-q`: 우측 정렬된 회전 화살표(`▼`) 트랜지션 및 폰트 세팅.
  * `.faq-a`: 답변이 부드럽게 펼쳐지는 패딩 숨통 높이 제어.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 873 ~ 891)
* **해당 설정 및 조정 방법**:
  * Q와 A의 배경 영역을 홀수/짝수 인덱스에 따라 은은하게 대조 보충(`isEven ? pal.brandLight : D.palette.white`)하여 도식적인 완성도를 올렸습니다. 렌더러 내 `qH` (질문 높이), `aH` (답변 높이)를 통해 높이를 정교하게 자동 관리합니다.

---

## [17] console-box (대화형 콘솔 프롬프트 예시)

### 숏코드설명
* **사용 키**: `title` (예시 라벨), `desc` (실제 프롬프트 내용)
* **주 사용처**: GPTs/시스템 프롬프트의 구체적인 소스 지침이나 프롬프트 질의문 나열.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 389 ~ 395)
* **해당 CSS 클래스 및 조정 방법**:
  * `.prompt-box`: 옅은 회색조의 섀도우 카드 보더 세팅.
  * `.prompt-label`: 상단 고정 라벨 헤더 크기 조율.
  * `.prompt-content`: Courier New 폰트 기반의 고정폭 대화 지침 렌더링.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 893 ~ 906)
* **해당 설정 및 조정 방법**:
  * `mono` 폰트 페이스(Consolas)를 사용하여 코딩 예제다운 느낌을 살렸습니다. 텍스트 박스 Y축 계산에 관여하는 Y축 누적 변수인 `cy += totalH + c.gap` 식을 수정하여 카드의 Y 마진을 제어합니다.

---

## [18] skill-list (스킬셋 / 역량 원형 아이콘 목록)

### 숏코드설명
* **사용 키**: `icon` (원형 이모지), `title` (명칭), `desc` (설명), `color`
* **주 사용처**: 학습 역량 마일스톤, 프로그래밍 스킬셋 등 역량 목록화.

### html 숏코드 디자인
* **파일 및 위치**: [build-guide.mjs](file:///c:/ai/creative-spark/templates/build-guide.mjs) (라인 283 ~ 290)
* **해당 CSS 클래스 및 조정 방법**:
  * `.skill-item`: 스킬 목록 둥글기 조율.
  * `.skill-icon`: 원형 이모지 뱃지 직경 및 배경색 조율 (`width: 50px; height: 50px; border-radius: 50%;`).

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 418 ~ 439 / `renderItem` 루프)
* **해당 설정 및 조정 방법**:
  * 동그란 도형 오프셋 크기 및 X축 정렬 수치를 조절하여 아이콘과 텍스트의 조화를 튜닝합니다.

---

## [19] git-flow-strip (특화 시각화: 깃 플로우 흐름도)

### 숏코드설명
* **사용 키**: `title` (브랜치명), `tag` (버전 배지), `meta` (파이프 구분 커밋 상세 목록), `color`
* **주 사용처**: GitHub 다차원 브랜치 커밋 로그 흐름, 빌드 릴리즈 마일스톤 연출.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 401 ~ 418)
* **해당 CSS 클래스 및 조정 방법**:
  * `.git-flow-container`: 몽환적인 다크 터미널 테두리선 세팅.
  * `.branch-row`: 좌우 2분할 가로 레이아웃 (`grid-template-columns: 160px 1fr;`).
  * `.branch-label`: 브랜치명 라벨 테두리 보더 튜닝.
  * `.commit`: 동그란 펄스(Pulse) 광원 애니메이션이 가미된 원형 커밋 노드.
  * `.commit-line`: 마우스 호버(Hover) 시 사르르 튀어나오는 다차원 커밋 팝오버 상세 목록 UI.
* **조정 포인트 예시**: 브랜치 이름 영역이 너무 넓어 그래프가 좁아 보인다면, `.branch-row` 의 `160px` 수치를 `120px`로 좁혀 그래프 면적을 더 확보합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 722 ~ 740)
* **해당 설정 및 조정 방법**:
  * 발표용 PPTX에서는 호버 팝오버가 불가능하므로, 스크립트가 브랜치 밑에 연계된 커밋 로그들을 세로 목록형 깃 플로우 뱃지 트리로 단단하게 정적 고정 표기합니다. Y오프셋 및 폰트 페이스를 변경하여 튜닝할 수 있습니다.

---

## [20] editor-box (특화 시각화: 가상 에디터 시뮬레이터)

### 숏코드설명
* **사용 키**: `title` (파일명), `tag` (언어 타입), `desc` (실제 소스코드)
* **주 사용처**: VS Code 에디터 화면 연출, 정교한 파일 소스 구조 제시.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 421 ~ 441)
* **해당 CSS 클래스 및 조정 방법**:
  * `.editor-sim`: 가상 에디터 검은 창 테두리 및 섀도우.
  * `.editor-titlebar`: 상단 좌측 3색 신호등 버튼 배색 및 활성화 파일 탭 UI 조율.
  * `.line-nums`: 좌측 행 번호(Line Number)의 자동 배열 폰트 크기 및 색상 세팅 (`font-size: 0.8rem; opacity: 0.3;`).
* **조정 포인트 예시**: 소스 코드의 기본 크기와 줄 높이를 촘촘하게 압축하려면, `.editor-body` 의 `line-height: 1.8;`를 `1.5`로 좁히고 `font-size`를 `0.85rem`으로 조금 더 축소합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 742 ~ 762)
* **해당 설정 및 조정 방법**:
  * 슬라이드 가로 크기 한계로 소스 코드가 행 번호와 겹치지 않게 조절하는 X오프셋 마진(`cx = x + 0.5`)을 통해 가시성을 제어합니다.

---

## [21] network-box (특화 시각화: Obsidian 지식 그래프)

### 숏코드설명
* **사용 키**: 첫 번째 아이템의 `title` / `color` (메인 코어 노드), 후속 아이템들의 `title` / `meta` / `color` (위성 노드들)
* **주 사용처**: Obsidian 지식 맵 3D 연출, 성단 구조의 은하수 기술 성단 연출.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 444 ~ 462)
* **해당 CSS 클래스 및 조정 방법**:
  * `.graph-visual`: 은하수 지식 맵 배경 그라데이션 및 그림자 조율.
  * `.node-main`: 중앙 메인 노드의 펄싱 광원 및 네온 이펙트 튜닝 (`box-shadow: 0 0 24px ${color}88;`).
  * `.node-1 ~ 4`: 메인 노드 주위를 몽환적으로 넘실넘실 유영하는 위성 노드들.
* **조정 포인트 예시**: 노드들이 우주를 유영하는 흔들림 진폭 크기를 더 역동적으로 넓히려면, `scripts/build-guide.mjs` 내의 CSS 흔들림 애니메이션 키프레임 `@keyframes driftOne` ~ `@keyframes driftFour` 내의 `translate(Xpx, Ypx)` 변위 반경 값을 직접 수정합니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (라인 764 ~ 794)
* **해당 설정 및 조정 방법**:
  * 정적 PPTX 화면에서는 원형 노드들의 X, Y 절대 좌표값들이 렌더러 함수 내에 사분면 기준 배치식(예: `x + w/2 - 0.5` 등)으로 정교하게 하드코딩되어 있습니다. 노드의 상대적 위치 반경을 좁히거나 벌리고자 할 때 렌더러 수치를 튜닝합니다.

---

## [22] part-deck (시리즈 대단원 부/Part 헤더)

### 숏코드설명
* **사용 키**: `icon` (부 번호), `title` (부 제목), `desc` (태그라인), `tag` (챕터 범위), `color`
* **주 사용처**: 대규모 시리즈 가이드나 다중 단락 챕터 입문서의 대단원 표지 연출.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 465 ~ 480)
* **해당 CSS 클래스 및 조정 방법**:
  * `.part`: 부 단락 사이의 마진 조율 (`margin-bottom: 30px;`).
  * `.part-header`: 부 타이틀 카드의 둥글기 및 보더 튜닝.
  * `.part-num-block`: 좌측의 부 번호 영역 지름 및 배경색 튜닝 (`width: 52px; height: 52px;`).
  * `.part-title-text`: 부 타이틀의 서리프체 폰트 세팅 (`font-family: 'Noto Serif KR', serif; font-weight: 600;`).
* **조정 포인트 예시**: 카드 전체 테마의 주입 컬러 헥스를 변경하고 싶다면 마크다운 내 `color: "#HEX"` 인자값을 변경하면 `--part-color` 인라인 변수가 실시간 반응형 동치 갱신됩니다.

### pptx 숏코드 디자인
* **파일 및 위치**: [md-to-pptx.mjs](file:///c:/ai/creative-spark/scripts/md-to-pptx.mjs) (또는 `build-presentation.mjs`)
* **해당 설정 및 조정 방법**:
  * PPT 횡형 슬라이더 및 PPTX 내에서 고유 레이아웃을 칼각으로 스티칭 렌더링하며, `globalRadius` 설정값에 둥글기가 연동 제어됩니다.

---

## [23] chapter-list (세부 단원 및 챕터 상세 목록)

### 숏코드설명
* **사용 키**: `icon` (챕터 번호), `title` (챕터 제목), `desc` (세부 설명), `tag` (구분 뱃지)
* **주 사용처**: 시리즈 부(Part) 하위에 속해 있는 상세 챕터 리스트업과 주제 구분 뱃지 전시.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 482 ~ 498)
* **해당 CSS 클래스 및 조정 방법**:
  * `.chapter-list`: 챕터 목록 영역 전체의 좌측 테두리 바 튜닝 (`border-left: 2px solid var(--border); padding-left: 15px;`).
  * `.chapter-num`: 챕터 번호 글꼴 및 너비 조율 (`min-width: 38px;`).
  * `.chapter-badge`: `badge-concept`, `badge-tool`, `badge-case`, `badge-guide`, `badge-practice`, `badge-warn` 등을 통해 HSL 뱃지 컬러 자동 변환 매핑.
* **조정 포인트 예시**: 챕터 카드 사이의 여백 및 마우스 오버 시 왼쪽에 뜨는 활성 지표선 스타일을 수정하려면 `.chapter-item` 및 `.chapter-item:hover` 클래스를 수정합니다.

### pptx 숏코드 디자인
* **해당 설정 및 조정 방법**:
  * 슬라이드 폭 한계를 정교하게 계산하여, 단일 줄높이 오프셋에 맞춰 챕터 번호와 뱃지가 오버랩되지 않게 적응형 가로폭으로 정적 연쇄 드로잉합니다.

---

## [24] summary-bar (하단 지표 요약 수치 그리드)

### 숏코드설명
* **사용 키**: `icon` (요약 수치 및 단위), `title` (수치 라벨)
* **주 사용처**: 챕터 분석 완료 후나 가이드 문서 맨 하단에 수치 하이라이트를 검정 가로 띠 형태로 임팩트 있게 요약 표기할 때 활용.

### html 숏코드 디자인
* **파일 및 위치**: [scripts/build-guide.mjs](file:///c:/ai/creative-spark/scripts/build-guide.mjs) (라인 500 ~ 513)
* **해당 CSS 클래스 및 조정 방법**:
  * `.summary-bar`: 어두운 HSL 다크 테마 배경에 모던한 그리드 정렬을 자동 컴파일 (`display: grid; repeat(auto-fit, minmax(140px, 1fr));`).
  * `.summary-num`: 숫자의 굵기 및 크기 튜닝 (`font-size: 28px; font-weight: 700;`).
  * `.summary-num .unit`: 수치에 함께 주입된 문자 단위(예: "장", "종")를 정규식 파서가 자동 인지하여 콤팩트하게 분리 렌더링 (`font-size: 12px; opacity: 0.6;`).
* **조정 포인트 예시**: 수치 요약 바의 다크 배경색을 테마 브랜드 컬러로 대체하고 싶다면, `.summary-bar` 내의 `background: var(--text);` 부분을 `background: var(--brand);` 또는 `var(--brand-dark);` 로 스왑 튜닝합니다.

### pptx 숏코드 디자인
* **해당 설정 및 조정 방법**:
  * 가로 전체 슬라이드 하단에 와이드 인디케이터 배너 형식으로 6대 표준 수치를 가로 등간격 슬롯 계산하여 정교하게 투사 배치합니다.
