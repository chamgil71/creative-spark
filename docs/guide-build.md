# 가이드 빌드 사용 설명서

이 문서는 `templates/` 폴더의 마크다운 → HTML 변환 시스템을 처음 쓰는 사람을 위한 자세한 안내서입니다.

---

## 0. 전체 그림

```
templates/
├── styles.json         ← 카테고리 색상 프리셋 (5종)
├── template.md         ← 새 가이드 작성용 빈 템플릿
├── build-guide.mjs     ← MD → HTML 변환기
├── README.md           ← 짧은 요약
└── guide-build.md      ← (이 문서) 자세한 사용 설명
```

가이드 한 편을 만들고 사이트에 노출시키는 흐름은 **3단계**입니다.

1. **`.md` 작성** — `templates/` 안에 작성
2. **변환 실행** — `node templates/build-guide.mjs ...` → `public/guides/*.html` 생성
3. **카탈로그 등록** — `src/data/guides.ts` 에 한 줄 추가 → 메뉴에 노출

---

## 1. 새 가이드 작성하기

### 1-1. 템플릿 복사
```bash
cp data/templates/template.md templates/MyGuide.md
```

### 1-2. Frontmatter 채우기

파일 맨 위 `---` 사이가 **frontmatter(메타데이터)** 입니다. 여기서 제목·스타일·뱃지 등을 지정합니다.

```yaml
---
title: ChatGPT 완전 활용 가이드      # 히어로의 큰 제목 (필수)
subtitle: OpenAI 대화형 AI 활용법    # 부제목 (선택)
style: ai-chat                       # 스타일 키 (필수, 아래 표 참고)
badge: BETA · 2025                   # 히어로 상단 작은 라벨 (선택)
logo: 🤖                             # 히어로 가운데 큰 아이콘/이모지 (선택)
stats:                               # 히어로 하단 통계 박스 (선택)
  - { value: "10M+", label: "사용자" }
  - { value: "Free", label: "시작 가능" }
  - { value: "한국어", label: "지원" }
footer: ⓒ 2025 My Org                # 푸터 텍스트 (선택, 기본값 자동 생성)
---
```

#### 사용 가능한 `style` 키

| 키 | 카테고리 | 메인 색 |
|----|---------|--------|
| `ai-chat` | AI 챗봇 & 어시스턴트 | 그린 `#10A37F` |
| `ai-dev` | AI 개발 도구 | 오렌지 `#D97757` |
| `knowledge` | 노트 & 지식 관리 | 퍼플 `#6366F1` |
| `productivity` | 생산성 유틸리티 | 블루 `#1565C0` |
| `creative` | 크리에이티브 AI | 마젠타 `#9B59B6` |

→ 컬러를 바꾸거나 6번째 스타일을 추가하려면 **`styles.json`** 만 편집하면 됩니다.

### 1-3. 본문 작성 (마크다운 규칙)

frontmatter 아래는 일반 마크다운입니다. 단, 헤딩 레벨이 시각 구조와 1:1로 매핑됩니다.

| 마크다운 | 변환 결과 | 비고 |
|---------|----------|------|
| `# 1. 시작하기` | **섹션** (왼쪽에 번호 박스) | 번호는 `1.` 처럼 적으면 그대로 사용, 안 적으면 자동 부여 |
| `## 설치 방법` | **카드 박스** + 카드 제목 | 한 섹션 안에 여러 카드 가능 |
| `### 윈도우의 경우` | 카드 내부 소제목 | |
| `**굵게** *기울임*` | 강조 | |
| `> 💡 팁입니다` | **팁 박스** (브랜드 색 배경) | 인용문이 자동 변환 |
| `` `inline code` `` | 인라인 코드 칩 | |
| ` ```bash ... ``` ` | **다크 코드 블록** | |
| `\| 표 \|` | **브랜드 색 헤더 표** | |
| `1. 항목` / `- 항목` | 숫자/불릿 리스트 | |
| `[링크](https://...)` | 브랜드 색 링크 | |
| `---` (빈 줄로 둘러싸기) | **섹션 종료** | 다음 `##` 부터 새 섹션 시작 |

#### 작성 예시

```markdown
# 1. 소개

## 이 도구는 무엇인가

ChatGPT는 OpenAI의 대화형 AI입니다.

- 자연어 대화
- 코드 생성
- 문서 요약

> 💡 무료 플랜으로도 충분히 사용할 수 있습니다.

## 요금제 비교

| 플랜 | 가격 | 모델 |
|-----|------|-----|
| Free | $0 | GPT-4o mini |
| Plus | $20 | GPT-4o, o1 |

# 2. 시작하기

## 가입 방법

1. [chatgpt.com](https://chatgpt.com) 접속
2. 이메일로 가입
3. 로그인 후 바로 사용

\`\`\`bash
# CLI에서도 사용 가능
npm install openai
\`\`\`
```

---

## 2. HTML로 변환하기

### 2-1. 기본 사용법
```bash
node templates/build-guide.mjs templates/MyGuide.md public/guides/MyGuide.html
```

### 2-2. 출력 경로 생략
두 번째 인자를 비우면 자동으로 `public/guides/<같은이름>.html` 로 저장됩니다.
```bash
node templates/build-guide.mjs templates/MyGuide.md
# → public/guides/MyGuide.html
```

### 2-3. 스타일 강제 지정
frontmatter의 `style:` 보다 우선합니다.
```bash
node templates/build-guide.mjs templates/MyGuide.md --style creative
```

### 2-4. 성공 메시지
```
✅ Built: public/guides/MyGuide.html  (style: ai-chat — AI 챗봇 (그린))
```

### 2-5. 자주 만나는 에러

| 에러 | 원인 | 해결 |
|-----|------|------|
| `Unknown style "xxx"` | `style:` 키가 styles.json에 없음 | 위의 5개 키 중 하나 사용 |
| `Usage: ...` | 입력 파일을 안 줌 | 첫 번째 인자에 `.md` 경로 |
| `ENOENT: no such file` | 경로 오타 | 파일 존재 확인 |
| frontmatter 파싱 실패 | YAML 들여쓰기 오류 | 위 예시처럼 공백 2칸 사용 |

---

## 3. 사이트 메뉴에 노출시키기

`public/guides/`에 HTML이 생겼다고 자동으로 메뉴에 뜨지는 않습니다. **`src/data/guides.ts`** 에 등록해야 합니다.

해당 카테고리의 `guides:` 배열에 한 줄 추가:

```ts
{
  id: "ai-chat",
  ...
  guides: [
    ...,
    {
      slug: "myguide",         // URL 경로 (영문 + 하이픈)
      title: "My Guide",       // 카드 제목
      subtitle: "한 줄 설명",  // 카드 부제목
      file: "MyGuide.html",    // public/guides/ 안의 파일명 (정확히 일치)
    },
  ],
},
```

저장하면 dev 서버가 자동 리로드되고 카드가 메뉴에 나타납니다.

---

## 4. 색상/디자인 커스터마이징

### 4-1. 기존 스타일의 색만 바꾸기
`config/styles.json` 에서 해당 키의 값을 수정 → 영향받는 모든 가이드를 재변환.

```json
"ai-chat": {
  "brand": "#10A37F",          ← 이 값만 바꿔도 OK
  "brandDark": "#0D8065",
  "brandLight": "#E6F4F0",
  "heroGradient": "linear-gradient(135deg, ... )"
}
```

### 4-2. 새 스타일 추가
`styles.json` 에 새 키를 추가하면 즉시 `--style <키>` 또는 frontmatter에서 사용 가능.

```json
"finance": {
  "label": "금융 (네이비)",
  "brand": "#1E3A8A",
  "brandDark": "#1E40AF",
  "brandDeep": "#172554",
  "brandLight": "#EFF6FF",
  "brandMid": "#93C5FD",
  "border": "#DBEAFE",
  "bg": "#F8FAFC",
  "heroGradient": "linear-gradient(135deg, #0A0F1E 0%, #172554 50%, #1E3A8A 100%)"
}
```

### 4-3. 레이아웃/구조 자체 변경
카드·히어로의 HTML 골격은 `build-guide.mjs` 안의 템플릿 문자열에 있습니다. 거기를 수정하면 모든 가이드가 동일하게 바뀝니다.

---

## 5. 일괄 재빌드 (참고)

여러 .md 파일을 한 번에 변환하려면 쉘 한 줄로 가능:

```bash
for f in templates/*.md; do
  [ "$(basename "$f")" = "template.md" ] && continue
  [ "$(basename "$f")" = "guide-build.md" ] && continue
  [ "$(basename "$f")" = "README.md" ] && continue
  node templates/build-guide.mjs "$f"
done
```

---

## 6. 체크리스트 (배포 전)

- [ ] frontmatter의 `title`, `style` 채웠나
- [ ] `style:` 키가 styles.json에 존재하나
- [ ] 본문 최상위 헤딩이 `#` 한 개인가 (`##`로 시작하면 첫 섹션이 빠짐)
- [ ] 변환 후 `public/guides/*.html` 가 생성됐나
- [ ] `src/data/guides.ts` 에 등록했나 (slug, file 이름 정확)
- [ ] 브라우저에서 카드 클릭 → 가이드가 정상 로드되나