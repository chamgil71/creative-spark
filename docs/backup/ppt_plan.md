# 🏗️ [최종 설계도] PPT-as-Code (PaC): 선언형 UI 기반 PPT 재구성 파이프라인

## 1. 프로젝트 핵심 사상 (Core Philosophy)

* **목표:** 완벽한 복제(Replication)가 아닌 **구조적 재구성(Recomposition)**. 기존 PPT를 "수정 가능한 시각 보존 객체"와 "시맨틱 데이터"로 나누어 새 디자인 시스템 위에서 재조립합니다.
* **아키텍처 모델:** **React Native for PowerPoint**. 문서 구조(AST)와 렌더러를 분리하고, 컴포넌트 기반으로 동작하는 파이썬 전용 파이프라인입니다.

---

## 2. 전체 디렉토리 및 모듈 구조 (Architecture)

지적해주신 'OOXML 레이어 격리'와 '컴포넌트 구조'를 반영한 시스템 트리입니다.

```text
ppt_pac_engine/
├── 📂 data/                    # 입출력 파일 및 스냅샷 이미지 보관
├── 📂 schemas/                 # JSON 규격 정의서
│   ├── document_ast.json       # (PPT 독립적) 범용 시맨틱 문서 모델
│   └── design_theme.json       # 디자인 토큰 (색상, 폰트 등)
│
├── 📂 stage_1_analyze/         # [분석 모듈]
│   ├── theme_parser.py         # 디자인 토큰(전역 변수) 추출기
│   ├── heuristic_parser.py     # Y좌표 외 폰트/색상/배치를 종합한 의미 추론기
│   └── snapshot_exporter.py    # 차트/스마트아트 PNG 스냅샷 추출기 (Fallback)
│
├── 📂 stage_2_compare/         # [비교 모듈]
│   ├── theme_merger.py         # 디자인 토큰 충돌 해결기
│   ├── ast_diff_engine.py      # 두 Document AST 및 디자인 토큰 간의 차이 분석기
│   └── manifest_builder.py     # 최종 렌더링 설계도 조립기
│
├── 📂 stage_3_math/            # [레이아웃 연산 모듈]
│   ├── font_measurer.py        # Pillow 기반 정밀 텍스트 너비 측정기
│   ├── word_wrapper.py         # 가상 줄바꿈(Virtual Wrapping) 연산기
│   └── box_model_engine.py     # 컴포넌트별 최종 좌표(X, Y, W, H) 할당기
│
└── 📂 stage_4_apply/           # [적용/렌더링 모듈]
    ├── component_registry.py   # 컴포넌트 라우터 (COMPONENTS 딕셔너리 관리)
    ├── components/             # render_hero, render_feature_grid 등 개별 UI
    ├── semantic_renderer.py    # AST를 읽어 컴포넌트를 조립하는 메인 렌더러
    ├── static_fallback.py      # 이미지 스냅샷 안전 삽입기
    └── ooxml_patcher.py        # (격리됨) 전환효과 삭제 등 Raw XML 제어 전담

```

---

## 3. 파이프라인 단계별 상세 구현 명세서

### 🔍 [1단계] 분석 및 시맨틱 역추출 상세 명세서

원본 PPT를 해체하여 **Document AST**와 **Design Token**으로 분리합니다.

* **Heuristic Semantic Classifier 도입:** 단순 Y정렬을 폐기합니다.
* 폰트 크기, 굵기, 정렬, 색상, 겹침 여부를 종합 점수화(`semantic_role_score()`)하여 해당 텍스트 상자가 `heading`인지, `side_note`인지, `list_item`인지 판별합니다.
* **Tier 2 - Static Preserve Mode (스냅샷 폴백):**
* 복잡한 차트, 표, 스마트아트는 XML 복사를 시도하지 않습니다.
* 파워포인트 기능(또는 win32com 제어)을 통해 해당 객체를 **PNG 이미지로 추출**(`chart -> PNG export -> image embed`)하여 AST에 보존 객체로 기록합니다.

**모듈 구성:**

1. `theme_parser.py` : 디자인 토큰(전역 변수) 추출기
2. `heuristic_parser.py` : 공간 및 의미 기반 텍스트 추론기
3. `snapshot_exporter.py` : 정적 객체 안전 보존기

#### 1. `theme_parser.py` (디자인 토큰 추출)

기존 파일의 슬라이드 마스터(`Slide Master`) 영역에 접근하여, 전체 PPT를 관통하는 CSS 변수들을 뽑아냅니다.

* **동작 로직:**

1. **컬러 팔레트 역산:** `<p:clrMap>` 및 `theme_colors` XML 노드를 탐색합니다. 파워포인트 내부에 정의된 `Accent 1~6`, `Dark 1~2` 값을 읽어들여 RGB 바이너리 값을 HEX 문자열(`"#6366F1"`)로 변환합니다. 이를 `primary`, `secondary`, `text_dark` 등의 시맨틱 변수명으로 매핑합니다.
2. **타이포그래피 추론:** `text_styles.title_style`과 `body_style`에 접근하여, 해당 테마가 기본으로 채택한 제목용 폰트(예: 맑은 고딕)와 본문용 폰트를 추출합니다.
3. **메트릭스(Metrics) 추출:** `prs.slide_width`를 읽어 EMU 단위를 인치(inch)로 변환하고, 16:9인지 4:3인지 비율 메타데이터를 기록합니다.

#### 2. `heuristic_parser.py` (핵심: 의미론적 텍스트 추론)

무작위로 흩어진 텍스트 상자들의 '역할(Role)'을 찾아내어 범용적인 Document AST로 묶어내는 가장 복잡한 모듈입니다.

* **동작 로직 (3-Step Processing):**

1. **공간 스캐닝 (Spatial Scanning):**

* 슬라이드 내 모든 개체(`shapes`)의 Bounding Box 좌표 ($X, Y$, 폭, 높이)를 스캔합니다.
* 일차적으로 $Y$ 좌표(위에서 아래로)를 기준으로 정렬하되, $Y$ 좌표가 거의 동일한(수평 선상에 있는) 개체들은 $X$ 좌표(좌에서 우로)로 2차 정렬합니다.

2. **컴포넌트 클러스터링 (Clustering):**

* 개체 간의 '거리(Proximity)'를 계산합니다.
* 예를 들어, 작은 아이콘 바로 아래에 짧은 텍스트가 있고, 그 옆에 비슷한 묶음이 여러 개 존재한다면, 이를 개별 텍스트로 보지 않고 `{"layout": "feature_grid"}` 또는 `columns`라는 상위 컨테이너로 묶어냅니다(Grouping).

3. **휴리스틱 스코어링 시스템 (Scoring System):**

* 각 텍스트 노드에 점수판(Score Board)을 적용하여 최종 역할을 부여합니다.
* **[조건 1: 제목 식별]** 폰트 크기가 24pt 이상이고, $Y$ 좌표가 슬라이드 상단 15% 이내에 위치하면 $\rightarrow$ `type: "heading", level: 1`
* **[조건 2: 리스트 식별]** 텍스트 프레임 내 단락(Paragraph)에 `bullet_char`가 존재하거나 내어쓰기(Indent level)가 1 이상이면 $\rightarrow$ `type: "list"`
* **[조건 3: 주석/푸터 식별]** 폰트 크기가 10pt 이하이고 슬라이드 최하단에 위치하면 $\rightarrow$ `type: "footer_note"`

#### 3. `snapshot_exporter.py` (이미지 스냅샷 폴백)

차트, 스마트아트, 복잡한 다이어그램 등 파이썬으로 완벽한 역엔지니어링이 불가능한 '블랙박스' 개체들을 안전하게 보존합니다.

* **동작 로직:**

1. **객체 감지:** `python-pptx`를 순회하다가 `shape.has_chart == True` 이거나 그룹핑 뎁스가 너무 깊은 복합 도형을 만납니다.
2. **파워포인트 백그라운드 호출 (win32com API):**

* XML 파싱을 멈추고, 윈도우 COM 객체(`win32com.client.Dispatch("PowerPoint.Application")`)를 백그라운드(Invisible) 모드로 엽니다.

3. **PNG 추출 (Export):**

* 감지된 해당 `Shape_ID`를 찾아내어 `.Export(Path, 2)` 메서드를 실행, 해당 차트나 객체만 배경이 투명한 고화질 `.PNG` 이미지로 지정된 `data/snapshots/` 폴더에 저장합니다.

4. **AST 기록:**

* AST에는 복잡한 차트 데이터 대신 `{"type": "image", "src": "./data/snapshots/chart_slide3_id5.png", "fallback_reason": "complex_chart"}` 라는 단순한 태그를 남깁니다.

##### 📥 1단계 최종 산출물 예시 (Output)

이러한 분석을 거치면 기존의 무거운 PPTX 파일은 아래와 같은 가벼운 시맨틱 데이터(`document_ast.json`)로 완벽히 정제됩니다.

```json
{
  "slide_number": 2,
  "children": [
    {
      "type": "heading",
      "level": 1,
      "text": "2026년 하반기 핵심 성과"
    },
    {
      "type": "columns",
      "children": [
        {
          "type": "list",
          "items": ["매출 20% 증가", "신규 고객 10만 확보"]
        },
        {
          "type": "image_snapshot",
          "src": "./data/snapshots/slide2_chart_01.png",
          "_note": "매출 추이 막대그래프 폴백"
        }
      ]
    }
  ]
}

```

---

### ⚖️ [2단계] 비교 및 병합 상세 명세서 (Compare & Merge)

서로 다른 출처에서 온 디자인(Theme)과 내용(AST)이 충돌하지 않도록 논리적으로 조율하고, "사람이 개입하여 최종 결정을 내리기 가장 쉬운 형태"로 데이터를 가공하는 단계입니다.

**모듈 구성:**

1. `theme_merger.py` : 디자인 토큰 충돌 해결기
2. `ast_diff_engine.py` : 시맨틱 구조(콘텐츠) 비교기
3. `manifest_builder.py` : 최종 렌더링 설계도 조립기

#### 1. `theme_merger.py` (디자인 토큰 병합 및 오버라이드)

A팀의 템플릿(디자인)에 B팀의 내용(콘텐츠)을 입히는 경우, 디자인 규격을 강제 통일하는 모듈입니다.

* **동작 로직:**

1. **Base Theme 로드:** 디자인의 기준이 될 `theme_A.json`을 읽어 들입니다.
2. **타이포그래피 정규화 (Typography Normalization):**

* B팀의 콘텐츠(`ast_B.json`) 내부에 혹시라도 남아있는 하드코딩된 폰트 정보(예: "맑은 고딕", "돋움")를 모두 스캔하여 삭제(Strip)합니다.
* 오직 `theme_A`에 정의된 `font_primary`, `font_secondary`만 사용하도록 토큰 포인터를 연결합니다.

3. **누락 컴포넌트 폴백 (Missing Component Fallback):**

* *문제 상황:* B팀의 콘텐츠에는 '표(Table)'가 있는데, A팀의 테마 파일에는 '표'에 대한 디자인 규격(선 굵기, 헤더 색상 등)이 없을 수 있습니다.
* *해결:* `theme_merger`가 이를 감지하면, 시스템에 내장된 '글로벌 Default 룰셋'에서 표 디자인 토큰을 가져와 `theme_A`에 안전하게 주입(Inject)합니다. 에러를 사전에 차단합니다.

#### 2. `ast_diff_engine.py` (시맨틱 콘텐츠 비교기)

두 개의 프레젠테이션 내용(AST)을 비교할 때, 컴퓨터만 아는 JSON Patch가 아니라 '사람이 읽고 판단할 수 있는(Human-Readable) 형태'로 차이점을 출력합니다.

* **동작 로직:**

1. **트리 비교 (Tree Diffing):** 파이썬의 `deepdiff` 라이브러리를 사용하여 `ast_A.json`과 `ast_B.json`의 계층 구조를 대조합니다.
2. **논리적 차이점 식별:** * 슬라이드 개수의 증감

* 특정 슬라이드 내 `heading` 텍스트의 변경
* 추가된 `image_snapshot` 유무

3. **옵시디언 마크다운 리포트 생성 (`diff_report.md`):**

* 개발자가 아닌 일반 기획자도 양쪽 파일의 차이를 알 수 있도록 직관적인 마크다운 표 형태로 출력합니다.

**[생성되는 `diff_report.md` 예시]**

```markdown
#### 🔄 PPT 병합 검토 리포트 (A vs B)

| 슬라이드 번호 | 원본 내용 (A) | 수정된 내용 (B) | 상태 |
| :--- | :--- | :--- | :--- |
| Slide 2 | `heading`: "2025년 실적" | `heading`: "**2026년 목표**" | 🟡 텍스트 수정됨 |
| Slide 3 | `list`: 3개 항목 | `list`: **4개 항목** | 🟢 항목 추가됨 |
| Slide 4 | (없음) | `static_chart`: "매출그래프" | 🔵 신규 슬라이드 |

> **Action:** B의 내용(최신)을 채택하고, A의 디자인(표준)을 적용하여 조립합니다.

```

#### 3. `manifest_builder.py` (최종 설계도 조립)

비교 및 검토가 끝난 후, 다음 단계인 [3단계: 레이아웃 연산] 엔진으로 넘겨줄 단 하나의 무결한 JSON(Final Manifest)을 생성합니다.

* **동작 로직:**

1. **구조 검증 (Schema Validation):** 조립된 JSON이 렌더러가 요구하는 표준 규격(Schema)에 맞는지 검사합니다. 필수 키값(예: `slide_ratio`)이 누락되었는지 확인합니다.
2. **정적 자원 매핑 (Static Asset Mapping):** 1단계에서 추출된 이미지 스냅샷(`.png`)들의 실제 파일 경로가 로컬 환경에 유효하게 존재하는지(Broken Link 검사) 확인합니다.
3. **최종 단일 파일 생성:** 디자인 토큰과 AST가 하나로 결합된 `final_manifest.json`을 출력합니다.

##### 📥 2단계 최종 산출물 예시 (Output: `final_manifest.json`)

```json
{
  "_meta": {
    "version": "final_merged_v1",
    "theme_source": "Corporate_Standard.pptx",
    "content_source": "Q3_Report_Draft.pptx"
  },
  
  "theme": {
    "slide_ratio": "16:9",
    "palette": { "brand_primary": "6366F1", "text": "1A1A2E" },
    "typography": { "font_primary": "Malgun Gothic", "body_size": 14 }
  },

  "document": {
    "slides": [
      {
        "slide_num": 1,
        "children": [
          { "type": "heading", "level": 1, "text": "Q3 성과 보고서" },
          { 
            "type": "columns", 
            "children": [
               { "type": "p", "text": "매출 15% 상승 달성" },
               { "type": "image_snapshot", "src": "./data/snapshots/q3_chart.png" }
            ]
          }
        ]
      }
    ]
  }
}

```

---

### 📐 [3단계] 정밀 레이아웃 연산 (Layout Math Engine) 상세 명세서

파워포인트 렌더러가 바보가 될 수 있도록 만들어주는 두뇌입니다. 텍스트가 상자를 뚫고 나가지 않도록 픽셀 단위 폭(W)과 높이(H)를 사전에 수학적으로 계산합니다.

**모듈 구성:**

1. `font_measurer.py` : Pillow 기반 정밀 텍스트 너비 측정기
2. `word_wrapper.py` : 가상 줄바꿈(Virtual Wrapping) 연산기
3. `box_model_engine.py` : 컴포넌트별 최종 좌표(X, Y, W, H) 할당기

#### 1. `font_measurer.py` (정밀 텍스트 너비 측정)

기존 자바스크립트 코드의 치명적 약점이었던 "글자 수 기반의 부정확한 줄바꿈 예측(`estimate_lines`)"을 폐기하고, 실제 폰트 파일을 렌더링하여 너비를 측정합니다.

* **동작 로직:**

1. **폰트 로드 (Font Loading):** `final_theme.json`에 정의된 폰트명(예: `Malgun Gothic`)을 시스템의 `.ttf` 파일 경로와 매핑하여 `PIL.ImageFont.truetype()`으로 메모리에 적재합니다.
2. **DPI 및 단위 환산:** 파워포인트의 기본 해상도(보통 96 DPI)를 기준으로, 폰트의 pt(포인트) 단위를 픽셀(px)로 환산합니다.
3. **정밀 측정 (getbbox):**

* `font.getbbox("테스트 문자열")` 함수를 호출하여 텍스트의 실제 Bounding Box 너비를 구합니다.
* 영문(W와 i의 너비 차이), 한글, 굵기(Bold)에 따른 미세한 픽셀 차이를 100% 정확하게 잡아냅니다.

#### 2. `word_wrapper.py` (가상 줄바꿈 연산)

측정된 너비를 바탕으로, 주어진 도형(컨테이너)의 폭 안에 텍스트가 몇 줄로 들어갈지 수학적으로 잘라냅니다.

* **동작 로직:**

1. **가용 너비 계산:** 텍스트가 들어갈 컴포넌트의 최대 폭(Max Width)에서 좌우 패딩(`padding_x`)을 뺀 순수 가용 너비를 구합니다.
2. **토큰 분리 및 누적 (Tokenizing & Accumulation):**

* 텍스트를 띄어쓰기 기준으로 단어(Token) 단위로 쪼갭니다.
* 단어 너비를 누적합(`current_width += word_width`)하다가 가용 너비를 초과하는 순간, 배열에 줄바꿈 문자(`\n`)를 삽입하고 다음 줄로 넘깁니다.

3. **높이 산출 (Height Calculation):**

* 최종적으로 계산된 줄 수(Line Count) $\times$ (폰트 크기 $\times$ 1.5 행간) 공식을 통해 텍스트 블록의 순수 높이($H$)를 확정합니다.

#### 3. `box_model_engine.py` (컴포넌트 좌표 할당)

웹의 CSS Box Model(Margin, Padding, Border) 개념을 파이썬 코드로 구현하여, 자식 요소들의 높이 합을 부모 컴포넌트의 높이로 역산합니다.

* **동작 로직:**

1. **Top-Down 순회:** `final_manifest.json`의 AST를 위에서 아래로 순회하며 초기 $Y$ 좌표(`body_top_y`)부터 시작합니다.
2. **동적 높이 누적 (Dynamic Height Accumulation):**

* 예를 들어 `feature_grid` 형태의 카드(Card) 컴포넌트를 계산할 때:
* $Card\_Height = 패딩(Top) + 제목 높이(산출됨) + 간격(gap) + 본문 높이(산출됨) + 패딩(Bottom)$

3. **절대 좌표 스탬핑 (Absolute Stamping):**

* 계산이 끝난 모든 개체(노드)에 PPTX가 요구하는 절대 좌표 변수 `$x, $y, $w, $h` 를 인치(Inch) 단위로 변환하여 AST에 강제로 박아 넣습니다(Inject).

##### 📥 3단계 최종 산출물 예시 (Output: `calculated_ast.json`)

```json
{
  "type": "card",
  "geometry": { "x": 0.5, "y": 1.25, "w": 3.0, "h": 2.45 },
  "style": { "bg_color": "FFFFFF", "radius": 0.08 },
  "children": [
    {
      "type": "heading",
      "text": "시장 동향",
      "geometry": { "x": 0.7, "y": 1.45, "w": 2.6, "h": 0.35 }
    },
    {
      "type": "p",
      "text": "현재 시장은 AI 솔루션의\n도입이 가속화되고 있습니다.", 
      "_note": "word_wrapper에 의해 정확히 2줄로 래핑됨",
      "geometry": { "x": 0.7, "y": 1.95, "w": 2.6, "h": 0.45 }
    }
  ]
}

```

---

### 🎨 [4단계] 컴포넌트 렌더링 및 OOXML 패치 상세 명세서 (Render & Patch)

대장정의 마지막이자, 앞선 1~3단계의 모든 논리적 계산 결과물을 실제 눈에 보이는 파워포인트 파일로 시각화하는 단계입니다. 이 단계의 핵심 철학은 "안전한 고수준 API 렌더링과 위험한 저수준 XML 제어의 철저한 격리"입니다.

**모듈 구성:**

1. `component_registry.py` : UI 컴포넌트 매핑 라우터 (React 역할)
2. `semantic_renderer.py` : AST 순회 및 렌더링 오케스트레이터
3. `static_fallback.py` : 이미지 스냅샷 안전 삽입기
4. `ooxml_patcher.py` : (격리됨) Raw XML 후처리 전담기

#### 1. `component_registry.py` & `semantic_renderer.py` (핵심 렌더링 엔진)

[3단계]에서 $X, Y, W, H$ 좌표가 모두 계산된 `calculated_ast.json`을 읽어, `python-pptx`의 안전한 기본 API(`add_shape`, `add_textbox`)만 사용하여 도형을 그립니다.

* **동작 로직:**

1. **컴포넌트 라우팅 (Component Routing):**

* `semantic_renderer.py`가 AST 노드를 순회하다가 `{"layout": "feature_grid"}`를 만나면, `component_registry.py`에 등록된 `render_feature_grid()` 함수로 제어권을 넘깁니다. (React의 컴포넌트 렌더링과 동일한 사상)

2. **테마 동적 주입 (Theme Injection):**

* 컴포넌트 함수 내에는 어떠한 색상코드나 폰트 이름도 하드코딩되어 있지 않습니다.
* 오직 인자로 전달받은 `final_theme.json`의 토큰을 꺼내 씁니다.
* *구현 예시:* `shape.fill.fore_color.rgb = RGBColor.from_string(theme["palette"]["brand_primary"])`

3. **단순 API 제한 (Safe API Only):**

* 이 모듈 안에서는 절대 `shape.element`를 호출하여 XML을 만지지 않습니다. 텍스트 삽입, 폰트 사이즈 지정, 도형 채우기 등 공식적으로 지원되는 안전한 메서드만 사용합니다.

#### 2. `static_fallback.py` (이미지 스냅샷 안전 삽입)

[1단계]에서 파이썬 파싱을 포기하고 PNG 이미지로 추출해 두었던 차트나 복잡한 다이어그램을 삽입합니다.

* **동작 로직:**

1. **스냅샷 감지:** AST에서 `{"type": "image_snapshot", "src": "./data/..."}` 노드를 만납니다.
2. **단순 이미지 삽입:** 원본 PPT의 복잡한 `_rels`(관계 파일)이나 엑셀 임베딩 구조를 복원하려 애쓰지 않습니다.
3. **실행:** `slide.shapes.add_picture(src, x, y, width, height)`를 호출하여, 계산된 정확한 위치에 차트의 '시각적 박제(PNG)'를 올려놓습니다. 에러율 0%의 가장 안전한 방식입니다.

#### 3. `ooxml_patcher.py` (Raw XML 후처리 전담)

`semantic_renderer`가 모든 슬라이드를 다 그리고 나면, `python-pptx` 공식 API로는 구현할 수 없는 '디테일'을 채우기 위해 **제한적으로 가동되는 외과 수술(Surgery) 모듈**입니다.

* **동작 로직:**

1. **파일 메모리 로드:** 렌더링이 완료된 프레젠테이션 객체(또는 저장된 임시 파일)의 XML 구조(`lxml.etree`)에 직접 접근합니다.
2. **그림자 효과 주입 (Shadow Injection):**

* 테마 JSON에 `{"card": {"shadow": true}}`가 있다면, 카드로 생성된 도형들의 XML 노드 `<p:spPr>` 하위에 그림자 태그 `<a:outerShdw>`를 일괄 삽입합니다.

3. **불순물 제거 (Clean-up):**

* 기존 PPT 마스터에서 딸려온 원치 않는 전환 효과(`<p:transition>`)나 애니메이션 타이밍 노드를 정규식과 트리 탐색을 통해 찾아내어 일괄 삭제(Remove)합니다.

4. **최종 저장:** 모든 패치가 끝난 후 무결성을 검증하고 `final_output.pptx`로 저장합니다.

##### 📥 4단계 최종 산출물 (The Final Result)

이 모든 파이프라인을 통과한 `final_output.pptx`는 다음과 같은 특성을 갖게 됩니다.

1. **디자인 일관성 100%:** 하드코딩된 '굴림체'나 엉뚱한 색상이 단 하나도 존재하지 않으며, 전사 표준 디자인 토큰에 완벽히 통제됩니다.
2. **레이아웃 안정성:** 텍스트가 상자를 뚫고 나가거나 겹치는 현상이 없습니다 (3단계 Pillow 연산의 결과).
3. **파일 무결성:** 알 수 없는 에러창("파워포인트에서 콘텐츠에 문제가 발생했습니다")이 뜨지 않습니다 (OOXML 딥카피를 포기하고 스냅샷과 안전 API를 택한 결과).

---

## 5. 단계별 권장 릴리즈 우선순위 (Roadmap)

시스템이 무너지는 것을 막기 위해, 초기 목표를 좁혀 단계적으로 확장합니다.

* **[V1] Semantic Core:**
* HTML-like Document AST 파싱 ➔ Pillow 정밀 레이아웃 ➔ Component Registry를 통한 텍스트/그리드/카드 렌더링 ➔ Design Token 주입.
* **[V2] Heuristic Extraction & Fallback:**
* 기존 PPT에서 휴리스틱 분류기를 통한 AST 자동 추출 완성.
* 복잡한 객체(차트 등)의 PNG Image Snapshot 폴백 지원.
* **[V3] Limited OOXML Preserve:**
* 격리된 `ooxml_patch.py`를 활용해 원본 PPT의 레이아웃 마스터나 필수적인 테마 XML 정보만 제한적으로 보존/이식.
* **[V4] Editable Component Reconstruction:**
* 이미지 스냅샷에 머물던 표/차트를, 추출된 Data 배열을 바탕으로 `python-pptx` 네이티브 객체로 바닥부터 다시 그려내는(Reconstruct) 컴포넌트 추가.