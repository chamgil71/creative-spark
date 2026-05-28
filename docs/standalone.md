# Standalone HTML 빌드

인터넷 없이 웹브라우저만 있으면 로컬 오프라인 환경에서도 모든 가이드를 확인하고 검색할 수 있는 단일 완성형 HTML 파일(`standalone.html`)을 빌드하는 방법입니다.

---

## 주요 명령어

```bash
npm run sync:guides             # 가이드 목록 동기화 (md_src/guides/*.md -> src/data/guides.json)
npm run build:publish           # 마크다운 파일을 public/ 폴더 내 정적 HTML로 컴포넌트 변환
npm run build:standalone        # public/standalone.html 단독 생성
npm run build                   # 전체 빌드 수행 (dist/ 및 dist/standalone.html 자동 최종 포함)
```

---

## 렌더링 방식 및 특징

- **Shadow DOM 격리**: 각 가이드 본문을 **Shadow DOM** 내부에 격리하여 로딩하므로, 개별 가이드 문서 고유의 스타일(인라인 CSS 및 레이아웃 변수)이 셸(Shell) UI의 테두리, 내비게이션 메뉴 등을 침범하거나 왜곡시키지 않습니다.
- **다이내믹 다크/라이트 테마**: 사용자 브라우저의 기본 설정 및 로컬 스토리지(`localStorage`) 테마 상태를 자동으로 유지합니다.
- **인쇄 및 PDF 친화 설계**: 단일 가이드를 인쇄하거나 PDF로 저장(브라우저 인쇄 단축키 `Ctrl + P`)할 때 상단 바, 사이드바 메뉴, 이전/다음 버튼을 미디어 쿼리를 통해 자동으로 숨기며 문서 전체만 깔끔하게 레이아웃을 보정해 출력합니다.
- **정리 로직**: 각 정적 가이드 HTML을 합칠 때 로컬용 자바스크립트 스크립트, 최상단 스크롤 버튼(`.back-top`, `#backTop`), 정적 푸터(`footer`) 영역 등 단일 뷰에서 중복되어 거추장스러운 요소들을 자동으로 분리 및 제거하여 패키징합니다.

---

## 자동 발견 및 묶음 규칙

`scripts/build-standalone.mjs` 빌더가 수행하는 데이터 번들링 로직은 다음과 같습니다:

1. **카테고리 가이드**: `src/data/guides.json` 내 `categories` 정보를 읽어 고유 `slug`에 매핑된 `public/guides/<파일명>.html` 본문을 불러와 인라인 데이터 칩셋 형태로 삽입합니다.
2. **시리즈(컬렉션)**: `collections` 배열에 등록된 폴더 경로(예: `public/vibecoding/`)를 스캔하여 모든 가이드 `*.html` 파일을 알파벳순으로 자동 추적합니다.
   * 각 파일의 `<title>` 태그를 파싱하여 목차 상의 파트(Part) 제목을 추출합니다.
   * `indexFile`(예: `table-of-contents.html`)을 감지하여 항상 해당 컬렉션의 최상단("목차")에 고정 배치합니다.
   * 최종적으로 런타임 클라이언트 앱이 비동기로 목록을 받아볼 수 있도록 `manifest.json` 파일도 해당 시리즈 폴더 내에 함께 자동 생성해 배포합니다.

---

## 새 단일 가이드 추가 및 Standalone 반영 흐름

1. **마크다운 파일 생성**: `templates/template.md`를 복사하여 `md_src/guides/MyGuide.md`를 작성합니다.
2. **가이드 동기화 및 퍼블리시**:
   ```bash
   # 인덱스 guides.json 자동 동기화 및 갱신
   npm run sync:guides
   
   # 마크다운 문서를 public/guides/ 정적 HTML로 컴파일
   npm run build:publish
   ```
3. **Standalone 파일 빌드 및 최종 배포**:
   ```bash
   # 배포용 Vite 번들 및 dist/standalone.html 일괄 빌드
   npm run build
   ```

자세한 가이드 숏코드 작성 문법: [guide-creation.md](guide-creation.md)

---

## 새 시리즈(컬렉션) 추가 방법

1. `md_src/<my-series>/` 폴더 내에 시리즈 마크다운 문서 파일들을 추가합니다.
2. `src/data/guides.json`의 `collections` 배열에 신규 항목 명세를 수동 혹은 코드로 추가합니다.
   ```json
   {
     "id": "my-series",
     "label": "신규 시리즈 타이틀",
     "description": "시리즈 핵심 요약 설명",
     "color": "#0ea5e9",
     "folder": "my-series",
     "indexFile": "table-of-contents.html"
   }
   ```
3. `npm run build`를 실행하여 컴파일 및 단일 standalone 패키징을 완료합니다.

---

## 배포 형태 및 산출 위치

| 빌드 형태 | 사용 명령어 | 최종 결과물 및 비고 |
|:---|:---|:---|
| **React 통합 웹앱** | `npm run build` | `dist/` 폴더 내 정적 파일 (서버 배포 가능) |
| **Standalone (로컬용)** | `npm run build:standalone` | `public/standalone.html` (로컬 테스트용) |
| **Standalone (배포용)** | `npm run build` | `dist/standalone.html` (동일 빌드 내 자동 통합 완료) |
