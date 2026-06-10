# ⚡ Creative Spark Quick Guide (퀵가이드)

이 문서는 프로젝트 내 주요 빌더 스크립트 및 통합 빌드 명령, 그리고 **HTML 가이드 및 PPTX 전용 디자인/스타일/폰트 제어 방법**을 빠르게 찾을 수 있도록 돕는 요약 가이드입니다.

---

## 1. 디자인 및 폰트/크기 설정 제어 (핵심 💡)

HTML 렌더링용 설정과 PowerPoint(PPTX) 생성용 설정이 **서로 간섭하지 않도록 물리적으로 완벽히 분리**되어 있습니다.

### ① HTML 디자인 제어 (`htmldesign.config.json`)
* HTML 가이드 및 프레젠테이션 전용 웹폰트 및 배율 설정입니다.
* 파일 경로: [config/htmldesign.config.json](file:///C:/ai/creative-spark/config/htmldesign.config.json)
```json
{
  "htmlFont": {
    "title":      "'Noto Serif KR', serif",
    "desc":       "'Noto Sans KR', sans-serif",
    "note":       "'JetBrains Mono', monospace",
    "code":       "'JetBrains Mono', monospace",
    "tag":        "'Noto Sans KR', sans-serif",
    "scale":      1.0
  }
}
```
* **전역 폰트 일괄 크기 조정**: `scale` 값을 변경하면(예: `1.0` ➡️ `1.2`) 전체 폰트 크기가 비례하여 커집니다.

### ② PPTX 디자인 제어 (`pptdesign.config.json`)
* PowerPoint 변환 전용 물리 좌표 및 폰트 설정입니다.
* 파일 경로: [config/pptdesign.config.json](file:///C:/ai/creative-spark/config/pptdesign.config.json)

---

## 2. 특정 숏코드/컴포넌트 글자 크기 조정 방법

숏코드 컴포넌트(예: 카드, Stat, Workflow 등)의 글자 크기를 수정하는 방법은 **기본값 변경(전역)**과 **마크다운 개별 문서 내 오버라이드(로컬)** 두 가지가 있습니다.

### 방법 A. 전역 기본 크기 변경 (빌더 스크립트 수정)
빌더 내부의 `:root` 스타일 영역에 명시된 CSS 변수를 직접 수정합니다.
* **프레젠테이션**: [build-presentation.mjs](file:///C:/ai/creative-spark/scripts/build-presentation.mjs) 내 `style` 태그 `:root` 정의
* **세로 가이드북**: [build-guide.mjs](file:///C:/ai/creative-spark/scripts/build-guide.mjs) 내 `style` 태그 `:root` 정의

* **기본 제공되는 대표 CSS 크기 변수:**
  * `--size-h1`: 메인 타이틀 크기
  * `--size-h2`: 섹션 타이틀 크기
  * `--size-body-p`: 일반 본문 문단 크기
  * `--size-card-title`: 카드형 숏코드 내 제목 크기
  * `--size-card-p`: 카드형 숏코드 내 본문 크기
  * `--size-stat-val`: Stat 숏코드 내 큰 숫자 크기 (예: `2.6rem`)
  * `--size-stat-name`: Stat 숏코드 내 지표명 크기
  * `--size-workflow-name`: Workflow 단계명 크기

### 방법 B. 마크다운 문서 내에서 개별 변경 (권장 💡)
소스코드 자체를 건드리지 않고, 특정 마크다운 파일의 숏코드 스타일만 개별적으로 커스텀하려면 **마크다운 문서 상단 또는 하단에 `<style>` 태그를 추가**하여 덮어씁니다.

```markdown
---
title: AI 빌드 가이드
---

<!-- 💡 이 문서 내의 특정 숏코드 글자 크기만 개별적으로 대폭 키우고 싶을 때 -->
<style>
  :root {
    --size-stat-val: 3.5rem;    /* Stat 숫자를 3.5rem으로 크게 지정 */
    --size-card-title: 1.6rem;  /* 카드 제목을 1.6rem으로 크게 지정 */
  }
  
  /* 특정 클래스나 요소의 폰트 패밀리/색상만 강제하고 싶을 때 */
  .stat-card .stat-val {
    color: #3b82f6; /* 밝은 파란색으로 변경 */
    font-weight: 900;
  }
</style>

# 메인 섹션
...
```

---

## 3. 개행 및 줄바꿈 (`\n`) 처리 팁

마크다운 빌드 시 숏코드 내부에 작성한 개행이 HTML로 출력될 때 한 줄로 뭉개지지 않도록 다음과 같이 작성해야 합니다.

1. **마크다운 숏코드 속성 내 개행**:
   * 빌더 내부에서 `\n` 또는 `/n` 기호는 자동으로 실제 줄바꿈(`<br>` 또는 개행 문자)으로 치환됩니다.
   * 예: `desc: "첫 번째 줄\n두 번째 줄"` 또는 `desc: "첫 번째 줄/n두 번째 줄"`
2. **리터럴 블록(`|`) 활용**:
   * 여러 줄을 들여쓰기로 깔끔하게 적고 싶을 때는 마크다운 속성에 `|` 문자를 지정한 후, 아래에 4칸 들여쓰기로 본문을 작성합니다.
   * 예시:
     ```markdown
     ::: card
     - title: 서비스 소개
       desc: |
         여기에 긴 설명을 적을 수 있습니다.
         줄바꿈을 자유롭게 하더라도
         그대로 반영됩니다.
     :::
     ```
3. **일반 본문 내 강제 줄바꿈**:
   * 일반 텍스트 문단 내에서 행을 바꾸고 싶다면 HTML 태그인 `<br>`을 사용하시는 것이 가장 확실합니다.
     * 예: `여기에 첫 줄 내용을 씁니다.<br>여기에 다음 줄 내용을 씁니다.`

---

## 4. 통합 빌드 명령어 (`npm run ...`)

프로젝트 루트 경로에서 `package.json`에 정의된 NPM 스크립트를 통해 전체 빌드 파이프라인을 실행합니다.

* **전체 빌드 및 standalone 패키징**:
  ```powershell
  npm run build
  ```
  * `build-publish.mjs` 실행(전체 마크다운 변환) ➡️ Vite 빌드 ➡️ 단일 파일 `standalone.html` 생성까지 논스톱으로 수행합니다.

* **마크다운 ➡️ HTML 일괄 퍼블리싱**:
  ```powershell
  npm run build:publish
  ```
  * `md_src/` 하위의 모든 마크다운(가이드, 리포트, 테스트 파일 등)을 각각 대응하는 `public/` 디렉터리에 HTML로 컴파일합니다.

* **로컬 개발 서버 실행**:
  ```powershell
  npm run dev
  ```
  * 실시간으로 빌드 결과를 웹 브라우저에서 모니터링하기 위해 Vite 개발 서버를 구동합니다.

---

## 5. 빌더 개별 실행 명령어 (Usage)

### ① 세로형 가이드 HTML 빌더 (`build-guide.mjs`)
* **단일 파일 변환 (자동 출력 경로 지정)**:
  ```powershell
  node scripts/build-guide.mjs md_src/test/when-ai-builds-itself.md
  ```
  * `public/test/when-ai-builds-itself.html`로 자동 변환 및 저장됩니다.
* **출력 경로 및 스타일 강제 지정**:
  ```powershell
  node scripts/build-guide.mjs md_src/test/when-ai-builds-itself.md --out public/output.html --style neon-creative
  ```
  * `--style`: `styles.json`에 정의된 색상 테마 프리셋(`ai-chat`, `neon-creative`, `warm-minimal` 등)을 강제 지정합니다.

### ② 횡형 프레젠테이션 HTML 빌더 (`build-presentation.mjs`)
* **기본 실행 방법**:
  ```powershell
  node scripts/build-presentation.mjs md_src/test/when-ai-builds-itself.md public/presentation/when-ai-builds-itself.html
  ```
* **다중 마크다운 파일을 하나의 슬라이드 데크로 병합**:
  ```powershell
  node scripts/build-presentation.mjs md_src/vibecoding/*.md --out public/presentation/vibe-presentation.html
  ```

### ③ 파워포인트 PPTX 빌더 (`md-to-pptx.mjs`)
* **기본 실행 방법**:
  ```powershell
  node scripts/md-to-pptx.mjs md_src/test/when-ai-builds-itself.md --out public/test/when-ai-builds-itself.pptx
  ```
