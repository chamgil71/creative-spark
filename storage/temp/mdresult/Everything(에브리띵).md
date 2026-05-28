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
---

# 1. 왜 Everything인가?

검색 속도 비교 — "2024 예산보고서.xlsx" 찾기

🐌 Windows 기본 검색

30초 ~ 5분

⚡ Everything

0.1초

::: alert-box
- type: tip
  title: 💡 동작 원리:
  desc: Windows NTFS의 MFT(Master File Table)를 직접 읽어 모든 파일 정보를 메모리에 인덱싱. 설치 직후 빠르게 인덱스 구축 후 실시간 업데이트.
:::

# 2. 검색 문법 & 고급 쿼리

*.xlsx

특정 확장자 파일 전체 검색

예: *.pptx, *.pdf, *.py

보고서 2025

두 단어 모두 포함 (AND)

띄어쓰기 = AND 조건

ext:xlsx dm:today

오늘 수정된 Excel 파일

dm:yesterday / dm:thisweek

path:C:\Projects *.py

특정 폴더 내에서만 검색

경로 + 파일명 조합

size:>10mb *.mp4

10MB 초과 MP4 파일

size:<1mb, size:1mb..100mb

regex:2025\d{4}

정규식 패턴 검색

고급 사용자 패턴 매칭

**⭐ 자주 쓰는 쿼리 저장:**

# 3. 주요 기능

::: icon-grid
- icon: ⚡
  title: 실시간 인덱스
  desc: 파일 생성·삭제·이동 즉시 반영. 항상 최신 상태 유지.
- icon: 🖱️
  title: 우클릭 메뉴 통합
  desc: 결과에서 우클릭 → 열기·경로 복사·폴더 열기 즉시 실행.
- icon: 🌐
  title: HTTP 서버
  desc: 내부망에서 Everything을 웹 서버로 실행. 다른 PC에서 검색 가능.
- icon: ⌨️
  title: 글로벌 단축키
  desc: 어떤 창에서도 Win+Alt+E로 즉시 검색창 호출 (설정 가능).
:::

# 4. 설치 & 설정

::: steps
:::

::: alert-box
- type: tip
  title: 💡 PowerToys Run 연동:
  desc: Microsoft PowerToys 설치 후 Alt+Space → Everything 플러그인 활성화. PowerToys Run 검색창에서 Everything 검색 동시 사용 가능.
:::
