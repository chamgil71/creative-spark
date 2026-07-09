# 📚 Creative Spark — AI Tool Guides & Presentation Engine (v2)

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.txt)

> **마크다운 가이드북 ──> React 반응형 웹북 & Standalone 오프라인 1파일 & PPT형 횡 슬라이드 HTML 통합 자동화 엔진**  
> AI 도구(Cursor, Claude, Supabase 등)에 대한 정밀 가이드 문서를 마크다운으로 편집하면, 풍부한 시각적 숏코드(Shortcode)가 주입된 웹 리더, 횡형 슬라이드 프리젠테이션 및 100% 무설치 단일 오프라인 HTML 파일로 자동 번들링됩니다.

---

## 🌐 서비스 구동 및 배포 환경

| 환경 | 접속/구동 경로 | 상태 |
| :--- | :--- | :--- |
| **로컬 개발 서버 (React)** | http://localhost:8080 | 실시간 핫 리로딩 지원 |
| **[단독] 가이드 변환기 에디터** | http://localhost:8080/converter.html | 가이드 허브 비의존 독립 실행 |
| **로컬 가이드북 빌드 결과** | `dist/index.html` (Vite 빌드 번들) | 로컬 배포 패키지 |
| **[단독] 가이드 변환기 빌드 결과** | `dist/converter.html` (Vite 빌드 번들) | 독립 변환기 배포 패키지 |
| **통합 Standalone HTML** | [dist/standalone.html](file:///c:/ai/creative-spark/dist/standalone.html) | 오프라인용 단일 파일 (무설치 기동) |
| **PPT형 횡 슬라이드 뷰어** | `public/presentation/*.html` | 키보드 내비게이션 지원 PPT HTML |
| **파워포인트 다운로드** | `public/pptx/*.pptx` | PPTXGenJS 생성 프레젠테이션 파일 |

---

## 🚀 2026-06 핵심 업데이트: 독립형 가이드 변환기 & 에디터(Converter) 탑재
기존의 마크다운 빌더 명령줄 도구에서 한 단계 진화하여, 로컬 환경에서 시각적으로 마크다운을 에디팅하고 즉각 횡형 슬라이드 및 파워포인트(PPTX) 파일로 일제히 변환·저장할 수 있는 **반응형 IDE 스타일의 에디터**를 탑재했습니다.

* **💻 Split-Pane 양쪽 분할 화면**: 좌측에는 마크다운 편집기, 우측에는 반응형 실시간 미리보기를 제공하여 편집 내용을 탭 전환 없이 한눈에 조망할 수 있습니다.
* **🎨 실시간 디자인 테마 매니저**: 우측 드로어 패널을 열어 현재 제공되는 모든 스타일 프리셋(메인, 서브, 강조, 배경 등 HSL 색상)을 표 형태로 확인하고, 컬러피커를 통해 영구 수정 및 새로운 테마 추가가 가능합니다.
* **📂 유연한 로컬 저장 파이프라인**: 
  1. **단독 파일 생성**: 가이드 허브에 엮이지 않고 지정한 로컬 출력 폴더(`dist-pptx` 등)에 다중 선택된 포맷(HTML, 횡HTML, PPTX) 파일만 직접 단독 추출합니다.
  2. **가이드 허브 추가**: `md_src/guides/` 내에 원본 마크다운을 저장하고, 가이드 허브 전체 컴파일 및 색인을 1초 만에 갱신하여 인덱스에 통합시킵니다.
* **🎛️ 단독 실행 모드 (`converter.html`) 지원**: 가이드 허브 메인 페이지 없이 오직 마크다운 변환과 PPTX 파일 추출만 필요로 하는 유저를 위해, 허브 인덱스 갱신 옵션 및 메인 복귀 단추를 숨긴 **순수 독립 가이드 변환기** 구동 모드를 제공합니다.

---

## 📂 체계화된 디렉토리 구조 (Directory Architecture)

향후 기능 확장 및 소스 관리에 최적화되도록 다음과 같이 프로젝트 폴더 역할을 정돈하고 체계화했습니다:

```
creative-spark/
├── md_src/                     # 원천 마크다운 소스 저장소
│   ├── guides/                 # [메인] 가이드북 허브 연동용 AI 도구 마크다운 파일 (*.md)
│   ├── showcase/               # [가이드] 29종 숏코드 문법 및 쇼케이스용 마크다운 파일
│   └── claudeguide, vibecoding, test/  # 빌드 퍼블리싱 시 동적으로 컴파일되는 마크다운 컬렉션 폴더군
│
├── public/                     # 정적 리소스 및 로컬 빌드 결과물 경로 (git 제외)
│   ├── guides/                 # build-publish를 통해 렌더링된 가이드 HTML
│   ├── presentation/           # build-presentation을 통해 생성된 횡형 슬라이드 HTML
│   ├── showcase/               # 최신 숏코드 레퍼런스 가이드 HTML 및 PPTX 출력물
│   └── pptx/                   # md-to-pptx를 통해 생성된 Microsoft 파워포인트 파일
│
├── config/                     # 컴파일러 및 글로벌 디자인 설정 저장소
│   ├── styles.json             # 브랜드 컬러 프리셋 및 폰트 매핑 테이블 (Theme Manager와 연동)
│   ├── pptdesign.config.json   # PPTX 빌더 레이아웃(여백, 폰트크기 등) 세부 설정
│   └── htmldesign.config.json  # HTML 빌더 타이포그래피 설정
│
├── src/                        # 프론트엔드 React 소스
│   ├── pages/
│   │   ├── Index.tsx           # 가이드 허브 메인 대시보드 화면
│   │   └── Converter.tsx       # [핵심] 분할 화면 미리보기 가이드 변환기 & 에디터
│   ├── components/             # shadcn/ui 기반 프리미엄 UI 컴포넌트
│   ├── data/
│   │   └── guides.json         # 가이드북 카테고리 정보 및 순서 관리 (sync-guides 자동 갱신)
│   ├── main.tsx                # 가이드 허브 전체 진입점
│   ├── converter-main.tsx      # [단독] 독립형 가이드 변환기 전용 마운트 진입점
│   └── index.css               # 테마 변수 및 글로벌 스타일 정의
│
├── scripts/                    # [백엔드] 마크다운 변환 엔진 및 컴파일러 도구함
│   ├── pptx-renderers/         # [모듈화] 각 숏코드별 독립 PPTX 드로잉 렌더러 모듈 저장소
│   ├── build-guide.mjs         # 마크다운 ──> 반응형 가이드 HTML 렌더러 (Pre-line 및 가독성 표 스타일 내장)
│   ├── build-presentation.mjs  # 마크다운 ──> 횡 PPT형 HTML 슬라이드 병합 빌더 (바운싱 화살표 및 표 디자인 내장)
│   ├── build-publish.mjs       # 전체 퍼블리셔 (index 싱크 + 일괄 HTML 변환 + PPTX 생성 / standalone 갱신 최적화)
│   ├── build-standalone.mjs    # 단일 standalone.html 패키저 (Windows 락 프리 내장)
│   ├── sync-guides-index.mjs   # 마크다운 ──> guides.json 목록 싱크 및 순서 보존 유틸
│   ├── md-to-pptx.mjs          # 마크다운 ──> 실제 파워포인트(.pptx) 파일 변환기 CLI (오버플로우 방지 탑재)
│   └── vite-api-plugin.ts      # 로컬 웹 API 백엔드 모의 플러그인 (파일 저장/테마 저장 등 에디터 API 제공)
│
├── docs/                       # 상세 설계 문서 및 기능 가이드북
│   ├── backup/                 # [백업] 구버전 리드미 및 백업 문서 격리 공간
│   ├── convert-guide.md        # [신설] 가이드 변환기 & 에디터 상세 사용설명서
│   ├── guide-creation.md       # [필독] 29종 숏코드 명세 및 가이드 작성법
│   ├── scripts-guide.md        # 스크립트 도구 상세 레퍼런스
│   ├── shortcode-style-guide.md # 숏코드별 CSS/PPTX 튜닝 가이드
│   └── worklog.md              # 영구 누적 작업 기록 일지 (표준 위치)
│
├── index.html                  # 가이드 허브 메인 진입 HTML
├── converter.html              # [단독] 독립형 가이드 변환기 진입 HTML
├── package.json                # 프로젝트 의존성 및 NPM 실행 스크립트 정의
└── vite.config.ts              # Vite 멀티 인풋 컴파일러 환경 구성 파일
```

---

## 🛠️ 주요 NPM 단축 스크립트 레퍼런스

| 명령어 | 내부 기동 프로세스 | 설명 |
| :--- | :--- | :--- |
| **`npm run dev`** | `vite` | 가이드 허브 & 임베디드 에디터 실시간 개발 서버 가동 |
| **`npm run dev:converter`**| `vite --open converter.html` | **[신설]** 브라우저에서 독립형 가이드 변환기 전용 단독 실행 |
| **`npm run build`** | `build-publish` + `vite build` + `build-standalone` | 프로덕션 전체 컴파일 및 단일 standalone.html 출력 |
| **`npm run build:dev`** | `vite build --mode development` + `build-standalone` | 개발 모드 전체 컴파일 및 standalone.html 출력 |
| **`npm run build:converter`**| `vite build --mode development` | **[신설]** 독립형 가이드 변환기 전용 Vite 빌드 |
| **`npm run build:publish`** | `node scripts/build-publish.mjs` | 마크다운 ──> HTML 퍼블리싱 및 마스터 PPTX 일괄 생산 |
| **`npm run build:slide`** | `node scripts/build-presentation.mjs` | PPT형 횡 슬라이드 HTML 변합 빌더 실행 |
| **`npm run pptx:md`** | `node scripts/md-to-pptx.mjs` | 마크다운 문서를 실제 MS 파워포인트(.pptx) 파일로 변환 |
| **`npm run sync:guides`** | `node scripts/sync-guides-index.mjs` | 마크다운 Frontmatter를 읽어 `guides.json` 자동 색인 동기화 |
| **`npm run test`** | `vitest run` | 로컬 가이드 렌더러 및 파이프라인 유닛 테스트 가동 |

---

## 🔧 트러블슈팅 및 꿀팁
1. **에디터 저장 속도가 획기적으로 빨라진 이유**: 가이드 변환기에서 문서를 작성하고 가이드 허브에 추가 저장할 때 무겁게 돌던 standalone.html 빌드가 제거되어 1초 만에 저장이 끝납니다. 안심하고 저장 버튼을 누르셔도 됩니다.
2. **독립형 가이드 변환기 활용**: 웹 서버 구동 없이 변환 에디터만 단독 기동하여 마크다운을 HTML/PPTX로만 빌드하고 싶다면 `npm run dev:converter`를 적극 사용하세요.

---

## 📚 참고자료 및 연관 가이드

* [가이드 변환기 & 에디터 사용 가이드](docs/convert-guide.md) — 에디터 기능 및 단독 변환 저장 활용법.
* [숏코드 명세 및 가이드 작성법](docs/guide-creation.md) — 29종 숏코드의 마크다운 표현법과 주의점.
* [스크립트 도구 상세 레퍼런스](docs/scripts-guide.md) — 변환 엔진별 매개변수 및 횡 슬라이드 컴파일 제어법.
* [쇼케이스 스타일 상세 가이드](docs/shortcode-style-guide.md) — HSL 테마 매핑 구조 및 PPTX 튜닝 가이드.
* [작업 누적 기록 일지](docs/worklog.md) — 버전별 작업 일지 및 이력서.
