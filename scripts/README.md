# scripts/ — 프레젠테이션 & 가이드 빌드 스크립트

프로젝트의 마크다운(MD) 가이드를 HTML 프레젠테이션 및 PowerPoint(.pptx) 파일로 컴파일하고 빌드하기 위한 Node.js CLI 스크립트 모음입니다.

> [!NOTE]
> 기존에 사용되던 HTML ──> MD 역변환 및 실험적 HTML ──> PPTX 체인 변환기 스크립트(`html-to-md.mjs`, `html-to-pptx.mjs`, `restore-md-from-html.mjs`)들은 현재 파이프라인에서 불필요해짐에 따라 [docs/backup/](file:///c:/ai/creative-spark/docs/backup/) 디렉토리로 백업 이동되었습니다.

---

## 주요 스크립트 목록

### 1) 마크다운 ──> PPTX 변환기 (`scripts/md-to-pptx.mjs`)
마크다운 소스(`md_src/`) 파일을 PowerPoint 슬라이드(.pptx)로 정밀 변환합니다.

```bash
# md-to-pptx 실행 (package.json script)
npm run pptx:md
```

### 2) 프레젠테이션 빌더 (`scripts/build-presentation.mjs`)
마크다운 가이드를 슬라이드용 HTML 프레젠테이션 형태로 빌드합니다. 단독 화살표 세퍼레이터 파싱 및 슬라이드 전용 표 스타일을 렌더링합니다.

```bash
npm run build:slide
```

### 3) 독립 실행형 번들러 (`scripts/build-standalone.mjs`)
웹 가이드 변환기를 오프라인 및 독립 단독 실행이 가능한 단일 `standalone.html` 파일로 컴파일합니다.

```bash
npm run build:standalone
```

### 4) 가이드 문서 동기화기 (`scripts/sync-guides-index.mjs`)
제작된 다양한 가이드 문서 목록을 에디터와 뷰어에 바인딩할 수 있도록 메타데이터(`guides.json`)를 동기화 생성합니다.

```bash
npm run sync:guides
```

---

## 파일 구조

```
scripts/
  ├── build-presentation.mjs        # 슬라이드 쇼 HTML 컴파일러
  ├── build-group-presentation.mjs  # 그룹 슬라이드 빌더
  ├── build-standalone.mjs          # 단일 HTML standalone 패키징 도구
  ├── build-publish.mjs             # 최종 배포용 빌더
  ├── md-to-pptx.mjs                # 마크다운 ──> PPTX 변환기
  ├── sync-guides-index.mjs         # 가이드 메타데이터 빌더
  ├── vite-api-plugin.ts            # 개발서버 API 미들웨어 플러그인
  ├── pptx-renderers/               # PPTX 상세 렌더러 컴포넌트 폴더
  └── README.md                     # 이 파일
```

