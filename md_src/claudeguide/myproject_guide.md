---
title: "개인 프로젝트 및 AI 활용 기술 마스터 가이드"
subtitle: "나만의 지식 관리 체계, AI 개발 스택, 7대 핵심 프로젝트 운영 현황"
badge: "🛠️ 개인 프로젝트 대시보드"
style: "ai-dev"
logo: "💻"
fontFace: "Malgun Gothic"
titleSize: 22
bodySize: 12
stats:
  - value: "5대 분야"
    label: "습득 기술 맵"
  - value: "7개"
    label: "개발 프로젝트"
  - value: "3개"
    label: "주요 GitHub 저장소"
  - value: "5요소"
    label: "실무 프롬프트 규칙"
---

# 1. 지식 관리, 검색 & AI 핵심 두뇌 스택

정보를 수집하고 정제하여 아카이빙하는 지식 관리 솔루션과 실제 두뇌 역할을 하는 범용 AI 플랫폼 기술 맵입니다.

---

## 핵심 AI 두뇌 라인업 
비즈니스 기획, 프로그래밍 코딩, 자율 수행 등 목표 용도에 최적화된 인공지능 모델입니다.

::: plan-grid cols=3
- title: "ChatGPT (OpenAI)"
  tag: "범용 비서 & 데이터 분석"
  meta: "스위스 아미 나이프형 범용 챗봇|엑셀/CSV 데이터 분석 및 동적 그래프 시각화|사용자 정의 GPTs 봇 구성"
  note: "데이터 시각화 및 아이디어 브레인스토밍"
- title: "Claude (Anthropic)"
  tag: "프로그래밍 & 비즈니스 작문"
  meta: "대용량 코드베이스 완벽 이해 및 리팩토링|아티팩트(Artifacts) 실시간 웹 렌더링|정중한 비즈니스 톤앤매너 윤문"
  note: "정밀 코딩 및 기획서 작성 최적"
  featured: "true"
- title: "Gemini & Manus"
  tag: "구글 통합 & 자율 대리"
  meta: "Gemini: 구글 워크스페이스 및 YouTube 영상 요약 강점|Manus: 목적 달성을 위해 웹을 자율 조종하는 에이전트"
  note: "구글 오피스 연동 & 자율 리서치 업무 위임"
:::

## 지식 관리 및 정보 검색 도구
생각과 자료를 그물망처럼 연결하고, 정확한 출처 기반으로 가치를 창출합니다.

::: compare-split
- title: "지식 관리 및 아카이빙 (Obsidian & Notion)"
  desc: "개인의 아이디어 정리부터 데이터베이스 구축과 협업 문서화까지 지식의 전 주기를 통제합니다."
  meta: "Obsidian: 평생 무료 오프라인 위키, 양방향 링크([[ ]])를 통한 생각 지도 시각화|Notion: 올인원 데이터베이스, 칸반 보드 업무 관리, 손쉬운 공유 페이지 빌드"
  note: "개인용 세컨드 브레인(Obsidian) & 팀 협업 플랫폼(Notion)"
- title: "출처 기반 검색 & 정보 요약 (NotebookLM & Perplexity)"
  desc: "환각(거짓 정보) 없이 내가 던진 문서와 웹 데이터를 기반으로 팩트를 정밀 수집합니다."
  meta: "NotebookLM: 구글 드라이브 문서 및 PDF 학습 기반 1:1 맞춤형 지식 비서|Perplexity: 실시간 구글링 결과 종합 요약 및 클릭 가능한 정보 출처(각주) 표기"
  note: "정밀 데이터 팩트 요약(NotebookLM) & 리서치 검색(Perplexity)"
:::

---

# 2. 프로그래밍 개발 도구 및 웹서비스 배포 인프라

아이디어를 파이썬 코드로 구현하고, AI 에디터를 통해 고속 코딩하며, 서버리스 인프라를 활용해 세상에 서비스를 출시하는 기술 체계입니다.

## 개발 및 AI 코딩 어시스턴트
인공지능의 코드 보조를 장착하여 개발 효율성과 타이핑 속도를 극한으로 끌어올립니다.

::: feature-grid cols=3
- icon: "🐍"
  title: "Python"
  tag: "코딩 언어"
  desc: "학습 장벽이 낮으며, AI 연동 라이브러리와 엑셀 등 반복 업무 자동화 스크립트 작성에 독보적인 만능 프로그래밍 언어입니다."
- icon: "🖥️"
  title: "VS Code"
  tag: "통합 편집기"
  desc: "전 세계 개발자가 표준으로 사용하는 무료 에디터입니다. 수많은 플러그인과 연동해 쾌적한 텍스트 코딩을 수행합니다."
- icon: "🪄"
  title: "Cursor & Copilot"
  tag: "AI 코딩 비서"
  desc: "자연어로 코드 수정을 요청하면 직접 패치해주는 AI 에디터(Cursor)와, 타이핑 시 다음 라인을 실시간 자동 완성(Copilot)하는 도구입니다."
- icon: "🤖"
  title: "Claude Code CLI"
  tag: "터미널 에이전트"
  desc: "까만 명령 창에서 실행되어 프로젝트의 구조를 분석하고, 버그 발생 시 자율적으로 코드를 읽고 고치는 에이전트 도구입니다."
- icon: "🧬"
  title: "Anti Gravity"
  tag: "기본 뼈대 프레임워크"
  desc: "AI 스크립트와 로컬 하드웨어 서버를 견고하게 묶어 24시간 안정적으로 연동 가동되도록 돕는 설계 프레임워크입니다."
:::

---

## 웹서비스 배포 및 서버리스 백엔드 인프라
서버 장비 임대나 어려운 네트워크 세팅 없이, 단 몇 초 만에 글로벌 인터넷 주소(URL)로 배포하고 DB를 연동하는 인프라입니다.

::: compare-split
- title: "프론트엔드 및 정적 사이트 (Lovable, Vercel, Quartz)"
  desc: "채팅으로 웹 화면을 그리고, 저장소를 연결하여 즉석 배포합니다."
  meta: "Lovable: 자연어 코딩 기반 고속 웹 UI 프로토타이핑 빌더|Vercel: GitHub 연동 클릭 한 번으로 글로벌 호스팅 웹 주소 생성|Quartz: 옵시디언 마크다운 노트를 예쁜 웹 블로그로 변환 출력"
  note: "비주얼 웹페이지 고속 빌딩 및 배포"
- title: "백엔드 및 도메인 보안 (Supabase, Resend, Cloudflare)"
  desc: "회원가입, 데이터 보관, 자동 메일 전송 및 방화벽을 원스톱 적용합니다."
  meta: "Supabase: Postgres DB, 사용자 인증, 클라우드 스토리지 통합 BaaS|Resend: 파이썬 코드로 자동 리포트를 발송하는 고성능 이메일 API|Cloudflare: 디도스 방지, 도메인 연결 및 로컬 서버 외부 통로 보안"
  note: "안정적인 데이터 저장 및 메일링 자동화"
:::

---

# 3. 주요 진행 개발 프로젝트 현황 (Project Inventory)

실무에서 개발 중이거나 목표로 삼고 있는 **핵심 소프트웨어 프로젝트**의 요약 리스트입니다.

::: columns-grid cols=3
- title: "1) convertertools"
  desc: "문서 포맷 상호 변환기"
  meta: "hwpx, pptx, xlsx, docx, pdf 파일들 간의 상호 변환|마크다운(md), JSON, YAML 포맷으로의 파싱 및 구조 추출|분석 - 편집 - 적용 단계별 모듈화 설계"
- title: "2) filetools"
  desc: "일괄 폴더 및 파일 관리기"
  meta: "폴더 리스트 목록 Excel 생성|Excel 지침을 읽어 일괄 파일명 변경, 압축 해제 및 복사|zip 압축 해제 후 문서 파일들을 자동으로 pdf 일괄 변환"
- title: "3) companypool"
  desc: "기업 및 솔루션 DB 대시보드"
  meta: "기업/솔루션 xlsx 데이터 취합 ➔ JSON화|DB 스키마(YAML/JSON) 자동 생성|React/Vite 웹 기반 반응형 대시보드 구축"
- title: "4) xlsx-contract"
  desc: "Excel 헤더 파싱 및 DB 변환기"
  meta: "Excel 상단 2행 복합 헤더 자동 분석 및 트리 구조 스키마 생성|데이터 추출 후 JSON 통합|집계용 통계 메타데이터 컬럼 자동 부착"
- title: "5) site-analyzer"
  desc: "홈페이지 깊이 구조 파악 툴"
  meta: "특정 웹 도메인의 URL Depth 탐색|전체 메뉴 트리 및 사이트 아키텍처 구조도 추출"
- title: "6) weeklyreport & pdf to ppt"
  desc: "업무 보고 취합 & AI 슬라이드 복원"
  meta: "weeklyreport: 팀별 YAML 보고를 일괄 취합해 Excel/HTML 보고서 렌더링|pdf to ppt: PDF 슬라이드를 고해상도 이미지화 후 Gemini API 레이아웃 분석을 거쳐 편집 가능한 파워포인트(PPTX) 벡터 파일로 자동 재생성"
:::

---

# 4. 생산성을 높여주는 보조 툴 및 GitHub 리포지토리

일일 업무 속도를 배가하는 깨알 같은 유틸리티 목록과, 실제 관리 중인 GitHub 원격 소스 코드 저장소 정보입니다.

## 업무 효율 극대화용 유용한 보조 유틸리티 7선
한 번 설치해두면 윈도우 환경에서 코딩 및 기획 작업 생산성이 2배 이상 비약적으로 향상되는 필수 보조 툴입니다.

::: step-list
- title: "1. NotebookLM Importer & Grabit (크롬 확장 프로그램)"
  desc: "웹 서핑 중 발견한 유익한 테크 아티클을 원클릭으로 내 NotebookLM 지식창고에 꽂아 넣고, 웹페이지 상의 수많은 UI 디자인 요소를 한 번에 캡처 수집합니다."
- title: "2. Snipaste (로컬 화면 캡처 및 화면 핀)"
  desc: "원하는 소스 코드나 템플릿 영역을 캡처하여 화면 최상단에 스티커(Pin)처럼 띄워 둡니다. 보조 모니터가 없어도 양쪽 화면 코드를 대조해가며 분석할 때 최고의 위력을 발휘합니다."
- title: "3. PowerToys (윈도우 공식 유틸리티 패키지)"
  desc: "`FancyZones`를 활용해 모니터 화면 분할 영역을 고정하고, `Color Picker`로 화면 내 특정 픽셀의 HEX/RGB 색상 코드를 1초 만에 추출하여 프론트엔드 디자인에 적용합니다."
- title: "4. Power Automate, Everything & Sider"
  desc: "윈도우 내장 RPA인 Power Automate로 첨부파일 자동 다운로드 루틴을 셋업하고, Everything으로 수십만 개 파일 중 0.1초 만에 파일을 검색하며, Sider 사이드바 AI를 소환해 즉시 번역/해설을 봅니다."
:::

---

## 3대 핵심 GitHub 원격 저장소 목록
로컬 코드를 안전하게 커밋하고 형상 관리를 유지하는 클라우드 소스 코드 저장소 현황입니다.

::: git-flow
- title: "companytools"
  tag: "기업 및 솔루션 DB 관리"
  meta: "https://github.com/chamgil71/companytools.git|기업 데이터 가공, 스키마 변환 및 json 파이프라인 관리 모듈 수록"
  color: "#3B82F6"
- title: "BudgetN"
  tag: "예산 내역 관리 웹 앱"
  meta: "https://github.com/chamgil71/BudgetN.git|Lovable 및 Supabase 데이터 바인딩을 적용한 정적/동적 웹 어플리케이션 저장소"
  color: "#10B981"
- title: "pjtoverview"
  tag: "전체 프로젝트 대시보드"
  meta: "https://github.com/chamgil71/pjtoverview.git|개인 기획, 7대 자동화 툴 프로젝트의 통합 명세서 및 빌드 가이드 보관소"
  color: "#8B5CF6"
:::

---

# 5. 실무 프롬프트 필수 5대 요소 및 작성 규칙

AI가 환각 없이 가장 만족스러운 품질의 리포트나 코드를 뱉어내게 만드는 5대 필수 항목과 실제 적용 문장 양식입니다.

::: step-list
- title: "1. Role (역할 부여) & 2. Context (배경 설명)"
  desc: "AI에게 구체적인 페르소나를 정해주고(예: '너는 15년 차 시니어 파이썬 개발자야'), 현재 어떤 목표의 프로젝트를 만들고 있는 중인지 배경 맥락을 상술합니다."
- title: "3. Task (수행 과업) & 4. Constraint (제약 조건)"
  desc: "해결해야 할 문제와 기능(예: 'CSV에서 월별 평균 지출을 구하는 함수 작성')을 명시하고, 절대 하지 말아야 할 한계점이나 기술 스택 제한(예: '외부 라이브러리 pandas 외 사용 금지, 한국어 주석 필수')을 지정합니다."
- title: "5. Output (출력 형식 지정)"
  desc: "답변이 장황하게 나오지 않도록 최종 산출물 서식을 통제합니다. (예: '설명은 생략하고 마크다운 코드 블록 안에 완성된 파이썬 함수만 깔끔하게 출력해줘')"
:::

---

## 실전 실무 적용 프롬프트 템플릿
기본 5요소를 결합하여 실제 Claude나 ChatGPT에 입력하는 템플릿 구조 예시입니다.

::: console-box
- title: "실전 보고서 생성 및 코딩 프롬프트 템플릿"
  desc: |
    [역할 지정]
    너는 글로벌 IT 컨설팅 펌의 수석 AI 산업 분야 전문 애널리스트야.
    
    [배경 맥락]
    현재 2026년 상반기 AI 트렌드(자율형 에이전트 기술 중심) 보고서 슬라이드를 기획하고 있어.
    
    [구체적 과업]
    아래에 텍스트로 첨부한 일일 AI 뉴스 수집 데이터를 정밀 분석해서, 이번 달 시장의 핵심 인사이트 3가지를 명확히 도출하고 상세 리포트 초안을 작성해줘.
    
    [제약 조건]
    1. 추상적인 미래 전망 서술은 배제하고, 실제 기업 명칭(예: Anthropic, xAI)과 실질적인 기술 스택을 언급할 것.
    2. 객관적이고 간결한 개조식 비즈니스 톤앤매너를 준수할 것.
    
    [출력 서식]
    결과물 최상단에 3줄 핵심 요약을 배치하고, 본문은 마크다운 헤더(H2, H3)와 불릿 포인트를 활용해 표 형태 데이터와 함께 정렬하여 반환해줘.
:::
