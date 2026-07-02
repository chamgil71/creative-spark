# creative-spark 사양서 (spec.md)

> [!IMPORTANT]
> 본 사양서는 개발 요구사항 및 설계의 **닻(anchor)**입니다.
> 에이전트 단독으로 수정할 수 없으며, 변경 시 반드시 사용자의 사전 승인을 받아야 합니다.
> 상세 빌드·설계 컨텍스트는 [`../CLAUDE.md`](../CLAUDE.md)를 우선 참조합니다.
> 아래 `TODO` 표시 구간은 초기 골격이며, 실제 값은 사용자 확정 후 채웁니다.

## 1. 개요 및 목적
- **비즈니스 배경**: AI 도구 가이드 문서를 마크다운으로 편집하고 여러 배포 포맷으로 일관되게 발행하고 싶다.
- **해결하려는 문제**: 하나의 숏코드 마크다운 원본을 가이드 HTML·횡슬라이드 HTML·PPTX·오프라인 단일 HTML로 자동 번들링한다.
- **최종 목표**: 콘텐츠(마크다운)와 표현(렌더러·테마)을 분리하여, 같은 입력으로 다중 포맷을 재현 가능하게 생성한다.

## 2. 세부 요구사항 및 범위
- **기능 요구사항** (README 기준 시드 — 상세화 TODO):
  - F-1: 숏코드 마크다운(`md_src/`) → 가이드 HTML 빌드(`scripts/build-guide.mjs`)
  - F-2: 횡슬라이드 프레젠테이션 HTML 빌드(`scripts/build-presentation.mjs`)
  - F-3: PPTX 생성(`scripts/md-to-pptx.mjs`)
  - F-4: React 웹 리더 및 독립 변환기(`converter.html`), 오프라인 단일 HTML 번들
  - F-5: _TODO — 추가 기능 요구사항_
- **비기능 요구사항**:
  - 단일 출처: 수치·색상·폰트는 `config/`에서만 로드(하드코딩 금지, 상세는 CLAUDE.md)
  - 타입 안전성: TypeScript strict, React 18+ 함수형 컴포넌트
  - 품질: 핵심 로직 vitest 커버

## 3. 시스템 아키텍처 및 설계
- **데이터 흐름**: `md_src(숏코드 MD)` → `scripts 빌더(정본 렌더러)` → `public/dist(HTML·PPTX)`
- **렌더러 정본**: 숏코드 렌더링/스타일은 단일 모듈 재사용(중복 금지)
- **config 스키마**: _TODO — 디자인/스타일 config 키 명세 (CLAUDE.md 연계)_

## 4. 검증 계획
- **테스트 시나리오**: 샘플 마크다운으로 3개 포맷 빌드 무결성 및 스냅샷 확인
- **검증 명령**:
  ```bash
  npm run test
  npm run build
  node scripts/build-guide.mjs md_src/<path>.md
  ```
- **기대 성공 지표**: vitest 통과 + 3포맷 빌드 성공. 합격선 _TODO_.
