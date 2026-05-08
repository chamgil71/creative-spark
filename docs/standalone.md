# Standalone HTML 빌드

인터넷 없이 열 수 있는 단일 HTML 파일(`public/standalone.html`)을 생성하는 방법을 설명합니다.

---

## 명령

```bash
npm run build:standalone        # public/standalone.html 갱신
npm run build                   # vite build + dist/standalone.html 자동 생성
```

---

## 렌더링 방식

- 왼쪽 메뉴와 상단바는 standalone 셸이 담당합니다.
- 각 가이드 본문은 **Shadow DOM** 안에 렌더링해 가이드별 CSS가 셸 UI를 오염시키지 않도록 합니다.
- 기본 테마는 라이트 모드이며, 사용자가 전환한 테마는 브라우저 `localStorage`에 저장됩니다.
- 원본 HTML의 `.back-top`, `#backTop`, `footer`는 삽입 시 제거됩니다.
- 인쇄/PDF 출력 시 상단바·좌측 메뉴·이전/다음 버튼은 자동 숨김, 본문 전체 출력됩니다.

---

## 자동 발견 규칙

`scripts/build-standalone.mjs`가 `src/data/guides.json`을 읽어 콘텐츠를 수집합니다.

**카테고리 가이드**: `categories[].guides[].file` → `public/guides/<file>` 인라인 삽입

**시리즈(컬렉션)**: `collections[]` 항목별로 `public/<folder>/` 안의 모든 `*.html`을 알파벳순 자동 스캔
- `<title>` 태그에서 part 제목 추출
- `indexFile`은 첫 항목("목차")으로 배치
- 결과를 `public/<folder>/manifest.json`으로 출력 (런타임도 사용)

---

## 새 단일 가이드 추가

1. `mddata/MyGuide.md` 작성 (`templates/template.md` 복사)
2. HTML 변환
   ```bash
   node templates/build-guide.mjs mddata/MyGuide.md public/guides/MyGuide.html
   ```
3. `src/data/guides.json`의 적절한 카테고리 `guides[]`에 등록
4. standalone 갱신
   ```bash
   npm run build:standalone
   ```

자세한 가이드 제작 방법: [docs/guide-creation.md](guide-creation.md)

---

## 새 시리즈(컬렉션) 추가

1. `public/<my-series>/` 폴더 생성
2. 그 안에 HTML 파일들과 `<indexFile>.html` 1개 추가
3. `src/data/guides.json`의 `collections[]`에 항목 추가:
   ```json
   {
     "id": "my-series",
     "label": "이름",
     "description": "설명",
     "color": "#abcd12",
     "folder": "my-series",
     "indexFile": "index.html"
   }
   ```
4. `npm run build:standalone` 실행

---

## 배포 형태

| 형태 | 명령 | 출력 |
|------|------|------|
| React 앱 | `npm run build` | `dist/` → Lovable Publish |
| Standalone | `npm run build:standalone` | `public/standalone.html` |
| Standalone (배포용) | `npm run build` | `dist/standalone.html` (자동 포함) |
