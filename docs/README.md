# Creative Spark — 프로젝트 문서

> 최종 업데이트: 2026-05-28

## 개요

AI 도구 가이드를 작성·변환·배포하는 파이프라인 프로젝트.  
**Markdown → HTML**, **Markdown → PPTX** 두 출력 경로를 JSON 설정 파일 기반으로 운영한다.  
29종 shortcode (26종 고유, aliases 포함), 11가지 색상 프리셋 지원.

---

## 파이프라인 요약

```
[HTML 기존 가이드]
      │
      │ scripts/html-to-md.mjs  (HTML → MD 역변환)
      ▼
[md_src/guides/*.md]  ←──── 콘텐츠 원본 (표준 작성 위치)
      │
      ├─── scripts/sync-guides-index.mjs  ──→ (guides.json 자동 업데이트)
      │
      ├─── scripts/build-publish.mjs
      │         ├─── scripts/build-guide.mjs ──→ public/guides/*.html
      │         └─── (PPTX 슬라이드 자동 생성)
      │
      └─── scripts/build-standalone.mjs   ──→ dist/standalone.html (오프라인 1파일)
```

---

## 디렉토리 구조

| 경로 | 역할 |
|------|------|
| `config/` | **공통 설정 JSON** (styles, shortcode-map, pptdesign) |
| `md_src/guides/` | 가이드 Markdown 원본 (콘텐츠 작성 위치) |
| `md_src/vibecoding/` | 시리즈 컬렉션 Markdown 원본 |
| `md_src/showcase/` | 쇼케이스 문서 및 PPTX 생성 소스 |
| `scripts/` | 핵심 변환기(build-guide, build-presentation 등), Standalone, 동기화 스크립트 일체 |
| `public/guides/` | 빌드된 HTML 가이드 저장 위치 (배포 소스) |
| `public/presentation/` | 빌드된 PPT형 횡 슬라이드 HTML 저장 위치 [NEW] |
| `public/standalone.html` | 로컬 빌드용 단일 파일 standalone.html |
| `dist/` | React 앱 빌드 및 최종 배포용 `standalone.html` |
| `dist-pptx/` | 개별 MD → PPTX 변환 산출물 |
| `src/` | React 웹앱 소스 (메인 페이지 등) |
| `storage/` | 각종 코드/PPT 백업, 임시 리소스 및 `scratch/` 보관함 [NEW] |
| `docs/` | 프로젝트 가이드 및 지침 문서 (이 폴더) |

---

## 핵심 설정 파일

| 파일 | 용도 |
|------|------|
| `config/styles.json` | 카테고리별 색상 프리셋 (11종) |
| `config/pptdesign.config.json` | PPTX 레이아웃·여백·폰트 수치 설정 |
| `md_src/showcase/showcase.md` | 다양한 단 구조 및 29종 숏코드 문법 참조 원본 |

---

## 문서 목차

### 가이드 문서
- [guide-creation.md](guide-creation.md) — 29종 숏코드 명세 및 가이드 작성 워크플로우
- [guide-build.md](guide-build.md) — Frontmatter 및 스타일 프리셋 가이드
- [scripts-guide.md](scripts-guide.md) — `scripts/` 내 도구 상세 사용법 및 프레젠테이션 빌더
- [pipeline.md](pipeline.md) — 파이프라인 상세 + shortcode 레퍼런스
- [standalone.md](standalone.md) — Standalone HTML 번들링 매커니즘
- [shortcode-style-guide.md](shortcode-style-guide.md) — 숏코드별 CSS/PPTX 디자인 튜닝 가이드
- [marp-comparison.md](marp-comparison.md) — Marp 프레젠테이션 엔진과 Creative Spark 비교 및 연동 가이드

### 참고 문서 (서브폴더)
- [plan/](plan/) — 기획 및 분석 문서
- [prompt/](prompt/) — AI 가이드 생성용 프롬프트 템플릿
- [report/](report/) — 검토 보고서 및 작업 이력
  - [standalone-integrity-report.md](report/standalone-integrity-report.md) — Shadow DOM 정합성 검증 결과
  - [project-review-2026-05-28.md](report/project-review-2026-05-28.md) — 프로젝트 현황 검토 보고서
  - [current-state-review-2026-06-04.md](report/current-state-review-2026-06-04.md) — 문서 현행화·계획 대비 잔여·코드 위험 분석
  - worklog.md — 영구 누적 작업 기록 일지
