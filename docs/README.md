# Creative Spark — 프로젝트 문서

> 최종 업데이트: 2026-05-13

## 개요

AI 도구 가이드를 작성·변환·배포하는 파이프라인 프로젝트.  
**Markdown → HTML**, **Markdown → PPTX** 두 출력 경로를 JSON 설정 파일 기반으로 운영한다.  
18종 shortcode, 10가지 색상 프리셋 지원.

---

## 파이프라인 요약

```
[HTML 기존 가이드]
      │
      │ templates/html-to-md.mjs  (HTML → MD 역변환)
      ▼
[mddata/*.md]  ←──── 콘텐츠 원본 (표준 작성 위치)
      │
      ├─── templates/build-guide.mjs ──→ public/guides/*.html
      │                                        │
      │                                        └─→ (브라우저 뷰어 / 배포)
      │
      └─── scripts/md-to-pptx.mjs ──→ dist-pptx/*.pptx
```

---

## 디렉토리 구조

| 경로 | 역할 |
|------|------|
| `config/` | **공통 설정 JSON** (styles, shortcode-map, pptdesign) |
| `data/mddata/` | 가이드 Markdown 원본 (콘텐츠 작업 위치) |
| `data/templates/` | 새 가이드 작성용 MD 템플릿 (template.md, showcase.md) |
| `data/test/` | 변환 테스트용 HTML 원본 |
| `templates/` | HTML 파이프라인 스크립트 (build-guide, html-to-md) |
| `scripts/` | PPTX/빌드 파이프라인 스크립트 |
| `public/guides/` | 서비스용 HTML (빌드 산출물) |
| `dist-pptx/` | PPTX 변환 산출물 |
| `src/` | React 웹앱 소스 |
| `docs/` | 프로젝트 문서 (이 폴더) |
| `data/temp/` | 미완성·미사용 스크립트 보관 |

---

## 핵심 설정 파일

| 파일 | 용도 |
|------|------|
| `config/styles.json` | 카테고리별 색상 프리셋 (10종) |
| `config/pptdesign.config.json` | PPTX 레이아웃·여백·폰트 수치 설정 |
| `data/templates/template.md` | 새 가이드 작성 템플릿 |

---

## 문서 목차

- [guide-creation.md](guide-creation.md) — 가이드 제작 전체 워크플로우 (MD 작성 → HTML/PPTX → 배포)
- [pipeline.md](pipeline.md) — 파이프라인 상세 + shortcode 레퍼런스
- [scripts-guide.md](scripts-guide.md) — 각 스크립트 사용법
- [standalone.md](standalone.md) — Standalone HTML 빌드 방법
- [test-html-analysis.md](test-html-analysis.md) — test/ HTML 분석: 기존 shortcode 치환 목록 & 신규 shortcode 설계
