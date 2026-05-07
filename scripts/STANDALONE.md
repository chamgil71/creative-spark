# 발행 / 배포 흐름

이 프로젝트는 두 가지 형태로 배포됩니다.

## 1) React 앱 (Lovable 정적 호스팅)
- `npm run build` → `dist/` 생성 → Lovable Publish.
- 라우트
  - `/` 홈 (카테고리 + 시리즈 가이드)
  - `/guide/:slug` 단일 가이드
  - `/collection/:id` 시리즈 가이드 (예: `/collection/vibecoding`)

## 2) 단일 HTML 오프라인판 (`standalone.html`)
`public/guides/*.html` 과 `public/vibecoding/*.html` 을 하나의 파일로 묶어
인터넷 없이도 동작하는 단일 HTML로 만듭니다.

### 명령
```bash
npm run build:standalone        # public/standalone.html 갱신
npm run build                   # vite build + dist/standalone.html 자동 생성
```

### 자동 발견 규칙
- **카테고리 가이드**: `src/data/guides.json` 의 `categories[].guides[].file`
  로 지정된 `public/guides/<file>` 을 읽어 인라인 합칩니다.
- **시리즈(컬렉션)**: `src/data/guides.json` 의 `collections[]` 항목별로
  `public/<folder>/` 안의 모든 `*.html` 을 알파벳순 자동 스캔.
  - `<title>` 태그에서 part 제목 추출
  - `indexFile` 은 첫 항목("목차")으로 배치
  - 결과를 `public/<folder>/manifest.json` 으로 같이 출력 (런타임도 사용)

### 새 시리즈 추가 방법
1. `public/<my-series>/` 폴더 생성
2. 그 안에 HTML 파일들과 `<indexFile>.html` 1개 추가
3. `src/data/guides.json` 의 `collections[]` 에 항목 1줄 추가:
   ```json
   { "id":"my-series","label":"이름","description":"…","color":"#abcd12",
     "folder":"my-series","indexFile":"index.html" }
   ```
4. `npm run build:standalone` 실행

## 3) 백업본
- `public/standalone-guides-only.html`
  - 시리즈 가이드 추가 전 (가이드만) 시점의 standalone 사본
  - 빌드 스크립트와 무관하므로 자동 갱신되지 않음