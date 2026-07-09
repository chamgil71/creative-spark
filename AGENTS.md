# AGENTS.md — creative-spark

Markdown → HTML 가이드 / 횡슬라이드 HTML / PPTX 자동 생성 콘텐츠 엔진 (Node/React/Vite). 이 문서는 이 레포에서 AI 에이전트 작업의 **최상위 진입점(SSOT)**입니다.

- **적용 프로필**: `standard` — [`agent/profiles/standard.md`](./agent/profiles/standard.md)
- **오케스트레이션**: [`agent/orchestration.md`](./agent/orchestration.md)의 라우팅·의존성·롤백 규칙을 따릅니다.
- **거버넌스 엔진**: 구현/검증 패턴이 필요할 때 [`agent/knowledge/`](./agent/knowledge/)를 `view_file`로 읽어 적용합니다.

## 문서 우선순위 (CLAUDE.md 공존)

- 이 레포에는 프로젝트 전용 컨텍스트 [`CLAUDE.md`](./CLAUDE.md)가 이미 존재합니다.
- **역할 분리**: `AGENTS.md`(본 문서)는 거버넌스·프로필·오케스트레이션 **진입점**, `CLAUDE.md`는 프로젝트 고유의 빌드 명령·아키텍처 컨텍스트입니다. 두 문서가 상충하면 프로젝트 고유 규칙([`CLAUDE.md`](./CLAUDE.md))을 우선합니다.

## Facts (무엇을 만드는가)

- 사양·설계의 1차 앵커는 [`docs/spec.md`](./docs/spec.md)입니다. 빌드 명령·프로젝트 컨텍스트는 [`CLAUDE.md`](./CLAUDE.md)·[`README.md`](./README.md)를 우선 참조합니다.
- 세션 진행 로그는 [`docs/worklog.md`](./docs/worklog.md)에 누적합니다.

## Project Shape

- `md_src/` — 숏코드 마크다운 원본 / `scripts/` — 빌더(`build-guide.mjs`, `build-presentation.mjs`, `md-to-pptx.mjs`)
- `src/`, `public/`, `converter.html` — React 웹 리더 / 독립 변환기
- `config/` — 디자인·스타일·숏코드 설정 (단일 출처)

## Local Rules

- 수치·색상·폰트 등은 렌더러에 직접 박지 않고 `config/` 단일 출처에서 읽습니다(상세는 [`CLAUDE.md`](./CLAUDE.md)).
- 숏코드 렌더링 로직 중복을 금지하고 정본 모듈을 재사용합니다.
- TypeScript strict, React 18+ 함수형 컴포넌트 준수. 단일 파일 200라인 초과 시 분리.

## Verification

```bash
npm run test        # vitest
npm run build       # Vite 번들
node scripts/build-guide.mjs md_src/<path>.md   # 개별 빌더 확인
```

실행 불가 시 정확한 사유를 보고합니다.
