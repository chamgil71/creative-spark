---
title: 옵시디언(Obsidian) 완전 정복 가이드
subtitle: 마크다운 기반의 강력한 노트 앱. 내 데이터는 내 컴퓨터에, 지식은 그래프로 연결되어 새로운 인사이트를 만들어냅니다.
logo: 🔮
badge: 🔮 로컬 우선 지식 관리 도구
style: ai-chat
heroCta:
  label: 🔮 공식 사이트 바로가기
  url: https://obsidian.md
stats:
  - value: "무료"
    label: "개인 사용"
  - value: "1,400+"
    label: "커뮤니티 플러그인"
  - value: "로컬"
    label: "데이터 완전 소유"
  - value: "Markdown"
    label: "표준 포맷"
done:
  title: 🔮 지식을 연결하고, 생각을 성장시키세요
  subtitle: 첫 볼트를 만들고, 첫 링크를 연결하는 것부터 시작하세요.
  ctaLabel: 🔮 옵시디언 다운로드
  ctaUrl: https://obsidian.md
footer:
  - Obsidian은 Dynalist Inc.에서 개발한 지식 관리 도구입니다.
  - "공식 사이트: [obsidian.md](https://obsidian.md) | 도움말: [help.obsidian.md](https://help.obsidian.md)"
---

# 1. 옵시디언이란?

옵시디언은 마크다운(.md) 파일을 기반으로 동작하는 로컬 지식 관리 도구입니다. 모든 데이터는 내 컴퓨터에 저장됩니다.

::: icon-grid
- icon: 🧠
  title: 두 번째 뇌 (Second Brain)
  desc: PKM(개인 지식 관리) 방법론을 실현하는 도구. 생각과 정보를 체계적으로 수집·연결·활용할 수 있습니다.
- icon: 📁
  title: Vault (볼트)
  desc: 옵시디언의 작업 단위. 하나의 폴더가 하나의 볼트가 됩니다. 모든 노트와 첨부파일이 이 폴더 안에 저장됩니다.
- icon: 🔗
  title: 내부 링크 ([[wikilink]])
  desc: [[노트이름]] 형식으로 노트 간 연결. 이 링크들이 쌓여 지식 그래프가 완성됩니다.
- icon: 🏷️
  title: 태그 & 프로퍼티
  desc: #태그와 YAML 프론트매터로 노트를 분류·필터링할 수 있습니다.
- icon: 🗺️
  title: 그래프 뷰 (Graph View)
  desc: 모든 노트와 연결 관계를 시각화. 지식의 클러스터와 고립된 노트를 한눈에 파악할 수 있습니다.
- icon: 🔌
  title: 플러그인 생태계
  desc: 공식 코어 플러그인과 1,400개 이상의 커뮤니티 플러그인으로 기능을 무한히 확장할 수 있습니다.
:::

# 2. 꼭 알아야 할 핵심 기능

옵시디언을 강력하게 만드는 주요 기능들을 소개합니다.

::: icon-grid
- icon: 📎
  title: 백링크 (Backlinks)
  desc: 현재 노트를 링크한 다른 노트들의 목록을 자동으로 표시합니다. "이 개념이 어디서 언급되었는가"를 역추적할 수 있어 지식의 맥락을 풍부하게 만들어줍니다.
:::

# 3. 그래프 뷰: 지식 지도

연결된 노트들을 시각화하여 지식 구조를 한눈에 파악합니다.

AI

독서

프로젝트

아이디어

일기

연구

::: alert-box
- type: tip
  desc: 💡 그래프 뷰 활용 팁 노드 크기: 링크가 많을수록 노드가 커집니다 — 허브 노트를 식별할 수 있습니다 색상 필터: 태그별로 노드 색상을 다르게 설정하면 카테고리가 한눈에 보입니다 고립 노트: 연결이 없는 노트를 찾아 링크를 추가하면 지식 그래프가 풍부해집니다 로컬 그래프: 현재 노트와 연결된 노트만 보여주는 뷰도 활용해보세요
:::

# 4. 필수 커뮤니티 플러그인

설정 → 커뮤니티 플러그인 → 탐색에서 설치할 수 있습니다.

::: icon-grid
- icon: 📅
  desc: 고급 템플릿 기능. 날짜, 파일명, 스크립트를 템플릿에 삽입할 수 있습니다.
  tag: 커뮤니티
- icon: ✅
  desc: 볼트 전체의 할 일을 한 곳에 모아서 관리합니다. 마감일, 우선순위 설정 가능.
  tag: 커뮤니티
- icon: 📊
  desc: 노트를 데이터베이스처럼 쿼리합니다. 특정 태그, 날짜, 속성을 가진 노트 목록을 동적으로 생성합니다.
  tag: 커뮤니티
- icon: 🤖
  desc: ChatGPT, Claude 등 AI를 옵시디언 내에서 직접 사용합니다. 노트 요약, 번역, 질문 응답 등.
  tag: 커뮤니티
- icon: 🗂️
  desc: 노트 파일로 칸반 보드를 생성합니다. 프로젝트 관리와 작업 흐름 시각화에 활용됩니다.
  tag: 커뮤니티
- icon: 🌐
  desc: 브라우저에서 웹페이지를 클리핑하여 옵시디언 볼트로 저장합니다. (공식 확장)
  tag: 공식
- icon: 🎨
  desc: 옵시디언 내에서 손으로 그린 듯한 다이어그램을 작성합니다. 노트에 직접 삽입 가능.
  tag: 커뮤니티
- icon: ⏱️
  desc: 주간, 월간, 분기별, 연간 노트를 자동으로 생성하고 관리합니다.
  tag: 커뮤니티
:::

# 5. 필수 단축키

이 단축키들만 익혀도 작업 속도가 크게 향상됩니다.

| 기능 | Mac | Windows / Linux |
| --- | --- | --- |
| 커맨드 팔레트 (모든 명령어) | ⌘ + P | Ctrl + P |
| 퀵 스위처 (노트 이동) | ⌘ + O | Ctrl + O |
| 새 노트 생성 | ⌘ + N | Ctrl + N |
| 전체 검색 | ⌘ + Shift + F | Ctrl + Shift + F |
| 편집/읽기 모드 전환 | ⌘ + E | Ctrl + E |
| 그래프 뷰 열기 | ⌘ + G | Ctrl + G |
| 내부 링크 삽입 | [ [ | [ [ |
| 분할 편집기 열기 | ⌘ + \ | Ctrl + \ |
| 굵게 / 기울임 | ⌘ + B / I | Ctrl + B / I |
| 오늘의 데일리 노트 | ⌘ + Shift + D | Ctrl + Shift + D |

# 6. 실전 활용 팁

옵시디언을 더 잘 활용하기 위한 방법론과 노하우입니다.

::: alert-box
- type: tip
  desc: Projects / Areas / Resources / Archives 4개 폴더로 모든 정보를 분류합니다. 가장 널리 사용되는 PKM 구조입니다.
:::

::: alert-box
- type: tip
  desc: 각 노트는 하나의 아이디어만 담습니다. 짧고 원자적(Atomic)인 노트를 만들고 링크로 연결하면 지식이 유기적으로 성장합니다.
:::

::: alert-box
- type: tip
  desc: 🤖 AI와 함께 쓰기 Copilot 플러그인으로 노트를 Claude/ChatGPT와 연결하여 요약·확장·번역 웹에서 찾은 정보를 Web Clipper로 저장 후 AI로 가공 NotebookLM에 볼트의 핵심 노트를 업로드하여 대화형 질의응답 활용
:::

::: alert-box
- type: tip
  desc: ⚡ 속도 향상 팁 Quick Switcher로 마우스 없이 노트 간 이동 커맨드 팔레트(⌘P)로 모든 기능에 키보드로 접근 Workspace 저장으로 자주 쓰는 패널 배치를 저장·불러오기 스타 기능(즐겨찾기)으로 핵심 노트 빠르게 접근
:::
