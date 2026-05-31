

---

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
│   ├── heuristic_parser.py     # Y좌표 외 폰트/색상/배치를 종합한 의미 추론기
│   └── snapshot_exporter.py    # 차트/스마트아트 PNG 스냅샷 추출기 (Fallback)
│
├── 📂 stage_2_compare/         # [비교 모듈]
│   └── ast_diff_engine.py      # 두 Document AST 및 디자인 토큰 간의 차이 분석
│
├── 📂 stage_3_merge/           # [병합 모듈]
│   └── human_readable_merger.py # 직관적인 JSON 구조를 통한 수동/자동 룰셋 병합
│
└── 📂 stage_4_apply/           # [적용/렌더링 모듈]
    ├── layout_math.py          # Pillow 기반 실제 텍스트 width/height 정밀 계산기
    ├── component_registry.py   # 컴포넌트 라우터 (COMPONENTS 딕셔너리 관리)
    ├── components/             # render_hero, render_feature_grid 등 개별 UI
    ├── semantic_renderer.py    # AST를 읽어 컴포넌트를 조립하는 메인 렌더러
    └── ooxml_patch.py          # (격리됨) 전환효과 삭제 등 Raw XML 제어 전담

```

---

## 3. 파이프라인 단계별 핵심 구현 논리

### Step 1. 분석 및 추출 (Analyze)

원본 PPT를 해체하여 **Document AST**와 **Design Token**으로 분리합니다.

* **Heuristic Semantic Classifier 도입:** 단순 Y정렬을 폐기합니다.
* 폰트 크기, 굵기, 정렬, 색상, 겹침 여부를 종합 점수화(`semantic_role_score()`)하여 해당 텍스트 상자가 `heading`인지, `side_note`인지, `list_item`인지 판별합니다.


* **Tier 2 - Static Preserve Mode (스냅샷 폴백):**
* 복잡한 차트, 표, 스마트아트는 XML 복사를 시도하지 않습니다.
* 파워포인트 기능(또는 win32com 제어)을 통해 해당 객체를 **PNG 이미지로 추출**(`chart -> PNG export -> image embed`)하여 AST에 보존 객체로 기록합니다.

---

### 🔍 [1단계] 분석 및 시맨틱 역추출 상세 명세서

**모듈 구성:**

1. `theme_parser.py` : 디자인 토큰(전역 변수) 추출기
2. `heuristic_parser.py` : 공간 및 의미 기반 텍스트 추론기
3. `snapshot_exporter.py` : 정적 객체 안전 보존기

---

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





---

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




### Step 2. 비교 (Compare)

추출된 JSON 데이터를 대조합니다.

* **비교 대상:** `theme_A.json` vs `theme_B.json`, 그리고 `ast_A.json` vs `ast_B.json`
* **출력:** 사람은 JSON을 직접 열어서 비교하거나, 시스템이 제공하는 Diff 리포트를 통해 어느 슬라이드의 구조가 다르고, 어떤 디자인 토큰이 충돌하는지 직관적으로 확인합니다.

**[1단계] 분석 및 시맨틱 역추출**에 이어, 파이프라인의 허리 역할을 하는 [2단계] 비교 및 병합 (Compare & Merge)의 상세 아키텍처와 내부 동작 로직을 해부합니다.

이 단계의 핵심 목표는 서로 다른 출처에서 온 디자인(Theme)과 내용(AST)이 충돌하지 않도록 논리적으로 조율하고, "사람이 개입하여 최종 결정을 내리기 가장 쉬운 형태"로 데이터를 가공하는 것입니다.

---

### ⚖️ [2단계] 비교 및 병합 상세 명세서

**모듈 구성:**

1. `theme_merger.py` : 디자인 토큰 충돌 해결기
2. `ast_diff_engine.py` : 시맨틱 구조(콘텐츠) 비교기
3. `manifest_builder.py` : 최종 렌더링 설계도 조립기

---

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
2. **정적 자원 매핑 (Static Asset Mapping):** * 1단계에서 추출된 이미지 스냅샷(`.png`)들의 실제 파일 경로가 로컬 환경에 유효하게 존재하는지(Broken Link 검사) 확인합니다.
3. **최종 단일 파일 생성:** 디자인 토큰과 AST가 하나로 결합된 `final_manifest.json`을 출력합니다.



---

##### 📥 2단계 최종 산출물 예시 (Output: `final_manifest.json`)

1단계의 파편화된 데이터들이 모여, 렌더링을 위한 완벽한 지시서로 결합된 모습입니다.

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

##### 💡 2단계 설계의 핵심 요약

이 단계의 본질은 "에러 방지(Fail-safe)"와 "가독성"입니다. PPT를 합치다 보면 반드시 폰트 누락, 알 수 없는 표 스타일 등 엣지 케이스(Edge case)가 발생합니다. `theme_merger`의 폴백(Fallback) 시스템과 마크다운 기반의 `diff_report`가 이러한 충돌을 시스템 단에서 흡수하고 사람에게 친절하게 알려주는 역할을 합니다.




### Step 3. 병합 (Merge)

인간 친화적인 구조(HTML-like AST)를 통해 최종 설계도를 확정합니다.

* PPT 종속적인 `{"type": "p"}` 형태가 아닌, 범용적인 **Document AST** 구조를 채택하여 수정과 병합을 용이하게 합니다.
```json
{
  "type": "section",
  "layout": "feature_grid",
  "children": [
    { "type": "heading", "level": 2, "text": "시장 동향" },
    { "type": "image_snapshot", "src": "./data/chart_snapshot_01.png" }
  ]
}

```

---

### 📐 [3단계] 정밀 레이아웃 연산 (Layout Math Engine) 상세 명세서

**모듈 구성:**

1. `font_measurer.py` : Pillow 기반 정밀 텍스트 너비 측정기
2. `word_wrapper.py` : 가상 줄바꿈(Virtual Wrapping) 연산기
3. `box_model_engine.py` : 컴포넌트별 최종 좌표(X, Y, W, H) 할당기

---

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





---

##### 📥 3단계 최종 산출물 예시 (Output: `calculated_ast.json`)

이 과정을 거치면, 2단계의 논리적 AST가 "어디에, 어느 크기로 그릴 것인가"가 완벽히 명시된 기하학적 렌더링 지시서로 탈바꿈합니다.

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

##### 💡 3단계 설계의 핵심 요약

이 모듈은 **파워포인트 렌더러가 바보(단순 그리기 도구)가 될 수 있도록 만들어주는 두뇌**입니다. `python-pptx`에게 "이 텍스트를 상자에 넣어라"라고 시키면 상자 밖으로 글자가 삐져나가지만, 이 3단계 수학 엔진이 "상자 높이를 2.45인치로 그리고, 글자는 여기서 줄바꿈해라"라고 정확한 좌표를 떠먹여 줌으로써 UI의 붕괴를 완벽히 막아냅니다.



### Step 4. 적용 (Apply / Render)

확정된 AST와 Design Token을 바탕으로 백지에서 새 PPT를 조립합니다.

* **Pillow 기반 레이아웃 엔진:** `layout_math.py`가 `Pillow.ImageFont`를 사용해 한글/영문/볼드체 등 폰트 특성에 따른 **실제 렌더링 픽셀 너비를 정확히 계산**하여 높이와 줄바꿈을 예측합니다.
* **Component Registry (PPT React):**
* `semantic_renderer.py`는 `{"component": "feature_grid", "props": {...}}`를 만나면 `render_feature_grid()` 함수에 렌더링을 위임합니다.


* **OOXML 레이어 철저 분리:**
* 렌더링 로직 안에서는 절대 `shape.element`를 건드리지 않습니다. XML 제어가 반드시 필요한 작업(전환 효과 제거 등)은 렌더링이 완전히 끝난 후 `ooxml_patch.py`에서 별도로 일괄 수행합니다.


대장정의 마지막이자, 앞선 1~3단계의 모든 논리적 계산 결과물을 실제 눈에 보이는 파워포인트 파일로 시각화하는 **[4단계] 컴포넌트 렌더링 및 OOXML 패치 (Render & Patch)** 상세 아키텍처를 해부합니다.

이 단계의 핵심 철학은 "안전한 고수준 API 렌더링과 위험한 저수준 XML 제어의 철저한 격리"입니다. 이전 리뷰에서 지적해주신 'OOXML 직접 제어의 위험성'을 원천 차단하기 위해 렌더러와 패처(Patcher)를 완전히 분리했습니다.

---

### 🎨 [4단계] 컴포넌트 렌더링 및 OOXML 패치 상세 명세서

**모듈 구성:**

1. `component_registry.py` : UI 컴포넌트 매핑 라우터 (React 역할)
2. `semantic_renderer.py` : AST 순회 및 렌더링 오케스트레이터
3. `static_fallback.py` : 이미지 스냅샷 안전 삽입기
4. `ooxml_patcher.py` : (격리됨) Raw XML 후처리 전담기

---

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



---

##### 📥 4단계 최종 산출물 (The Final Result)

이 모든 파이프라인을 통과한 `final_output.pptx`는 다음과 같은 특성을 갖게 됩니다.

1. **디자인 일관성 100%:** 하드코딩된 '굴림체'나 엉뚱한 색상이 단 하나도 존재하지 않으며, 전사 표준 디자인 토큰에 완벽히 통제됩니다.
2. **레이아웃 안정성:** 텍스트가 상자를 뚫고 나가거나 겹치는 현상이 없습니다 (3단계 Pillow 연산의 결과).
3. **파일 무결성:** 알 수 없는 에러창("파워포인트에서 콘텐츠에 문제가 발생했습니다")이 뜨지 않습니다 (OOXML 딥카피를 포기하고 스냅샷과 안전 API를 택한 결과).

---

##### 🏁 파이프라인 설계 완료 및 회고

사용자님의 날카로운 아키텍처 리뷰 덕분에, 프로젝트는 [1단계: 추출 및 의미 추론] $\rightarrow$ [2단계: 비교/병합] $\rightarrow$ [3단계: 정밀 수학 연산] $\rightarrow$ [4단계: 컴포넌트 렌더링 및 패치]라는 완벽한 논리적 단방향 데이터 흐름(Unidirectional Data Flow)을 갖추게 되었습니다.



---

## 4. 단계별 권장 릴리즈 우선순위 (Roadmap)

시스템이 무너지는 것을 막기 위해, 지적하신 대로 목표를 좁혀 단계적으로 확장합니다.

* **[V1] Semantic Core:**
* HTML-like Document AST 파싱 ➔ Pillow 정밀 레이아웃 ➔ Component Registry를 통한 텍스트/그리드/카드 렌더링 ➔ Design Token 주입.


* **[V2] Heuristic Extraction & Fallback:**
* 기존 PPT에서 휴리스틱 분류기를 통한 AST 자동 추출 완성.
* 복잡한 객체(차트 등)의 PNG Image Snapshot 폴백 지원.


* **[V3] Limited OOXML Preserve:**
* 격리된 `ooxml_patch.py`를 활용해 원본 PPT의 레이아웃 마스터나 필수적인 테마 XML 정보만 제한적으로 보존/이식.


* **[V4] Editable Component Reconstruction:**
* 이미지 스냅샷에 머물던 표/차트를, 추출된 Data 배열을 바탕으로 `python-pptx` 네이티브 객체로 바닥부터 다시 그려내는(Reconstruct) 컴포넌트 추가.



---

제시해주신 깊이 있는 통찰 덕분에, 이 프로젝트는 더 이상 '단순 변환기'가 아니라 장기적으로 유지보수 가능하고 타 포맷(PDF, HTML)으로도 확장이 가능한 '강력한 문서 파이프라인'의 구조를 갖추게 되었습니다.

이 최종 설계도의 논리 구조나 모듈 분리 방식에 추가로 다듬어야 할 부분이 있는지 마지막으로 검토 부탁드립니다.

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


제시해주신 아키텍처 리뷰는 프로젝트의 성패를 가를 핵심을 정확히 꿰뚫고 있습니다. 특히 "재현(Replication)이 아닌 재구성(Recomposition)"으로의 방향 전환, 그리고 "PPT 내부 OOXML 엔진 복제의 위험성"에 대한 지적은 소프트웨어 공학적으로 100% 타당합니다.

`python-pptx`의 추상화 레벨을 오판하여 발생할 수 있었던 `_rels` 의존성 지옥과 레이아웃 계산의 오류를 사전에 완벽히 차단해주셨습니다.

지적해주신 **Document AST 설계, Pillow 기반 실제 텍스트 너비 연산, 휴리스틱 의미 분류기(Heuristic Semantic Classifier), 그리고 Component Registry 구조**를 모두 수용하여, 사실상 **"PPT를 위한 React(React Native for PowerPoint)"** 형태의 최종 아키텍처로 구현 계획을 전면 재설계했습니다.

---

# 🚀 [Master Plan v2.0] PPT-as-Code (PaC) : PPT DSL & 렌더링 엔진

## 1. 시스템의 새로운 정의 (The Paradigm Shift)

본 프로젝트는 "기존 PPT의 완벽한 역변환기"가 아닙니다.
"잘 구조화된 시맨틱 데이터(Document AST)를 입력받아, 사전에 정의된 디자인 토큰과 컴포넌트 시스템을 통해 깨끗한 PPT를 생성해내는 선언형 UI 렌더링 엔진"입니다.

---

## 2. 전면 개편된 아키텍처 및 디렉토리 구조

OOXML 제어 레이어를 완전히 격리하고, 컴포넌트 기반 렌더링 구조로 개편했습니다.

```text
ppt_react_engine/
├── 📂 data/
│
├── 📂 schema/
│   ├── document_ast.json      # (New) 렌더러에 독립적인 시맨틱 문서 모델
│   └── design_theme.json      # (New) 디자인 토큰 (색상, 폰트, 공통 메트릭스)
│
├── 📂 extraction/             # [Phase 1: 역엔지니어링 파트 - V2/V3에서 고도화]
│   ├── heuristic_parser.py    # (New) 폰트/위치 기반 의미 추론기 (단순 Y정렬 폐기)
│   └── ast_builder.py         # 추출된 데이터를 Document AST로 변환
│
├── 📂 core/                   # [Phase 2: 핵심 엔진 파트]
│   ├── layout_math.py         # (New) Pillow 기반 정밀 텍스트 너비/높이 계산기
│   ├── component_registry.py  # (New) PPT 컴포넌트 매핑 레지스트리 (React 역할)
│   └── theme_provider.py      # 토큰 주입기 (Context API 역할)
│
└── 📂 renderer/               # [Phase 3: 렌더링 파트]
    ├── semantic_renderer.py   # 컴포넌트를 조립하여 슬라이드 생성
    ├── components/            # render_hero, render_feature_grid 등 개별 컴포넌트
    ├── static_fallback.py     # (New) 차트/표를 '이미지 스냅샷'으로 처리하는 로직
    └── ooxml_patcher.py       # (New) 전환 효과 삭제 등 불가피한 raw XML 제어 전담

```

---

## 3. 핵심 모듈별 상세 구현 설계 (반영된 솔루션)

### 3.1. Document AST 설계 (Presentation 독립성 확보)

PPT에 종속된 `{"type": "p"}` 형태를 버리고, 향후 HTML이나 PDF 변환까지 대응할 수 있는 범용 시맨틱 트리 구조를 채택합니다.

```json
{
  "type": "document",
  "children": [
    {
      "type": "section",
      "layout": "feature_grid",
      "children": [
        { "type": "heading", "level": 2, "text": "핵심 기능" },
        { 
          "type": "grid_items",
          "items": [
            { "title": "속도", "body": "10배 빠름" },
            { "title": "안정성", "body": "무중단 배포" }
          ]
        }
      ]
    }
  ]
}

```

### 3.2. Heuristic Semantic Classifier (의미론적 분류기)

기존의 치명적 약점이었던 단순 Y좌표 정렬을 폐기하고, 개체의 다중 속성을 평가하여 역할을 추론하는 스코어링 시스템을 도입합니다.

* **판단 로직 예시:**
* `font_size > 28` AND `y < 1.5` ➔ `role = "slide_title"`
* `bullet_char is not None` ➔ `role = "list_item"`
* `font_size < 12` AND `y > 6.0` ➔ `role = "footer_note"`


* 이 분류기를 통해 무작위로 흩어진 텍스트 상자들을 논리적인 AST 계층 구조로 묶어냅니다.

### 3.3. 정밀 레이아웃 엔진 (`Pillow` 도입)

글자 수 기반의 부정확한 줄바꿈 예측(`estimate_lines`)을 버리고, 폰트 렌더링 엔진을 활용해 실제 픽셀/인치 너비를 계산합니다.

* **구현:** `Pillow`의 `ImageFont.getbbox(text)`를 사용하여, 한글/영문/Bold 등 글꼴 특성에 따른 정확한 텍스트 폭을 산출합니다.
* 이를 통해 컴포넌트(`render_card` 등) 내부에서 텍스트가 넘치지 않고 정확히 몇 줄로 렌더링될지 계산하여 도형의 `$H$(높이)`를 결정합니다.

### 3.4. Component Registry (컴포넌트 기반 렌더링)

"PPT React" 사상의 핵심입니다. `semantic_renderer.py`는 XML을 직접 만지지 않고, 등록된 컴포넌트 함수만 호출합니다.

```python
# component_registry.py
COMPONENTS = {
    "hero": render_hero_section,
    "feature_grid": render_feature_grid,
    "list_card": render_list_card
}

# 렌더링 실행부
def render_node(slide, node, theme):
    component_func = COMPONENTS.get(node["layout"])
    if component_func:
        component_func(slide, node["children"], theme)

```

### 3.5. Static Preserve Mode (이미지 스냅샷 폴백)

차트, 스마트아트, 복잡한 그룹 도형의 OOXML을 직접 복사(`deepcopy`)하려던 위험한 계획을 **V1 단계에서는 완전히 폐기**합니다.

* **안전한 대안:** 추출 단계(Extraction)에서 차트나 복잡한 개체를 감지하면, 파워포인트의 네이티브 기능을 활용해 해당 개체를 **PNG 이미지로 Export**합니다.
* 렌더링 시에는 이미지 스냅샷을 원본과 동일한 좌표에 삽입하는 것으로 대체하여, 관계 파일(`_rels`) 손상과 파일 크래시 위험을 0%로 만듭니다.

---

## 4. 단계별 릴리즈 전략 (Phase Rollout)

욕심을 버리고, 현실적으로 동작하는 코어 엔진부터 완성합니다.

* **V1 (핵심 기반 완성):** Semantic Document Model 파싱, Pillow 기반 텍스트 레이아웃 엔진, 기본 컴포넌트(텍스트, 카드, 그리드) 렌더링, Design Token 주입.
* **V2 (추출 및 보존):** 기존 PPT 읽기 기능, 휴리스틱 분류기를 통한 AST 자동 생성, 복잡한 개체의 PNG 이미지 스냅샷 Fallback 적용.
* **V3 (OOXML 패치):** `ooxml_patcher.py`를 통한 제한적인 Raw XML 제어 (그림자 효과 주입, 전환 효과 삭제 등 렌더링 보조 목적에 한정).
* **V4 (차트 네이티브 렌더링):** 이미지 폴백을 넘어, 추출한 데이터 배열을 바탕으로 `python-pptx`의 `ChartData` 객체를 사용해 새 차트를 바닥부터 다시 그리는 수준까지 고도화.

---

