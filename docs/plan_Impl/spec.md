# [상세 기술 사양서] 마크다운 숏코드 & 디자인 컴포넌트 스펙

본 명세서는 `md_src/` 마크다운 파일에 삽입되는 숏코드 및 테마 시스템의 렌더링 규격 정의서입니다. 이 사양에 맞춰 타 스택에서 파서 및 컴포넌트를 무결성 있게 재설계할 수 있습니다.

---

## 1. 계층 마커 기호 체계 (Typography Hierarchy)

본 문서 변환 엔진은 한글 정책 보고서 등의 정형화된 문서 규격을 지원하기 위해 고정 마커를 강제 주입하여 렌더링합니다.

| 계층 레벨 | 앞머리 기호 | CSS 클래스명 | 기본 들여쓰기 | 텍스트 스타일 및 색상 |
| :--- | :--- | :--- | :--- | :--- |
| **Doc Title** | (없음) | `.doc-title` | 없음 | 18–20pt, Bold, `var(--c-primary-dark)` |
| **Section** | 숫자 배지 | `.section-header` | 없음 | 13–14pt, Bold, `var(--c-text-on-primary)` (배경: `var(--c-primary)`) |
| **Level 1** | `■` (채운 사각형) | `.marker-h1` | 없음 | 12–13pt, Bold, `var(--c-primary-dark)` |
| **Level 2** | `○` (빈 원형) | `.marker-h2` | 10mm (`var(--indent-h2)`) | 11–12pt, Regular, `var(--c-text)` |
| **Level 3** | `–` (em dash) | `.marker-h3` | 20mm (`var(--indent-h3)`) | 10.5pt, Regular, `var(--c-text-muted)` |
| **Note** | `*` (별표) | `.marker-note` | 20mm | 9.5pt, Regular, `var(--c-text-muted)` |
| **Conclusion** | `è` (결론 기호) | `.conclusion-box` | 10mm | 11pt, Regular, `var(--c-primary-mid)` 테두리 & `var(--c-accent-bg)` 배경 |

---

## 2. 29종 숏코드 문법 및 HTML 렌더링 스펙

### A. 격자 카드 계열 (Grid Cards)

#### 1) `icon-grid`
* **설명**: 아이콘이 탑재된 카드 목록 격자 배치.
* **마크다운 규격**:
  ```markdown
  ::: icon-grid [cols=3]
  - icon: 🚀
    title: 빠른 시작
    desc: 5분 내 설정
    color: "#FF5733"
  :::
  ```
* **HTML/CSS 스펙**:
  * 컨테이너: `.feature-grid` (Grid 레이아웃, `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`)
  * 개별 카드: `.feature-card` (경계선 테두리, 그림자 효과)

#### 2) `compare-grid` / `plan-grid`
* **설명**: 요금제나 상반된 구성 요소를 양옆으로 대칭 배치하는 비교 카드.
* **HTML/CSS 스펙**:
  * `.compare-grid` 컨테이너 내에 각 카드를 가로 정렬하며, `featured: true` 인 카드는 강조 테두리 및 추가 배지를 부여합니다.

---

### B. 프로세스 및 흐름 계열 (Process & Flows)

#### 1) `workflow-flow`
* **설명**: 단계별 절차를 화살표 기호로 연결해 가로로 나열하는 뷰.
* **마크다운 규격**:
  ```markdown
  ::: workflow-flow
  - icon: 💾
    title: Push
  - icon: 🚀
    title: Deploy
  :::
  ```
* **HTML/CSS 스펙**:
  * 컨테이너: `.flow-steps` (Flex layout, wrap, 가로 중앙 정렬)
  * 아이템: `.flow-step` 및 사이 구분자 `.flow-arrow` (기본값 `→`)

#### 2) `git-flow`
* **설명**: 개발 브랜치 흐름과 커밋 구조를 터미널 그래픽 형식으로 렌더링.
* **마크다운 규격**:
  ```markdown
  ::: gitflow
  main: init, release
  dev: , feature-a
  :::
  ```
* **HTML/CSS 스펙**:
  * `.git-flow-container` 내에 각 브랜치 행 `.branch-row`를 Flex로 배치.
  * 커밋 포인트는 `.commit` 원형 도형 및 라인 `.commit-line`으로 구성.

---

### C. 정보 상자 계열 (Information Boxes)

#### 1) `info-box`
* **설명**: 팁이나 주의 정보를 표시하는 결합형 인용구 형태의 박스.
* **마크다운 규격**:
  ```markdown
  ::: info [variant:warn]
  경고 메시지 내용
  :::
  ```
* **HTML/CSS 스펙**:
  * 컨테이너: `.info-box` (왼쪽 3px 테두리 두께, 배경 HSL 믹싱 컬러 적용)

#### 2) `terminal`
* **설명**: 셸 콘솔 동작 상태를 에뮬레이팅하는 다크 테마 코드 박스.
* **HTML/CSS 스펙**:
  * 컨테이너: `.terminal` (상단 맥북 스타일 3색 닷 버튼 배치, `.terminal-header`, `.terminal-body`)
  * 구문 강조: 정규식 파서에 의해 코멘트, 명령어, 키워드를 구분하여 색상 인젝션.

---

## 3. HSL 테마 매니저 토큰 스펙

색상 가변성을 위해 CSS 변수와 HSL 색조 연동 규칙을 아래와 같이 명시합니다.

```css
:root {
  --c-primary:        #1D4E8F; /* 메인 테마색 */
  --c-primary-dark:   #1A3A6B; /* HSL Lightness -15% */
  --c-primary-mid:    #2557A7; /* HSL Lightness +10% */
  --c-accent-bg:      #E8F0FB; /* Primary의 10% opacity 믹스 */
  --c-table-alt:      #F5F8FF; /* Primary의 5% opacity 믹스 */
  --c-border:         #D0D8E8; /* Primary의 20% opacity 믹스 */
  --c-text:           #1A1A1A;
  --c-text-muted:     #555555;
  --c-text-on-primary:#FFFFFF;
  --c-background:     #FFFFFF;
  --c-page-bg:        #F8F9FA;
}
```

### 💡 Auto Resolution (자동 색상 조화 공식)
Primary Hex 값을 RGB로 환원한 뒤, 백그라운드 흰색(#FFFFFF)과 선형 혼합하여 산출합니다:
$$\text{Color}_{\text{mix}} = \text{Primary} \times \text{opacity} + \text{White} \times (1 - \text{opacity})$$
* **accent_bg**: opacity = 0.10
* **table_alt**: opacity = 0.05
* **border**: opacity = 0.20
