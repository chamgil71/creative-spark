# test/ HTML 분석 — 기존 shortcode 매핑 & 신규 shortcode 설계

> 분석 대상: `public/guides/test/` 폴더 19개 HTML 파일  
> 작성일: 2026-05-13

---

## 요약

| 구분 | 수량 |
|------|------|
| 기존 shortcode로 치환 가능 | 약 80% |
| 신규 shortcode 필요 | 약 20% (6종 우선순위 높음) |

---

## 1. 기존 shortcode 치환 가능 목록

아래 HTML 패턴은 데이터 손실 없이 기존 9종 shortcode로 대체 가능.

| HTML 클래스 패턴 | 사용 파일 | 대응 shortcode | 키 매핑 |
|----------------|---------|--------------|--------|
| `.model-card`, `.model-grid` | Claude, Gemini | `feature-grid` | icon, title, desc, featured |
| `.skill-grid`, `.skill-item` | Claude | `icon-grid` | icon, title, desc |
| `.project-card` | Claude | `tool-card` | icon, title, desc, meta |
| `.integration-grid` | Claude | `feature-grid` | icon, title, desc, meta |
| `.gem-feature-grid` | Gemini | `feature-grid` | icon, title, desc |
| `.tier-badges` | Gemini | `plan-grid` | title, meta, color |
| `.workspace-grid` | Gemini | `feature-grid` | icon, title, desc |
| `.feat-grid`, `.feat-item` | Grabit, Grok, Manus, Snipaste, 디자인및시각화 | `feature-grid` | icon, title, desc |
| `.flow-container`, `.branch-row` | github | `workflow` | icon, title, meta, color |
| `.actions-flow`, `.action-step` | github | `workflow` | icon, title, meta |
| `.compare-table` | github, Genspark, 디자인및시각화, 영상음악AI, 이미지생성ai | `compare-grid` | title, meta |
| `.ba-box` (before/after) | Grabit | `compare-2col` | title, meta, note |
| `.plan-grid`, `.plan-card.featured` | Grok, Perplexity | `plan-grid` | title, tag, meta, featured, color |
| `.agent-flow`, `.af-step` | Manus | `workflow` | icon, title, meta |
| `.vs-box`, `.vs-table` | Manus, Perplexity | `compare-2col` | title, meta, note |
| `.use-case-grid`, `.uc-card` | Manus, NotebookLM, NotebookLM Importer | `icon-grid` | icon, title, desc |
| `.source-grid`, `.source-card` | NotebookLM | `icon-grid` | icon, title, desc |
| `.block-grid`, `.block-card` | notion | `icon-grid` | icon, title, desc |
| `.view-grid`, `.view-card` | notion | `icon-grid` | icon, title, desc |
| `.step-card`, `.step-header` | ClaudeCode, obsidian | `steps` | title, desc, meta |
| `.concept-grid`, `.concept-card` | obsidian | `icon-grid` | icon, title, desc |
| `.plugin-grid`, `.plugin-card` | obsidian | `icon-grid` | icon, title, desc, tag |
| `.prereq-grid`, `.prereq-card` | ClaudeCode | `feature-grid` | title, desc, tag, meta |
| `.toc-grid`, `.toc-card` | ClaudeCode | `feature-grid` | icon, title, desc |
| `.faq-grid`, `.faq-card` | ClaudeCode | `tool-card` | title, desc |
| `.ext-grid`, `.ext-card` | Vscode | `icon-grid` | icon, title, desc, tag |
| `.tool-card`, `.tc-header` | 디자인및시각화, 영상음악AI, 이미지생성ai | `tool-card` | icon, title, desc, tag, meta |
| `.wf-step` | 디자인및시각화 | `workflow` | icon, title, meta |
| `.service-block` | 이미지생성ai | `tool-card` | icon, title, desc, meta |
| `.flow-demo`, `.flow-step` | NotebookLM Importer, 디자인및시각화 | `workflow` | icon, title, meta |
| `.step-list`, `.step-item` | Grabit, NotebookLM, Snipaste, 이미지생성ai | `steps` | title, desc |
| `.tip-item`, `.tip-box` | Antigravity, obsidian, Manus, Snipaste | `tool-card` | icon, title, desc |
| `.shortcut-table`, `.shortcut-row` | github, notion, obsidian, Snipaste | `compare-grid` | title, meta |
| `.sparkpage-demo` | Genspark | `tool-card` | title, meta, note |

---

## 2. 신규 shortcode 필요 목록

### 우선순위 높음 (실제 콘텐츠 표현에 필수)

---

#### 2-1. `alert-box` — 알림/팁 박스

**사용 파일:** ClaudeCode, obsidian, Manus, Snipaste  
**기존 shortcode로 안 되는 이유:** `tool-card`는 배경 테마 변경 불가, type별(tip/warn/success/danger) 색상 분기 없음

**HTML 구조:**
```html
<div class="info-box info-tip">
  <div class="box-icon">💡</div>
  <div class="box-text">
    <strong>팁 제목</strong>
    <p>내용 텍스트</p>
  </div>
</div>
```

**제안 shortcode 문법:**
```md
::: alert-box
- type: tip        # tip | warn | success | danger
  icon: 💡
  title: 팁 제목
  desc: 내용 텍스트
:::
```

**필요한 키:** `type`(필수), `icon`, `title`, `desc`

---

#### 2-2. `tabs` — 탭 전환 UI

**사용 파일:** ClaudeCode (OS별 설치 안내), notion (DB 뷰 전환)  
**기존 shortcode로 안 되는 이유:** 클릭으로 콘텐츠를 전환하는 인터랙티브 요소. 기존 shortcode는 모두 정적.

**HTML 구조:**
```html
<div class="os-tabs">
  <button class="os-tab active" onclick="switchOS('mac', this)">macOS</button>
  <button class="os-tab" onclick="switchOS('win', this)">Windows</button>
  <button class="os-tab" onclick="switchOS('linux', this)">Linux</button>
</div>
<div class="os-content active" id="os-mac">macOS 설치 명령어...</div>
<div class="os-content" id="os-win">Windows 설치 명령어...</div>
```

**제안 shortcode 문법:**
```md
::: tabs
- id: mac
  label: "🍎 macOS"
  desc: |
    npm install -g @anthropic-ai/claude-code
- id: win
  label: "🪟 Windows"
  desc: |
    WSL 설치 후 동일 명령어 실행
:::
```

**필요한 키:** `id`, `label`, `desc`(탭 내용)  
**구현 참고:** HTML/JS 인라인으로 처리 (외부 의존 없음)

---

#### 2-3. `faq-accordion` — 아코디언 FAQ

**사용 파일:** ClaudeCode (trouble-list), obsidian  
**기존 shortcode로 안 되는 이유:** 클릭 펼침/접힘 인터랙션. 기존 `tool-card`는 항상 펼쳐진 상태.

**HTML 구조:**
```html
<div class="trouble-item">
  <button class="trouble-q">
    <div class="q-icon">!</div>
    <div class="q-text">오류: command not found</div>
    <div class="q-arrow">▼</div>
  </button>
  <div class="trouble-a">
    <p>PATH 환경변수에 Node.js 경로를 추가하세요.</p>
  </div>
</div>
```

**제안 shortcode 문법:**
```md
::: faq-accordion
- title: 오류: command not found
  desc: PATH 환경변수에 Node.js 경로를 추가하세요.
- title: API 키가 인식되지 않을 때
  desc: .env 파일 위치와 ANTHROPIC_API_KEY 변수명을 확인하세요.
:::
```

**필요한 키:** `title`(질문), `desc`(답변), `icon`(선택)

---

#### 2-4. `command-block` — 터미널 명령어 블록

**사용 파일:** ClaudeCode, github  
**기존 shortcode로 안 되는 이유:** 기존 ` ```code``` `는 복사 버튼 없음. OS별 프롬프트(`$`, `>`) 표시 불가.

**HTML 구조:**
```html
<div class="cmd-block">
  <div class="cmd-label">Terminal</div>
  <code><span class="dollar">$</span> npm install -g @anthropic-ai/claude-code</code>
  <button class="copy-btn" onclick="copyCode(this)">복사</button>
</div>
```

**제안 shortcode 문법:**
```md
::: command-block
- label: Terminal
  meta: bash
  desc: npm install -g @anthropic-ai/claude-code
:::
```

**필요한 키:** `desc`(명령어), `label`(선택, 창 제목), `meta`(선택, 언어/OS)  
**구현 참고:** 복사 버튼은 인라인 JS (`navigator.clipboard.writeText`)

---

#### 2-5. `prompt-example` — AI 프롬프트 예시 블록

**사용 파일:** 디자인및시각화, 영상음악AI, 이미지생성ai  
**기존 shortcode로 안 되는 이유:** 프롬프트 내 `태그: 값` 구조를 구분색으로 표시하는 전용 레이아웃 필요.

**HTML 구조:**
```html
<div class="prompt-box">
  <div class="prompt-label">Gamma AI 프롬프트 예시</div>
  <div class="prompt-content">
    <span class="tag">주제:</span> <span class="val">2025 AI 트렌드 보고서</span><br>
    <span class="tag">대상:</span> <span class="val">비개발자 임원진</span><br>
    <span class="style">전문적이고 간결하게</span>
  </div>
</div>
```

**제안 shortcode 문법:**
```md
::: prompt-example
- title: Gamma AI 프롬프트 예시
  desc: |
    주제: 2025 AI 트렌드 보고서
    대상: 비개발자 임원진
    스타일: 전문적이고 간결하게
:::
```

**필요한 키:** `title`(레이블), `desc`(프롬프트 내용 멀티라인)

---

#### 2-6. `stat-highlight` — 수치 강조 카드

**사용 파일:** Antigravity, ClaudeCode, obsidian  
**기존 shortcode로 안 되는 이유:** 큰 숫자(수치)와 설명을 강조하는 레이아웃. `icon-grid`는 이모지 중심, 수치 폰트 크기 조절 불가.

**HTML 구조:**
```html
<div class="stat-box">
  <div class="stat-value">200K</div>
  <div class="stat-label">컨텍스트 토큰</div>
  <div class="stat-sub">업계 최장 메모리</div>
</div>
```

**제안 shortcode 문법:**
```md
::: stat-highlight
- icon: 200K
  title: 컨텍스트 토큰
  desc: 업계 최장 메모리
  color: "#10A37F"
- icon: 3종
  title: 모델 라인업
  desc: Haiku · Sonnet · Opus
:::
```

**필요한 키:** `icon`(수치/이모지), `title`, `desc`, `color`(선택)  
**비고:** 기존 `icon-grid`와 유사하지만 숫자 값을 크게 표시하는 전용 스타일 필요

---

### 우선순위 낮음 (구현 복잡도 대비 사용 빈도 낮음)

| 패턴 | 사용 파일 | 제안 shortcode | 비고 |
|------|---------|--------------|------|
| 노드 그래프 시각화 | obsidian | `graph-view` | SVG 구현 복잡, 낮은 재사용성 |
| 키보드 단축키 표시 | obsidian, ClaudeCode, github | `keyboard-key` | `<kbd>` 태그로 CSS만으로 처리 가능 |
| 스크롤 프로그레스바 | ClaudeCode | `progress-bar` | 페이지 고정 JS 요소 |
| 인라인 애니메이션 | 다수 | `animated-element` | CSS만으로 처리 가능 |
| 미디어/스크린샷 갤러리 | Snipaste | `media-grid` | 이미지 경로 관리 문제 |

---

## 3. 구현 우선순위 결정 기준

| shortcode | 재사용 빈도 | 구현 난이도 | 우선순위 |
|-----------|-----------|-----------|--------|
| `alert-box` | 높음 (7개 파일) | 낮음 | ⭐⭐⭐ 즉시 |
| `command-block` | 중간 (3개 파일) | 낮음 | ⭐⭐⭐ 즉시 |
| `tabs` | 중간 (2개 파일) | 중간 (JS 필요) | ⭐⭐ 다음 |
| `faq-accordion` | 중간 (2개 파일) | 중간 (JS 필요) | ⭐⭐ 다음 |
| `prompt-example` | 중간 (3개 파일) | 낮음 | ⭐⭐ 다음 |
| `stat-highlight` | 중간 (3개 파일) | 낮음 | ⭐⭐ 다음 |
| `graph-view` | 낮음 (1개 파일) | 높음 | ⭐ 보류 |

---

## 4. 다음 작업

1. **즉시**: `alert-box`, `command-block` shortcode 구현 (build-guide.mjs + md-to-pptx.mjs)
2. **다음**: `tabs`, `faq-accordion` — JS 인라인 포함 구현
3. **다음**: `prompt-example`, `stat-highlight` — CSS 스타일 추가
4. **확인 필요**: `html-to-md.mjs` 역변환 지원 범위 결정 (신규 shortcode 역변환 가능 여부)
