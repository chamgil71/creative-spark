---
title: Everything (에브리띵) 가이드
subtitle: Windows 파일 검색을 완전히 바꾸는 도구수백만 개의 파일을 0.1초 안에 찾아내는 인덱싱 검색
logo: 🔍Everything
badge: 🔍 Windows 전용 · 완전 무료 · 오픈소스
style: productivity
stats:
  - value: "<1초"
    label: "전체 드라이브 검색"
  - value: "0MB"
    label: "RAM 점유율"
  - value: "무료"
    label: "완전 무료"
  - value: "실시간"
    label: "파일 변경 반영"
done:
  title: "⚡ Everything으로 파일 검색의 신세계를 경험하세요"
  subtitle: "수백만 개의 파일을 단 0.1초 만에 찾아내는 짜릿함을 누리세요!"
  ctaLabel: "voidtools 공식 홈페이지 바로가기"
  ctaUrl: "https://www.voidtools.com"
footer:
  - "Everything은 voidtools에서 개발한 완전 무료 인덱싱 파일 검색 유틸리티입니다."
  - "공식 웹사이트: [voidtools.com](https://www.voidtools.com)"
---

# 1. 왜 Everything인가?
::: compare-split
- title: "Windows 기본 검색"
  desc: |
    * 인덱스 없는 폴더: 탐색기에서 검색
    * 드라이브 전체 스캔 로딩 인디케이터 무한 루프
    * 파일 하나씩 순차 스캔
  note: "30초 ~ 5분"
- title: "Everything"
  desc: |
    * 글로벌 단축키 `Win+Alt+E`로 즉시 창 호출
    * 파일명 타이핑과 동시에 검색 결과 즉시 표시
    * 전체 드라이브 초고속 인덱싱 완료
  note: "0.1초"
:::

::: alert-box tip
- title: "💡 동작 원리:"
  desc: "Windows NTFS의 MFT(Master File Table)를 직접 읽어 모든 파일 정보를 메모리에 인덱싱. 설치 직후 빠르게 인덱스 구축 후 실시간 업데이트."
:::

# 2. 검색 문법 & 고급 쿼리
::: columns-grid
- title: "*.xlsx"
  desc: "특정 확장자 파일 전체 검색"
  meta: "예: *.pptx, *.pdf, *.py"
- title: "보고서 2025"
  desc: "두 단어 모두 포함 (AND)"
  meta: "띄어쓰기 = AND 조건"
- title: "ext:xlsx dm:today"
  desc: "오늘 수정된 Excel 파일"
  meta: "dm:yesterday / dm:thisweek"
- title: "path:C:\\Projects *.py"
  desc: "특정 폴더 내에서만 검색"
  meta: "경로 + 파일명 조합"
- title: "size:>10mb *.mp4"
  desc: "10MB 초과 MP4 파일"
  meta: "size:<1mb, size:1mb..100mb"
- title: "regex:2025\\d{4}"
  desc: "정규식 패턴 검색"
  meta: "고급 사용자 패턴 매칭"
:::

::: alert-box tip
- title: "⭐ 자주 쓰는 쿼리 저장:"
  desc: "자주 사용하는 검색식은 Bookmarks로 저장 가능. 예: `*.pptx dm:thismonth` → `이달 PPT 파일`로 즐겨찾기."
:::

# 3. 주요 기능
::: icon-grid
- icon: "⚡"
  title: "실시간 인덱스"
  desc: "파일 생성·삭제·이동 즉시 반영. 항상 최신 상태 유지."
- icon: "🖱️"
  title: "우클릭 메뉴 통합"
  desc: "결과에서 우클릭 → 열기·경로 복사·폴더 열기 즉시 실행."
- icon: "🌐"
  title: "HTTP 서버"
  desc: "내부망에서 Everything을 웹 서버로 실행. 다른 PC에서 검색 가능."
- icon: "⌨️"
  title: "글로벌 단축키"
  desc: "어떤 창에서도 Win+Alt+E로 즉시 검색창 호출 (설정 가능)."
:::

# 4. 설치 & 설정
::: step-list
- title: "voidtools.com 접속 및 다운로드"
  desc: "공식 사이트에서 본인의 OS에 맞는 32/64비트 버전을 받아 설치합니다. 설치 파일 크기가 2MB 이하로 대단히 가볍습니다."
- title: "최초 실행 시 자동 인덱싱 구축"
  desc: "최초 가동 시 전체 디스크 인덱스를 즉시 메모리에 적재합니다. SSD 환경에서는 100만 개 파일도 1분 이내에 완료되며, 이후 실시간 동기화됩니다."
- title: "글로벌 단축키 및 시작 옵션 설정"
  desc: "옵션(Tools -> Options)에서 글로벌 단축키(예: Win+Alt+E)를 설정하고, 윈도우 시작 시 자동 실행되도록 등록을 적극 권장합니다."
- title: "백그라운드에서 조용히 대기"
  desc: "시스템 트레이에 상주하며 CPU 및 RAM 리소스를 거의 점유하지 않습니다. 항상 켜두고 언제든 불러와 즉시 검색하세요."
:::

::: alert-box tip
- title: "💡 PowerToys Run 연동:"
  desc: "Microsoft PowerToys 설치 후 Alt+Space → Everything 플러그인 활성화. PowerToys Run 검색창에서 Everything 검색 동시 사용 가능."
:::