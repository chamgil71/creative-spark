요구사항의 본질을 완벽히 충족하는, 소프트웨어 공학 표준에 맞춘 [PPT 디자인 토큰화 및 렌더링 시스템(PaC) 전체 구현 계획서]를 제출합니다.

기존에 작성하신 훌륭한 렌더링 엔진(`md-to-pptx.mjs` 및 `pptdesign.config.json`)을 **버리지 않고 프로젝트의 핵심 코어(렌더러)로 100% 활용**하며, 이를 구동하기 위한 앞단(추출 및 가공)의 구조를 명확히 정의했습니다.

---

# 🏗️ [Master Plan] PPT-as-Code (PaC) 아키텍처 및 구현 명세서

## 1. 시스템 아키텍처 개요 (System Overview)

본 시스템은 Python(추출 및 제어)과 Node.js(렌더링)의 이종(Hybrid) 파이프라인으로 구성됩니다. 기존의 엉켜있는 PPTX 파일을 순수 데이터(JSON)로 해체하고, 이를 논리적으로 병합한 뒤, 제공해주신 `mjs` 엔진을 통해 깨끗한 PPTX로 '재건축(Rebuild)'합니다.

**[데이터 파이프라인 (Data Flow)]**

1. `Source.pptx` ➔ **(Python 추출기)** ➔ `디자인.json` + `콘텐츠.json`
2. `디자인A.json` + `디자인B.json` ➔ **(Python 제어기)** ➔ `최종_디자인.json` (Diff & Merge)
3. `최종_디자인.json` + `콘텐츠.json` ➔ **(Node.js 렌더러 - 기존 코드 확장)** ➔ `Target.pptx`

---

## 2. 1단계: 역추출기 (Extractor) 구현 계획

파이썬(`python-pptx`)을 사용하여 기존 PPTX에서 데이터를 뽑아내되, 그 결과물을 **정확히 `pptdesign.config.json` 구조와 `mjs`의 AST(추상 구문 트리) 구조에 맞게 매핑**하여 저장합니다.

### 2.1 디자인 토큰 추출 (`pptdesign.config.json` 역산)

기준이 될 PPTX의 슬라이드 마스터와 첫 번째 슬라이드들을 스캔하여 스타일을 뽑아냅니다.

| 추출할 PPTX 대상 (Python 객체) | 매핑될 JSON 키 (제공된 config 기준) | 추출 및 변환 로직 (How) |
| --- | --- | --- |
| `slide_master.theme.theme_colors` | `palette.brand`, `palette.text` 등 | 테마의 Accent1, Dark1 색상의 RGB 바이너리를 HEX 문자열(`6366F1` 등)로 변환하여 매핑. |
| `slide_master.text_styles.title_style` | `slide.font`, `card.titleSize` | 마스터 제목의 `font.name`과 `font.size.pt`를 읽어 할당. |
| `slide_master.text_styles.body_style` | `card.bodySize`, `slide.fontMono` | 본문 텍스트의 폰트 크기 및 이름 할당. |
| 본문 내 라운드 직사각형 도형 | `card.radius`, `palette.border` | `MSO_SHAPE.ROUNDED_RECTANGLE` 도형 탐색 후 `adjustments[0]` 값 및 테두리 색상 추출. |
| 슬라이드 물리 규격 | `slide.widthIn`, `slide.heightIn` | `prs.slide_width / 914400` (EMU를 인치로 변환하여 기록). |

### 2.2 콘텐츠 추출 및 구조화 (AST 변환)

가장 난이도가 높은 부분입니다. 흩뿌려진 PPTX 개체들을 제공해주신 `mjs`의 `sections > items > blocks` 계층 구조로 강제 추상화합니다.

* **텍스트/도형 변환 (Heuristic Grouping):**
* Y좌표와 X좌표를 기준으로 개체들을 정렬합니다.
* 일반 텍스트 상자 ➔ `{"type": "p", "text": "..."}`
* 표(Table) ➔ `{"type": "table", "headers": [...], "rows": [...]}`
* 글머리 기호 텍스트 ➔ `{"type": "ul", "items": [...]}`


* **복합 레이아웃 추론:** 가로로 나란히 배치된 도형 그룹을 발견하면, 좌표를 계산하여 `{"type": "icon-grid", "items": [...]}` 또는 `columns` 형태로 자동 추론하여 JSON 배열을 생성합니다.

---

## 3. 2단계: 비교 및 제어기 (Controller) 구현 계획

추출된 JSON들을 비교하고 룰셋에 따라 수정합니다. 이 작업은 파이썬이 수행합니다.

### 3.1 JSON 간 비교 (Diffing)

* **대상:** `style_A.json` vs `style_B.json`
* **구현:** 파이썬 `deepdiff` 라이브러리를 활용하여 두 JSON 간의 폰트(`slide.font`), 팔레트(`palette`) 차이를 콘솔에 출력하거나 `diff.md`로 옵시디언에 내보냅니다.

### 3.2 수치 보정 및 병합 (Merging)

* **중앙 정렬 알고리즘 생략:** 기존에 제가 제안했던 '4:3을 16:9의 중앙으로 좌표 이동' 로직은 **폐기**합니다. 왜냐하면, 기존 `mjs` 렌더러가 이미 좌표 기반이 아닌 **상대 위치 기반(Y좌표 누적합)으로 그리드를 자동 렌더링**하도록 훌륭하게 짜여 있기 때문입니다.
* **스타일 오버라이드:** 명령행 인자(`--use-style A`)에 따라, 콘텐츠는 B에서 가져오되 `pptdesign.config.json`의 전체 설정값은 A의 것을 사용하도록 최종 `final_manifest.json`을 단일 조립합니다.

---

## 4. 3단계: 렌더링 엔진 (Generator) 적용 및 확장 계획

제공해주신 `md-to-pptx.mjs` 코드를 수정하여 파이썬이 던져준 `final_manifest.json`을 소화할 수 있게 만듭니다.

### 4.1 기존 코드의 유지

* `renderCard`, `renderGrid`, `renderTable` 등 `addShape`와 `addText`를 통해 디자인을 정교하게 그리는 모든 렌더링 로직은 **100% 그대로 유지**합니다.

### 4.2 기존 코드의 확장 (Data Input 방식 변경)

현재 코드는 마크다운(`raw`)을 읽어 AST를 만드는 `buildSlideData()` 함수에 종속되어 있습니다. 이를 JSON 직접 주입 모드로 확장합니다.

**[코드 수정 포인트]**

```javascript
// 기존 로직: MD를 읽어서 sections을 만듦
// const { fm, sections, styleKey, style } = buildSlideData(mdPath, styleOverride);

// 추가/수정 로직: Python이 만든 JSON을 바로 읽는 분기 추가
let fm, sections, pal;
if (opts.isJsonMode) {
  const jsonData = JSON.parse(readFileSync(opts.jsonPath, "utf8"));
  fm = jsonData.fm;
  sections = jsonData.sections; // Python이 구조화한 AST 배열
  pal = jsonData.palette;       // Python이 추출/병합한 커스텀 팔레트
} else {
  // 기존 MD 파싱 로직 수행...
}

```

* 이렇게 수정하면, 마크다운 없이도 파이썬이 추출해 낸 `sections` 데이터가 기존 렌더링 함수(`renderSectionSlide`)를 타면서 **기존 PPTX가 완전히 새로운 디자인 토큰을 입은 채 재탄생**하게 됩니다.

### 4.3 포스트 프로세싱 (정적 복제 처리)

* 제공된 `mjs` 코드는 차트(Chart)나 스마트아트 등 파워포인트 네이티브 복합 객체를 생성할 수 없습니다.
* **구현:** 파이썬 추출기에서 차트의 XML 노드를 일시 저장해 둡니다. Node.js가 렌더링을 마쳐 `dist.pptx`를 생성하면, 파이썬이 다시 그 파일을 열어 해당 슬라이드 위치에 **차트 XML만 정적으로 덮어쓰기(Inject)** 하는 후처리(Post-processing)를 수행합니다.

---

## 5. 정확한 기술적 제약사항 (Limitations)

이 아키텍처에서 반드시 감수해야 하는 근본적인 한계입니다.

1. **비정형 레이아웃의 유실 (Loss of Free-form Layout):**
원본 PPTX가 `mjs` 코드에 정의된 그리드(`feature-grid`, `plan-grid` 등) 규칙을 벗어나 "마음대로" 배치되어 있는 경우, 파이썬이 이를 정확한 그리드 컴포넌트로 역추론하지 못합니다. 모든 텍스트가 일렬로 나열되는 `type: "p"` 형태로 하향 평준화될 수 있습니다.
2. **그룹 도형 해체 불가:**
복잡하게 묶인 그룹 개체의 경우, 내부의 텍스트와 색상을 완벽히 분리해 내지 못할 수 있습니다.
3. **차트/표의 디자인 테마 미적용:**
정적 복제(XML Inject)로 가져온 차트는, `mjs` 엔진이 새로 그린 아름다운 둥근 모서리나 팔레트 색상을 적용받지 못하고 원본의 색상을 그대로 유지하게 됩니다.

---

## 6. 결론 및 진행 제안

사용자님께서 작성하신 `mjs` 코드는 "데이터를 아름다운 PPT로 렌더링"하는 완벽한 엔진입니다. 제가 제안하는 본 계획은 이 엔진을 100% 신뢰하고, "어떻게 기존 PPTX를 해체하여 이 엔진이 이해할 수 있는 JSON 밥(Feed)으로 만들어 줄 것인가"에 모든 파이썬 엔지니어링을 집중하는 구조입니다.



제가 완전히 헛짚었습니다. JS 코드를 올려주셨길래 기존 렌더러를 무조건 살려야 하는 줄 알고 억지로 이중 구조를 만들었습니다. 파이썬이 PPT 다루기에 유리하다고 해놓고 JS를 끼워 넣었으니 짜증 나시는 게 당연합니다.

깔끔하게 쳐내고, 올려주신 JS 코드의 **'훌륭한 설계 사상(디자인 토큰, 그리드 렌더링, 좌표 계산 로직)'만 파이썬으로 완벽히 이식**하여 **100% 순수 파이썬(Pure Python) 프로젝트**로 재설계한 구체적인 구현 계획서를 제출합니다.

---

# 🐍 PPT-as-Code (PaC) 순수 파이썬 아키텍처 구현 계획서

## 1. 프로젝트 개요 및 폴더 구조

Node.js 의존성을 완전히 제거하고, `python-pptx` 단일 라이브러리로 추출, 가공, 렌더링을 모두 통제하는 파이프라인입니다.

```text
ppt_pac_project/
├── 📂 data/
│   ├── source.pptx           # 분석할 원본 PPT
│   └── output.pptx           # 최종 생성된 PPT
├── 📂 schema/
│   ├── design_token.json     # (JS의 pptdesign.config.json 역할)
│   └── content_ast.json      # 슬라이드별 본문 및 구조 데이터
├── 📂 core/
│   ├── extractor.py          # PPTX -> JSON 추출기
│   ├── renderer.py           # JSON -> PPTX 렌더러 (JS의 renderCard 등 이식)
│   └── layout_calc.py        # 텍스트 줄바꿈/높이 추정 알고리즘 (JS의 blockH 이식)
└── main.py                   # CLI 엔트리포인트 (argparse)

```

---

## 2. 1단계: 추출기 (`extractor.py`) 구현 상세

기존 PPTX를 분석하여 올려주신 JS 코드의 `pptdesign.config.json` 구조를 역으로 만들어내는 과정입니다.

**[추출 및 매핑 로직]**

* **슬라이드 물리 설정 (`slide`):**
* `prs.slide_width`와 `prs.slide_height`를 읽어 EMU 단위를 인치(Inches)로 변환하여 JSON에 저장.


* **고정 색상 팔레트 (`palette`):**
* 슬라이드 마스터의 XML(`p:clrMap`)을 파싱하여 배경색(`bgDark`), 주요 텍스트색(`text`) 등의 RGB 값을 HEX 문자열로 치환하여 저장.


* **카드 및 그리드 규격 (`card`, `grid`):**
* 본문 중 가장 많이 쓰인 라운드 사각형(`MSO_SHAPE.ROUNDED_RECTANGLE`)을 찾아 `adjustments[0]`(모서리 둥글기)를 인치로 환산하여 `card.radius`로 저장.


* **본문 데이터 구조화 (`content_ast.json`):**
* 개체를 Y좌표 기준으로 정렬.
* 텍스트 상자면 `{"type": "p", "text": "..."}`, 표면 `{"type": "table", "rows": [...]}` 형식으로 변환. (올려주신 JS의 `tokenToBlock` 결과물과 동일한 형태 생성)



---

## 3. 2단계: 레이아웃 계산기 (`layout_calc.py`) 이식

올려주신 JS 코드에서 가장 핵심적인 "텍스트 길이에 따른 높이 추정 로직(`estimateLines`, `blockH`, `cardH`)"을 파이썬으로 포팅합니다. `python-pptx`는 내용이 길어지면 도형이 자동으로 늘어나지 않으므로 이 계산 로직이 생명입니다.

**[파이썬 포팅 예시]**

```python
import math

def estimate_lines(text, width_inch, font_size):
    """JS의 estimateLines 함수 완벽 이식"""
    text_len = len(text) if text else 0
    chars_per_line = max(8, math.floor(width_inch * 68 / (font_size * 0.55)))
    return max(1, math.ceil(text_len / chars_per_line))

def block_h(block, w_inch, config):
    """JS의 blockH 함수 이식: 타입에 따른 Y축 높이(인치) 계산"""
    c = config['card']
    if block['type'] == 'p':
        lines = estimate_lines(block['text'], w_inch - c['padX']*2, c['bodySize'])
        return (c['bodySize'] / 72) * 1.7 * lines + c['gap']
    # ... h3, h4, code 등 나머지 로직 동일하게 이식

```

---

## 4. 3단계: 파이썬 렌더러 (`renderer.py`) 구현 상세

가공된 JSON과 레이아웃 계산기를 바탕으로 백지상태의 PPT에 도형과 텍스트를 그립니다. JS의 `slide.addShape()`를 `python-pptx` 문법으로 1:1 대응시킵니다.

**[핵심 렌더링 로직 매핑]**

* **배경 및 단위 설정:**
* `python-pptx`의 `Inches()`와 `Pt()`를 사용하여 JS와 동일한 수치 체계 적용.


* **`renderCard` (카드 그리기) 파이썬 구현:**
```python
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

def render_card(slide, card_data, x, y, w, pal, config):
    # 높이 계산 (layout_calc.py 활용)
    h = card_h(card_data, w, config) 

    # 1. 둥근 사각형 그리기 (JS의 addShape("roundRect"))
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, 
        Inches(x), Inches(y), Inches(w), Inches(h)
    )

    # 2. 색상 및 테두리 적용 (디자인 토큰 활용)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor.from_string(pal['white'])
    shape.line.color.rgb = RGBColor.from_string(pal['border'])
    shape.line.width = Pt(0.75)

    # 3. 텍스트 블록 삽입 로직 (Y좌표 누적합 로직 JS와 동일하게 적용)
    # ...

```


* **`renderFeatureGrid`, `renderSteps` 등:**
* JS에 있는 컬럼 너비 계산식 `cardW = (w - (cols - 1) * g.gap) / cols`을 파이썬에서 그대로 사용하여, `slide.shapes.add_shape`를 반복문으로 돌려 그리드를 생성.



---

## 5. 파이썬 단일화의 강점 및 제약사항 (팩트 체크)

### 강점 (Why Pure Python?)

1. **의존성 단일화:** Node.js, npm 패키지(`pptxgenjs`), 마크다운 변환기를 걷어내고 파이썬 환경 하나로 통합되어 유지보수가 압도적으로 편합니다.
2. **정적 복제(Fallback) 완벽 지원:** JS에서는 불가능했던 "기존 차트나 표의 XML을 관계 파일(`_rels`) 채로 통째로 뜯어와서 새 PPT에 심는 작업"을 `python-pptx`의 하위 레벨 XML 제어로 구현할 수 있습니다.

### 제약사항 및 해결책

1. **그림자, 그라데이션 적용의 까다로움:** `pptxgenjs`는 옵션 한 줄로 그림자를 넣지만, `python-pptx`는 그림자 효과를 기본 API로 지원하지 않습니다.
* *해결책:* 해당 도형의 XML(lxml) 요소에 직접 접근하여 `<a:outerShdw>` 태그를 주입하는 래퍼(Wrapper) 함수를 만들어 극복합니다.


2. **텍스트 정렬의 한계:** 도형 내 텍스트의 수직 정렬(Valign)은 지원되나, JS처럼 패딩 값을 세밀하게 조절하는 것이 약간 더 번거롭습니다.
* *해결책:* 텍스트 프레임의 마진 속성(`margin_left`, `margin_top` 등)을 토큰 설정값과 연동하여 자동 계산하도록 설정합니다.


정말 죄송합니다. 제가 논의 과정에서 파이썬과 JS 구조를 섞어가며 파편화된 답변을 드려 심각한 혼란을 초래했습니다. 짜증 나시는 것이 당연합니다.

변명하지 않고, 이전에 흩뿌려졌던 모든 아이디어(JSON 분리, 비교/병합, JS 레이아웃 로직의 파이썬 이식, 정적 복제 등)를 하나로 완벽하게 통합한 [최종 종합 구현 계획서]를 단일 문서로 확정하여 제출합니다.

이 문서가 본 프로젝트의 유일한 마스터플랜(SSOT)입니다.

---

# 🚀 [최종 마스터플랜] 순수 파이썬 기반 PPT-as-Code (PaC) 시스템

## 1. 프로젝트 개요 및 핵심 사상

* **목표:** 기존 PPTX에서 '디자인(Style)'과 '콘텐츠(Content)'를 JSON으로 완전히 분리하고, 이를 비교/병합한 뒤 **순수 파이썬(`python-pptx`)만으로** 깨끗한 새 PPTX를 조립해 내는 자동화 파이프라인 구축.
* **전략:** 사용자님이 제공하셨던 훌륭한 렌더러(`md-to-pptx.mjs`)의 **'레이아웃 계산 수학 공식'과 '디자인 토큰 사상'만을 파이썬으로 100% 이식**하여, Node.js 의존성 없이 단일 언어로 구동.

---

## 2. 전체 디렉토리 및 아키텍처 구조

시스템은 4개의 핵심 모듈로 나뉘며 단방향으로 데이터가 흐릅니다.

```text
ppt_pac_project/
├── 📂 data/
│   ├── source_A.pptx         # 분석할 원본 (스타일 제공용)
│   ├── source_B.pptx         # 분석할 원본 (콘텐츠 제공용)
│   └── final_output.pptx     # 최종 산출물
│
├── 📂 config/                # [데이터 저장소]
│   ├── design_token_A.json   # A에서 추출된 폰트, 색상, 여백 규격
│   ├── design_token_B.json   # B에서 추출된 규격
│   ├── final_token.json      # 병합/수정된 최종 디자인 룰셋
│   └── content_ast.json      # 슬라이드 내용물(텍스트, 좌표, 구조) 트리
│
├── 📂 core/                  # [핵심 로직]
│   ├── 1_extractor.py        # PPTX ➔ JSON 추출기
│   ├── 2_controller.py       # JSON 간 비교(Diff) 및 병합기
│   ├── 3_layout_calc.py      # 텍스트 길이/높이 추정 알고리즘 (JS 로직 이식)
│   └── 4_renderer.py         # JSON ➔ PPTX 렌더러 (정적 복제 포함)
│
└── main.py                   # CLI 실행 엔트리포인트

```

---

## 3. 핵심 데이터 스키마 (JSON 규격)

추출된 데이터는 목적에 따라 두 가지 JSON으로 엄격히 분리됩니다.

### A. 디자인 토큰 (`design_token.json`)

전역 디자인 규격을 정의합니다. (제공하신 `pptdesign.config.json`의 파이썬 버전)

* **`palette`**: `brand`, `text`, `bgDark`, `border` 등의 색상 HEX 값.
* **`typography`**: 제목(`titleFont`), 본문(`bodyFont`)의 이름과 크기(pt).
* **`metrics`**: 슬라이드 폭/높이(인치), 기본 마진, 카드 둥글기(`radius`).

### B. 콘텐츠 AST (`content_ast.json`)

화면에 그려질 내용물만 담습니다.

* **`slide_num`**: 슬라이드 번호.
* **`elements`**: 배열 형태.
* 일반 개체: `{"type": "p", "text": "본문 내용..."}`
* 표: `{"type": "table", "headers": [...], "rows": [...]}`
* 복합 개체(차트): `{"type": "static_chart", "source_shape_id": "12"}`



---

## 4. 모듈별 구체적 구현 로직 (The Pipeline)

어떤 항목을 어떻게 뽑아내고, 어떻게 그릴 것인지에 대한 상세 명세입니다.

### [Phase 1] 추출 및 데이터화 (`1_extractor.py`)

원본 PPTX를 해체하여 JSON으로 만듭니다.

1. **디자인 추출 (To Token):**
* `slide_master.theme.theme_colors`에서 Accent, Dark 색상을 뽑아 HEX로 변환.
* `slide_master.text_styles`에서 제목과 본문의 기본 폰트 명칭 추출.


2. **콘텐츠 추출 (To AST):**
* 슬라이드 내의 모든 도형(`shapes`)을 $Y$ 좌표(top) 기준으로 위에서 아래로 정렬.
* 텍스트 프레임(`has_text_frame`)은 문단 단위로 쪼개어 `type: "p"` 또는 `type: "ul"`로 저장.
* **정적 복제 대상 감지:** 차트(`has_chart`), 스마트아트, OLE 객체를 만나면 내부 데이터를 무시하고 `{"type": "static", "shape_id": ID}` 태그만 달아둠.



### [Phase 2] 제어 및 병합 (`2_controller.py`)

JSON 설계도를 수정하고 확정합니다.

1. **JSON 비교 (Diff):** `deepdiff` 라이브러리를 사용해 토큰 A와 B의 차이(예: 폰트가 다름)를 분석.
2. **수동/자동 병합:** "스타일은 A를 따르고, 내용은 B를 따른다"는 룰에 따라 `final_token.json` 생성. 이때 폰트명은 표준 한글 폰트(예: 맑은 고딕)로 일괄 치환 가능.
3. **옵시디언 리포트:** 병합 과정의 차이점과 충돌 내역을 `diff_report.md`로 생성.

### [Phase 3] 레이아웃 계산 (`3_layout_calc.py`)

기존 JS 코드의 핵심이었던 '글자 수 기반 높이 계산식'을 파이썬으로 구현합니다.

* `estimate_lines(text, width_inch, font_size)` 함수 구현.
* `python-pptx`는 텍스트가 넘치면 도형이 알아서 커지지 않으므로, 이 계산기가 텍스트 길이에 맞춰 도형의 $H$(높이) 좌표를 수학적으로 사전 결정합니다.

### [Phase 4] 렌더링 및 생성 (`4_renderer.py`)

완성된 JSON을 읽어 백지상태의 프리젠테이션에 그립니다.

1. **기본 도형 렌더링:** `content_ast.json`을 순회하며 `slide.shapes.add_shape()` 실행. 이때 색상과 폰트는 하드코딩하지 않고 무조건 `final_token.json`의 변수를 주입.
2. **JS 그리드 로직 이식:** 제공하셨던 `renderCard`, `renderFeatureGrid`의 좌표 $X, Y$ 분할 로직을 파이썬의 `Inches()` 단위로 환산하여 적용.
3. **★ 정적 개체 주입 (Post-processing):**
* `type: "static"` 태그를 만나면, 원본 파일의 해당 슬라이드에서 XML 노드(`shape.element`)를 통째로 복사(`copy.deepcopy`)하여 대상 슬라이드에 덮어씀(`insert_element_before`).
* 데이터 연결(`_rels`)은 끊어지지만, 차트와 스마트아트의 껍데기 형태는 완벽히 유지됨.


4. **전환 효과 제거:** 저장 직전 XML 구조에 접근하여 `<p:transition>` 태그 일괄 삭제.

---

## 5. 명확한 기술적 제약사항 (Limits)

이 시스템을 도입할 때 반드시 감수해야 하는 현실적인 한계입니다.

1. **비정형 레이아웃의 직렬화(Serialization) 한계:**
* 화면 이곳저곳에 자유롭게 흩뿌려진 텍스트 박스들은 파이썬이 추출할 때 단순히 '위에서 아래로' 한 줄씩 나열되는 리스트로 뭉개집니다. 원본의 복잡한 시각적 배치를 100% 동일하게 복원하지 못합니다.


2. **표/차트의 디자인 룰셋 적용 불가:**
* 정적으로 복제된 차트나 표는 `final_token.json`에서 정의한 테마 색상(브랜드 컬러 등)을 입지 못하고, 원본 파일이 가지고 있던 색상을 그대로 달고 넘어옵니다.


3. **데이터 무결성 해제:**
* 차트의 원본 엑셀 연결이 끊어지므로, 병합된 최종 PPTX에서는 차트의 수치를 더블 클릭하여 수정할 수 없습니다.



---

## 6. 결론

본 계획서는 "기존 PPTX를 텍스트와 좌표 데이터(JSON)로 해체한 뒤, 강력한 규칙(디자인 토큰)을 부여하여 파이썬으로 처음부터 다시 그린다. 단, 차트처럼 못 그리는 건 원본 껍데기를 뜯어다 붙인다"는 사상을 구체적인 소프트웨어 공학 파이프라인으로 풀어낸 최종본입니다.
