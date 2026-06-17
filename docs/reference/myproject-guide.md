# 내 프로젝트 운영 가이드

> 2026-06 기준. `c:\ai\` 하위 프로젝트 전체를 도메인별로 정리한 운영 참조 문서.

---

## 목차

1. [프로젝트 전체 맵](#1-프로젝트-전체-맵)
2. [웹 서비스 & 대시보드](#2-웹-서비스--대시보드)
3. [AI 자동화 파이프라인](#3-ai-자동화-파이프라인)
4. [데이터 처리 엔진](#4-데이터-처리-엔진)
5. [엔터프라이즈 솔루션 (company)](#5-엔터프라이즈-솔루션-company)
6. [콘텐츠 빌더 — creative-spark](#6-콘텐츠-빌더--creative-spark)
7. [공통 인프라 & 운영](#7-공통-인프라--운영)

---

## 1. 프로젝트 전체 맵

### 1-1. 도메인별 분류

| 프로젝트 | 도메인 | 주요 스택 | 배포 | 경로 |
|----------|--------|-----------|------|------|
| **pjtoverview** | R&D 과제 관리 | Python + React | Vercel | `c:\ai\pjtoverview` |
| **mywiki** | 개인 지식 창고 | Obsidian + Quartz v4 | Vercel + GitHub Pages | `c:\ai\mywiki` |
| **clearsurvey** | 설문 정제·대시보드 | Python + FastAPI + React/Vite | 로컬/정적 | `c:\ai\clearsurvey` |
| **dailynews** | AI 뉴스 자동화 | Python + Gemini/Claude | Vercel + GitHub Actions | `c:\ai\dailynews` |
| **weeklyreport** | 주간보고서 자동화 | Python + YAML | 로컬/GitHub | `c:\ai\weeklyreport` |
| **BudgetN** | 정부예산 파이프라인 | Python + PDF/XLSX | GitHub Pages | `c:\ai\BudgetN` |
| **doc-analysis** | 기밀문서 분석 | Python (완전 로컬) | 로컬 전용 | `c:\ai\doc-analysis` |
| **companypool** | 기업 마스터 DB | Python ETL | 로컬 | `c:\ai\company\companypool` |
| **convertertools** | 문서 형식 변환 | Python (IRBlock) | 로컬 | `c:\ai\company\convertertools` |
| **filetools** | 파일 관리·무결성 | Python + Streamlit | 로컬 | `c:\ai\company\filetools` |
| **creative-spark** | 슬라이드 빌더 | Node.js + Vite + React | 로컬 | `c:\ai\creative-spark` |

### 1-2. 기술 스택 분포

| 언어/프레임워크 | 해당 프로젝트 |
|----------------|--------------|
| **Python 3.10+** | pjtoverview, BudgetN, clearsurvey, dailynews, weeklyreport, doc-analysis, companypool, convertertools, filetools |
| **React + Vite** | pjtoverview(프론트), clearsurvey(프론트), creative-spark |
| **Node.js** | creative-spark(빌드 엔진), mywiki(Quartz) |
| **FastAPI** | clearsurvey |
| **GitHub Actions** | dailynews(7개 워크플로우), BudgetN, pjtoverview |

### 1-3. 배포 현황

```
Vercel
├── pjtoverview      https://pjtoverview.vercel.app
├── mywiki           https://mywiki-khaki.vercel.app  (주)
└── dailynews        https://ms-dailynews.vercel.app

GitHub Pages
├── mywiki           https://chamgil71.github.io/mywiki  (백업)
└── BudgetN          GitHub Actions → web/dist 자동 배포

로컬 전용 (외부 미노출)
├── clearsurvey      localhost (FastAPI + React)
├── doc-analysis     보안 원칙: 외부 API 전송 금지
├── company/*        로컬 Python 실행
└── weeklyreport     로컬 Python + 선택적 GitHub 발행
```

---

## 2. 웹 서비스 & 대시보드

### 2-1. pjtoverview — R&D 과제 통합 관리

**한 줄 요약**: XLSX 4개 시트 → Python 7단계 파이프라인 → JSON → React 대시보드 → Vercel 정적 배포

**배포 URL**: `https://pjtoverview.vercel.app` | GitHub: `chamgil71/pjtoverview`

**주요 기능**

| 기능 | 설명 |
|------|------|
| 데이터 파이프라인 | XLSX 추출 → 정규화 → 집계 → 유사도 분석 → 계층 매핑 → 연도별 분할 |
| KPI 대시보드 | KPI 카드 5종, 연도별 트렌드, 본부별·재원별 차트 |
| 과제 목록 | 멀티 필터, AND/OR 검색, 슬라이드 패널 상세 보기 |
| 유사도 분석 | 과제명 TF-IDF 교차 분석, 3-way 비교 팝업 |
| 예산 검증 | 사업총괄 / 과제총괄 / 수행기관 3자 교차 검증 |
| 기업 이력 | 특정 기업의 연도별 참여 과제 이력 조회 |

**디렉토리 구조**

```
pjtoverview/
├── pipeline/           # Python 파이프라인 (Step 1~7)
│   ├── cli.py          # 전체 실행 진입점
│   ├── extractor.py    # XLSX → 중첩 JSON
│   ├── normalizer.py   # 법인명·날짜·금액 정규화
│   ├── aggregator.py   # KPI·필터 집계
│   ├── analyzer.py     # TF-IDF 유사도
│   ├── mapper.py       # 계층 통합 + 예산 검증
│   └── splitter.py     # 연도별 분할 + public/data 복사
├── config/
│   ├── paths.py        # 경로·시트명 매핑
│   └── aggregation.yaml
├── frontend/           # React 대시보드 (Vite)
└── storage/            # XLSX 입력, JSON 출력
```

**빠른 시작**

```powershell
# 1. 파이프라인 실행 (XLSX → JSON 생성)
cd c:\ai\pjtoverview
python pipeline/cli.py --input storage/input.xlsx

# 2. 프론트엔드 개발 서버
cd frontend && npm run dev

# 3. Vercel 배포 (빌드 후 자동 배포)
npm run build
```

---

### 2-2. mywiki — 개인 지식 창고

**한 줄 요약**: Obsidian에서 작성한 노트 중 `publish: true` 표시된 것만 Quartz v4로 빌드해 Vercel과 GitHub Pages에 이중 배포

**배포 URL** | GitHub: `chamgil71/mywiki`

| 환경 | URL |
|------|-----|
| Vercel (주) | https://mywiki-khaki.vercel.app |
| GitHub Pages (백업) | https://chamgil71.github.io/mywiki |

**구조 및 흐름**

```
[Obsidian 노트 작성]
    ↓ publish: true 설정
[content/ 폴더에 저장]
    ↓ npx quartz build
[Quartz v4 빌드]
    ↓ GitHub push
[GitHub Actions → GitHub Pages 자동 배포]
    ↓ Vercel 연동
[Vercel 자동 배포]
```

**주요 설정 파일**

| 파일 | 역할 |
|------|------|
| `quartz.config.ts` | 사이트 제목·테마·플러그인 설정 |
| `quartz.layout.ts` | 레이아웃 컴포넌트 구성 |
| `content/` | 노트 원본 (마크다운) |
| `deploy.ps1` | Vercel 배포 스크립트 |
| `index_md.py` | 노트 인덱스 자동 생성 |

**빠른 시작**

```powershell
cd c:\ai\mywiki

# 로컬 미리보기
npx quartz build --serve

# 배포 (GitHub push → Actions 자동 실행)
git add . && git commit -m "update notes" && git push
```

---

### 2-3. clearsurvey — 설문 데이터 정제 & 대시보드

**한 줄 요약**: 설문·행정 원본 XLSX를 1-Click으로 정밀 정제하고 엑셀 요약 보고서와 React 대시보드로 발행하는 풀스택 플랫폼

**GitHub**: `chamgil71/clearsurvey`

**운영 모드**

| 모드 | 설명 |
|------|------|
| 정적 모드 | 백엔드 없이 demo JSON 파싱 → 차트·PDF/CSV 기능 동작 |
| 풀스택 모드 | FastAPI 연동 → 파일 업로드·컬럼 매핑·실시간 정제 파이프라인 |

**주요 기능**

| 기능 | 설명 |
|------|------|
| 컬럼 정의 시트 | 10열 드롭다운으로 변환 규칙(20여 종) 마우스 클릭 설정 |
| 1-Click 정제 | SurveyPipeline 실행 → 결측치 보정·주소 분할·마스킹 처리 |
| 엑셀 보고서 | openpyxl + Slicer XML 패치로 2단 요약 스탯 렌더링 |
| 대시보드 빌더 | KPI·Donut·Bar·Hbar·Histogram·Multibar 비주얼 설정 |
| 실시간 로그 | SSE로 정제 진행 상황 스트리밍 |

**디렉토리 구조**

```
clearsurvey/
├── app/                # FastAPI 라우터
├── engine/             # 정제 파이프라인 엔진
│   └── SurveyPipeline.py
├── config/             # 프로젝트별 config.yaml
├── projects/           # 프로젝트별 데이터 격리
├── web/                # React/Vite 프론트엔드
└── storage/            # 입출력 데이터
```

**빠른 시작**

```powershell
cd c:\ai\clearsurvey

# 백엔드
pip install -r requirements.txt
python main.py

# 프론트엔드 (별도 터미널)
cd web && npm run dev
```

---

## 3. AI 자동화 파이프라인

### 3-1. dailynews — AI 뉴스 자동 브리핑

**한 줄 요약**: RSS 수집 → Gemini/Claude AI 분석 → 웹 대시보드 + 이메일 뉴스레터 + 텔레그램 + 카드뉴스를 완전 자동으로 발행하는 서버리스 3채널 시스템

**배포 URL**: `https://ms-dailynews.vercel.app` | GitHub: `chamgil71/dailynews`

**3채널 구조**

| 채널 | 수집 트리거 | 배포 | 발송 |
|------|------------|------|------|
| 뉴스 | `news.yml` KST 03:15 | 동일 워크플로우 | 배포 완료 즉시 |
| 주식 | Claude Code 루틴 21:25 | `stock_build.yml` 23:00 | `stock_send.yml` 익일 08:00 |
| AI이슈 | `ai_issue.yml` 일 07:00 | 동일 워크플로우 | 배포 완료 즉시 |

**GitHub Actions 워크플로우**

| 파일 | 역할 |
|------|------|
| `news.yml` | 뉴스 수집·분석·빌드·배포 |
| `news_send.yml` | 이메일 + 텔레그램 발송 |
| `stock_build.yml` | 주식 시황 빌드 |
| `stock_send.yml` | 주식 뉴스레터 발송 |
| `ai_issue.yml` | AI이슈 주간 브리핑 |
| `cardnews.yml` | SNS 카드뉴스 생성 |
| `weekly_build.yml` | 주간 리포트 빌드 |

**핵심 파일 구조**

```
dailynews/
├── core/
│   ├── shared/
│   │   ├── mailer.py       # 이메일 발송 (모든 채널 공통)
│   │   └── telegram.py     # 텔레그램 발송 (모든 채널 공통)
├── scripts/
│   ├── run_news.py         # 뉴스 수집·분석·MD 저장
│   ├── build_site.py       # 뉴스 HTML 빌드
│   ├── build_stock_site.py # 주식 HTML 빌드
│   ├── send_email.py       # 통합 이메일 발송 (--type news|stock|ai-issue)
│   └── send_telegram.py    # 통합 텔레그램 발송
├── config/                 # API 키·채널 설정
├── storage/reports/        # 생성된 HTML 보고서
└── publish/                # Vercel 배포 파일
```

**전체 흐름**

```
[GitHub Actions 스케줄]
    ↓
[RSS 수집 + Gemini/Claude 분석]
    ↓
[HTML 빌드 → Vercel 자동 배포]
    ↓
[이메일 (Resend) + 텔레그램 발송]
```

---

### 3-2. weeklyreport — 주간보고서 자동화

**한 줄 요약**: 팀원이 YAML 파일에 업무를 기록하면 자동 취합·검증·발행·누적 관리까지 처리하는 WRMS v3.2

**핵심 특징**

| 기능 | 설명 |
|------|------|
| YAML 수집 | `reports/yymmdd/팀명.yaml` 형식으로 팀별 입력 |
| 자동 취합 | 날짜별 폴더의 YAML을 MD로 취합 (compiler.py) |
| 검증 | dryrun 모드로 오류 사전 점검 |
| 출력 | HTML / Excel / PDF / DOCX 다중 포맷 내보내기 |
| 누적 관리 | `누적관리.xlsx` — 매주 시트 자동 추가 |

**디렉토리 구조**

```
weeklyreport/
├── wrms.py             # 메인 실행 (CLI + GUI)
├── config/config.yaml  # 전체 동작 설정
├── scripts/
│   ├── validator.py    # 환경 검증·자동복구
│   ├── parser.py       # YAML/MD 파싱 (멀티 인코딩)
│   ├── compiler.py     # MD 취합 엔진
│   ├── exporter.py     # HTML/Excel/PDF/DOCX 변환
│   ├── publisher.py    # publish:true 파일 발행
│   └── dryrun.py       # 자료 검증 엔진
├── reports/            # 팀원 YAML 입력 폴더
│   └── 260613/         # 날짜별 하위 폴더 (yymmdd)
└── output/
    ├── 누적관리.xlsx   # 항상 최신 (매주 시트 추가)
    └── 260613/         # 날짜별 스냅샷
```

**빠른 시작**

```powershell
cd c:\ai\weeklyreport

# 검증 (드라이런)
python wrms.py --dryrun --date 260613

# 취합 및 출력
python wrms.py --date 260613

# GUI 실행
python wrms.py --gui
```

---

## 4. 데이터 처리 엔진

### 4-1. BudgetN — 정부 예산 데이터 파이프라인

**한 줄 요약**: PDF·XLSX·YAML 등 다양한 포맷의 정부 예산 자료를 단일 canonical JSON으로 통합하고 TF-IDF 유사도 분석을 거쳐 GitHub Pages 웹 대시보드로 자동 배포하는 7단계 파이프라인

**GitHub**: `chamgil71/BudgetN` | **배포**: GitHub Pages (Actions 자동)

**7단계 파이프라인**

```
[Step 1] 수집    PDF / XLSX(총괄/A4) / YAML / JSON 멀티 포맷 파싱
    ↓
[Step 2] 통합    단일 canonical schema (merged.json) 수렴
    ↓
[Step 3] 정규화  법인명·날짜·금액 표준화
    ↓
[Step 4] 분석    TF-IDF + Cosine Similarity + Jaccard 유사도
    ↓
[Step 5] 집계    부처 간 협업 네트워크 도출
    ↓
[Step 6] 번들링  embedded-*.js 생성 (오프라인 Fallback)
    ↓
[Step 7] 배포    GitHub Actions → GitHub Pages 자동 배포
```

**주요 특징**

| 특징 | 설명 |
|------|------|
| 멀티 포맷 수집 | PDF·XLSX·YAML·JSON 어떤 포맷이든 수렴 |
| 설정 중심 운영 | `config.yaml` 컬럼 매핑만 바꾸면 코드 수정 불필요 |
| Embedded JS Fallback | 네트워크 없이도 동작하는 오프라인 번들 |
| 부분 실행 | `master_builder.py` 전체 또는 단계별 부분 실행 |

**빠른 시작**

```powershell
cd c:\ai\BudgetN

# 전체 파이프라인 실행
python backend/master_builder.py

# 단계별 실행
python backend/master_builder.py --step 1  # 파싱만
python backend/master_builder.py --step 4  # 분석만

# 로컬 확인
cd web && npm run dev
```

---

### 4-2. doc-analysis — 기밀문서 분석

**한 줄 요약**: 내부 기밀문서(HWP·PDF·XLSX·PPTX 등)를 마크다운으로 변환하고 유사도 분석·사업별 분할·통계 통합을 수행하는 완전 로컬 분석 환경

> **보안 원칙**: 원본 파일 및 분석 결과를 외부 API, 클라우드 서비스에 전송 금지.
> `web_search`, Notion MCP, Google Drive MCP 사용 금지.

**주요 스크립트**

| 스크립트 | 역할 |
|----------|------|
| `pdf_to_md.py` | PDF → MD 변환 (표 구조 보존, pdfplumber) |
| `convert_to_md.py` | 전 포맷 → MD 변환 (빠른 변환, pymupdf) |
| `split_by_project.py` | 사업명 기준 MD 분할 |
| `similarity_analysis.py` | TF-IDF / Jaccard 유사도 분석 |
| `stats_merger.py` | 연도별 통계 통합 → Excel |
| `file_classifier.py` | 키워드 기반 파일 자동 분류 |

**디렉토리 구조**

```
doc-analysis/
├── raw_docs/               원본 기밀 파일 (Git 제외)
├── raw_docs1/ → C:\업무\AI전략팀\   Junction 링크
├── md_docs/                변환된 MD (Git 제외)
│   └── split/              사업별 분할 MD
├── analysis/
│   ├── similarity/         유사도 분석 결과 (xlsx)
│   ├── stats/              통계·수치 통합 (xlsx)
│   └── reports/            최종 보고서
└── scripts/                분석 스크립트 모음
```

**실행 순서**

```powershell
cd c:\ai\doc-analysis

# 패키지 설치
pip install pdfplumber pymupdf scikit-learn pandas openpyxl python-docx python-pptx

# 1단계: 변환
python scripts/convert_to_md.py --input raw_docs/ --output md_docs/

# 2단계: 사업별 분할
python scripts/split_by_project.py

# 3단계: 유사도 분석
python scripts/similarity_analysis.py

# 4단계: 통계 통합
python scripts/stats_merger.py
```

---

## 5. 엔터프라이즈 솔루션 (company)

`c:\ai\company\` 하위에 위치한 기업 내부 업무용 솔루션 모음. 모든 프로젝트가 **4-Layer 아키텍처** (backend / frontend / storage / docs) 를 공통으로 따른다.

```
company/
├── companypool/    기업 마스터 DB ETL
├── convertertools/ 문서 형식 변환 엔진
├── filetools/      파일 관리·무결성 검증
├── IEMS/           (미완성, 제외)
├── xlsx-contract/  (미완성, 제외)
├── site-analyzer/  (미완성, 제외)
└── unidocs/        (미완성, 제외)
```

---

### 5-1. companypool — 기업 마스터 DB

**한 줄 요약**: 다양한 출처의 기업 정보 Excel을 통합하여 정규화된 마스터 DB(JSON)로 변환하는 ETL 도구

**GitHub**: `chamgil71/companytools`

**주요 명령**

| 명령 | 동작 |
|------|------|
| `python main.py sync -i storage/input.xlsx` | Excel → output.json 병합 |
| `python main.py export --format xlsx` | JSON → Excel 내보내기 |
| `python main.py validate` | 스키마 검증 |

**설정 파일**

| 파일 | 역할 |
|------|------|
| `config/config.yaml` | 파이프라인 규칙·컬럼 매핑 |
| `config/pattern.yaml` | 기업명 정규화 패턴 |
| `config/config_out.yaml` | 출력 필터 설정 |
| `schema.json` | Pydantic 기반 데이터 스키마 |

**빠른 시작**

```powershell
cd c:\ai\company\companypool

# 데이터 병합
python main.py sync -i storage/input.xlsx

# 산출물: storage/output.json + storage/result.xlsx
```

---

### 5-2. convertertools — 문서 형식 변환 엔진

**한 줄 요약**: HWP·HWPX·PDF·Word·PPT·Excel 등을 포맷 독립적 중간 표현형(IRBlock)을 경유해 자유롭게 변환하는 엔진 (N파서 × N라이터)

**지원 포맷**

| 포맷 | 읽기 | 쓰기 | 비고 |
|------|:----:|:----:|------|
| HWPX | ✅ | ✅ | 순수 Python, win32 불필요 |
| HWP 5.x | ✅ | — | win32com + 한글 오피스 필요 |
| DOCX | ✅ | ✅ | python-docx |
| PPTX | ✅ | ✅ | python-pptx |
| XLSX | ✅ | — | openpyxl |
| PDF | ✅ | ✅ | pymupdf(빠름) / pdfplumber(정밀) |
| Markdown | ✅ | ✅ | markdown-it-py |

**변환 구조**

```
[입력 파일]
    ↓ 파서 (Parser)
[IRBlock — 포맷 독립 중간 표현]
    ↓ 라이터 (Writer)
[출력 파일]
```

**빠른 시작**

```powershell
cd c:\ai\company\convertertools
pip install -r requirements.txt

# HWPX → Markdown 변환
python convert_to_md.py --input doc.hwpx --output doc.md

# PDF → Markdown (정밀 모드)
python convert_to_md.py --input report.pdf --output report.md --engine pdfplumber

# GUI 실행
python gui/app.py
```

---

### 5-3. filetools — 파일 관리·무결성 검증

**한 줄 요약**: 대용량 파일의 고속 복사·해시 기반 무결성 검증·매니페스트 기반 일괄 작업 파이프라인을 제공하는 기업용 파일 관리 도구

**핵심 기능**

| 기능 | 설명 |
|------|------|
| 매니페스트 파이프라인 | 폴더 스캔 → Excel 매니페스트 생성 → 액션 지정 → 일괄 실행 |
| 지원 액션 | Keep / Rename / Move / Copy / Unzip / PDF_Convert |
| 무결성 검증 | SHA-256 해시 기반 원본·복사본 일치 확인 |
| PDF 변환 | HWPX·DOCX·XLSX·PPTX → PDF (Office/한컴 네이티브 엔진) |
| Streamlit UI | 웹 인터페이스로 파이프라인 조작 |

**빠른 시작**

```powershell
cd c:\ai\company\filetools

# Streamlit 웹 UI
pip install -r requirements.txt
streamlit run frontend/app.py

# CLI 실행
python backend/pipeline.py --manifest storage/manifest.xlsx
```

---

## 6. 콘텐츠 빌더 — creative-spark

**한 줄 요약**: 마크다운 + 29종 shortcode로 작성한 문서를 React 웹북 / 횡스크롤 슬라이드 HTML / PPTX로 동시 출력하는 콘텐츠 빌드 엔진

**경로**: `c:\ai\creative-spark`

### 6-1. 3가지 출력 형식

| 형식 | 명령 | 출력 경로 |
|------|------|-----------|
| 가이드 HTML | `node scripts/build-guide.mjs <파일>` | `public/<폴더>/<파일>.html` |
| 횡 슬라이드 | `node scripts/build-presentation.mjs <파일>` | `public/presentation/<파일>.html` |
| PPTX | `node scripts/build-pptx.mjs <파일>` | `public/pptx/<파일>.pptx` |
| 전체 빌드 | `npm run build:all` | dist/ + public/ |

### 6-2. 29종 shortcode 시스템

| 카테고리 | shortcode 종류 |
|----------|----------------|
| 레이아웃 | `feature-grid`, `icon-grid`, `compare-grid`, `columns-grid`, `stat-grid` |
| 도구·목록 | `tool-list`, `tool-box`, `level-grid`, `plan-grid` |
| 흐름 | `step-list`, `step-flow`, `git-flow`, `workflow-flow` |
| 코드·에디터 | `editor-box`, `cmd-box`, `console-box` |
| 강조 | `summary-box`, `alert-box`, `badge-grid` |
| 비교 | `compare-split`, `compare-diff` |

### 6-3. 마크다운 파일 위치

```
md_src/
├── claudeguide/        Claude 활용 가이드
├── guides/             기타 AI 도구 가이드
└── <프로젝트>/         프로젝트별 발표 자료
```

### 6-4. 스타일 시스템

```
config/
├── styles.json         스타일 테마 정의 (ai-chat, dark-pro 등)
├── htmldesign.config.json  HTML 가이드 렌더링 설정
└── pptdesign.config.json   PPTX 디자인 설정
```

**빠른 시작**

```powershell
cd c:\ai\creative-spark

# 특정 파일만 빌드
node scripts/build-guide.mjs md_src/claudeguide/ai-tools-guide.md
node scripts/build-presentation.mjs md_src/claudeguide/ai-tools-guide.md

# React 개발 서버
npm run dev

# 전체 빌드
npm run build:all
```

---

## 7. 공통 인프라 & 운영

### 7-1. GitHub Actions 공통 패턴

세 프로젝트(dailynews, BudgetN, pjtoverview)가 GitHub Actions를 활용하고 있으며 공통 패턴을 따른다.

```yaml
# 공통 패턴 예시
on:
  schedule:
    - cron: '15 18 * * *'   # KST 03:15 (UTC+9 보정)
  workflow_dispatch:          # 수동 트리거 항상 포함

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        uses: actions/setup-python@v5  # 또는 setup-node
      - name: Run
        env:
          API_KEY: ${{ secrets.API_KEY }}   # Secrets에서 주입
        run: python scripts/run.py
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4  # GitHub Pages 배포
```

**Secrets 관리 원칙**
- API 키는 반드시 GitHub Repository Secrets에 저장
- 코드에 하드코딩 절대 금지
- 로컬 실행 시 `.env` 파일 사용 (`.gitignore` 등록)

---

### 7-2. Vercel 배포 공통 설정

pjtoverview, mywiki, dailynews 모두 Vercel로 배포되며 아래 설정이 공통이다.

```json
// vercel.json (정적 사이트 공통 패턴)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

| 프로젝트 | 배포 방식 | 빌드 트리거 |
|----------|-----------|-------------|
| pjtoverview | React 정적 빌드 | Vercel GitHub 연동 자동 배포 |
| mywiki | Quartz v4 빌드 | GitHub Actions → Pages / Vercel 연동 |
| dailynews | Python 생성 HTML | GitHub Actions → Vercel CLI push |

---

### 7-3. 4-Layer 아키텍처 공통 규칙

`company/` 하위 모든 솔루션이 준수하는 레이어 규칙.

| 레이어 | 폴더 | 역할 |
|--------|------|------|
| **Router/API** | `backend/api/` | HTTP 요청 처리, 입력 검증 |
| **Service** | `backend/service/` | 비즈니스 로직 |
| **Repository** | `backend/repository/` | 데이터 접근 |
| **Model** | `backend/models/` | Pydantic 데이터 구조 |
| **Frontend** | `frontend/` | Streamlit 또는 React UI |
| **Storage** | `storage/` | 입출력 파일, 로그 |

**규칙**
- Router에 비즈니스 로직 금지
- Service에서 DB 직접 호출 금지
- 모든 파일 경로는 `pathlib.Path` 사용
- 환경변수는 `.env` + `config.yaml` 분리 관리

---

### 7-4. scripts/ — 공용 유틸리티

`c:\ai\scripts\` 에 위치한 단독 실행 유틸.

| 스크립트 | 역할 |
|----------|------|
| `budget_json_to_excel.py` | BudgetN canonical JSON → Excel 변환 |
| `image_to_icon.py` | 이미지 → favicon.ico / PNG 아이콘 변환 |
| `config.py` | 공용 경로·설정 상수 |
| `macro/` | Office 자동화 VBA 매크로 모음 |

---

### 7-5. storage/ — 공용 데이터 저장소

`c:\ai\storage\` 에 프로젝트 간 공유 데이터가 위치한다.

| 경로 | 내용 |
|------|------|
| `storage/ai_guide_data/` | AI 도구별 HTML 가이드 (Claude, Gemini, ChatGPT 등) |
| `storage/data_budget/` | 정부 예산 원본 데이터 |
| `storage/survey2/` | 설문 원본 데이터 |

---

### 7-6. 프로젝트 간 데이터 흐름

```
[내부 문서·Excel 원본]
    ↓ doc-analysis         기밀문서 → MD 변환
    ↓ companypool          기업 Excel → output.json
    ↓ BudgetN              예산 PDF/XLSX → merged.json

[정제된 데이터]
    ↓ pjtoverview          R&D XLSX → JSON → Vercel 대시보드
    ↓ clearsurvey          설문 XLSX → 정제 → React 대시보드
    ↓ weeklyreport         YAML → 취합 → Excel/HTML 보고서

[콘텐츠 & 발행]
    ↓ creative-spark       MD → HTML슬라이드/PPTX
    ↓ mywiki               Obsidian 노트 → Quartz → Vercel
    ↓ dailynews            RSS → AI → 웹+이메일+텔레그램
```

---

*최종 업데이트: 2026-06*
