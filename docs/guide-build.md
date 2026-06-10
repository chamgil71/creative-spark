# 가이드 빌드 사용 설명서

이 문서는 `md_src/`의 Markdown 원본을 `public/` 서비스 산출물로 변환하는 현재 빌드 흐름을 설명합니다.

---

## 0. 전체 그림

```
md_src/guides/*.md
      │
      ├── npm run sync:guides
      │       └── src/data/guides.json 갱신
      │
      ├── node scripts/build-guide.mjs
      │       └── public/guides/*.html 생성
      │
      └── node scripts/md-to-pptx.mjs
              └── dist-pptx/*.pptx 생성
```

`public/`은 임시 폴더가 아니라 실제 웹 서비스와 프레젠테이션에 쓰이는 생성 산출물 관리 영역입니다. 원본은 `md_src/`, 변환기는 `scripts/`, 서비스 산출물은 `public/`에 둡니다.

---

## 1. 새 가이드 작성하기

`md_src/guides/MyGuide.md` 파일을 새로 만들고 frontmatter를 채웁니다. 기존 가이드를 복사해 제목, 스타일, 본문을 바꾸는 방식이 가장 안전합니다.

```yaml
---
title: My Guide
subtitle: 한 줄 설명
style: ai-chat
badge: AI · 2026
logo: 🤖
stats:
  - { value: "29종", label: "숏코드" }
  - { value: "HTML", label: "웹 산출물" }
---
```

주요 `style` 키는 `ai-chat`, `ai-dev`, `webdev`, `knowledge`, `productivity`, `creative`, `security`, `finance`, `future`, `enterprise`, `media`입니다. 스타일 색상은 `config/styles.json`에서 관리합니다.

---

## 2. HTML로 변환하기

### 단일 파일

```bash
node scripts/build-guide.mjs md_src/guides/MyGuide.md
```

출력 경로를 생략하면 `public/guides/MyGuide.html`로 저장됩니다.

### 출력 경로 지정

```bash
node scripts/build-guide.mjs md_src/guides/MyGuide.md public/guides/MyGuide.html
```

### 스타일 강제 지정

```bash
node scripts/build-guide.mjs md_src/guides/MyGuide.md --style creative
```

---

## 3. 목록 동기화

가이드 목록은 `src/data/guides.json`에서 읽습니다. 새 Markdown을 추가했거나 frontmatter 기반 분류를 갱신하려면 다음을 실행합니다.

```bash
npm run sync:guides
```

이 명령은 기존 `guides.json`의 카테고리 순서와 수동 메타데이터를 최대한 보존하면서 신규 파일을 추가합니다.

---

## 4. 전체 퍼블리시

모든 가이드, 시리즈, 쇼케이스 산출물을 갱신하려면 다음을 사용합니다.

```bash
npm run build:publish
```

주요 결과물:

| 산출물 | 설명 |
|------|------|
| `public/guides/*.html` | 개별 가이드 HTML |
| `public/vibecoding/*.html` | 시리즈 HTML |
| `public/showcase/showcase.html` | 숏코드 쇼케이스 HTML |
| `public/showcase/showcase.pptx` | 쇼케이스 PPTX |
| `public/standalone.html` | 로컬용 통합 단일 HTML |

---

## 5. PPTX 변환

Markdown을 실제 PPTX 파일로 변환할 때는 `md-to-pptx.mjs`를 사용합니다.

```bash
node scripts/md-to-pptx.mjs md_src/guides/MyGuide.md
node scripts/md-to-pptx.mjs --all "md_src/guides/*.md"
```

현재 PPTX 렌더러는 HTML 렌더러보다 지원 범위가 좁을 수 있습니다. 미지원 숏코드는 변환 로그에 경고로 표시되며, 누락 여부를 확인한 뒤 필요한 숏코드부터 구현합니다.

---

## 6. 전체 빌드

React 앱, `public/` 산출물, standalone 최종 파일까지 한 번에 만들려면 다음을 실행합니다.

```bash
npm run build
```

결과:

| 위치 | 용도 |
|------|------|
| `public/` | 웹 서비스와 프레젠테이션용 생성 산출물 |
| `dist/` | Vite 프로덕션 빌드 |
| `dist/standalone.html` | 배포용 단일 HTML |

---

## 7. 체크리스트

- [ ] Markdown 원본이 `md_src/guides/` 또는 시리즈별 `md_src/<series>/`에 있는가
- [ ] frontmatter의 `title`, `subtitle`, `style`이 의도대로 작성됐는가
- [ ] 숏코드는 현행 이름(`cmd-box`, `compare-split`, `workflow-flow`, `faq-list`, `console-box`, `stat-grid`)을 쓰는가
- [ ] `npm run sync:guides`로 `src/data/guides.json`이 갱신됐는가
- [ ] `npm run build:publish` 후 `public/` 산출물이 갱신됐는가
- [ ] PPTX가 필요한 경우 `md-to-pptx.mjs` 경고 로그를 확인했는가
