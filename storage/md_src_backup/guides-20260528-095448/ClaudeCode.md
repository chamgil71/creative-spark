---
title: 클로드 코드 설치 가이드
subtitle: "처음 설치하는 분도 걱정 없어요!차근차근 따라오시면 누구든 설치할 수 있습니다 😊"
logo: 클로드
badge: 🎉 완전 초보자 맞춤 가이드
style: ai-chat
heroCta:
  label: 시작하기
  url: #what
stats:
  - value: "약 10분"
    label: "설치 소요 시간"
  - value: "3가지"
    label: "운영체제 지원"
  - value: "무료"
    label: "Node.js 설치"
done:
  title: "🎉 설치 완료! 이제 시작해봐요"
  subtitle: "아래 명령어들로 클로드 코드의 다양한 기능을 탐험해보세요!"
  ctaLabel: 📚 공식 문서 바로가기
  ctaUrl: https://docs.claude.com/en/docs/claude-code/overview
footer:
  - 이 가이드는 Anthropic 공식 문서를 기반으로 제작되었습니다.
  - "공식 문서: [docs.claude.com](https://docs.claude.com/en/docs/claude-code/overview) | npm: [@anthropic-ai/claude-code](https://npmjs.com/package/@anthropic-ai/claude-code)"
---

# 1. 클로드 코드란 무엇인가요?
설치하기 전에 클로드 코드가 어떤 도구인지 간단히 알아봐요!

::: icon-grid
- icon: "💬"
  title: "말로 하는 코딩 도우미"
  desc: "\"이 코드가 왜 오류가 나요?\" 처럼 우리말로 물어보면 AI가 답해줍니다."
  color: "#EBF2FF"
- icon: "📁"
  title: "내 컴퓨터 파일과 직접 연결"
  desc: "인터넷 창에 붙여넣기 할 필요 없이, 내 컴퓨터 파일을 직접 분석합니다."
  color: "#F0FDF4"
- icon: "⚡"
  title: "터미널(명령 창)에서 동작"
  desc: "검은 화면의 터미널에서 실행하지만, 사용 방법은 매우 간단합니다!"
  color: "#FFF7ED"
- icon: "🔄"
  title: "Claude.ai 와는 다른 도구"
  desc: "claude.ai(웹사이트)와 별개로 설치해서 쓰는 전문 개발자 도구입니다."
  color: "#FDF4FF"
:::

# 2. 설치 전 준비물을 확인해요
아래 항목들을 미리 준비하시면 설치가 훨씬 매끄럽게 진행됩니다.

::: feature-grid
- icon: "💻"
  title: "지원 운영체제"
  tag: "필수 확인"
  desc: "Windows, macOS(맥), Linux 모두 지원됩니다. 본인의 운영체제에 맞는 설치 방법을 선택해 주세요."
  color: "#EBF2FF"
- icon: "🟢"
  title: "Node.js (버전 18 이상)"
  tag: "필수 설치"
  desc: "클로드 코드가 동작하려면 Node.js가 필요합니다. 아직 없다면 설치 과정에서 함께 안내해 드려요."
  color: "#F0FDF4"
- icon: "🔑"
  title: "Anthropic 계정"
  tag: "필수"
  desc: "claude.ai 계정이 있으면 됩니다. Claude Pro ($20/월) 이상 구독 또는 API 키가 필요합니다."
  color: "#FFF7ED"
- icon: "📶"
  title: "인터넷 연결"
  tag: "필수"
  desc: "설치 중 파일 다운로드 및 인증에 인터넷이 필요합니다. 안정적인 Wi-Fi 환경을 권장합니다."
  color: "#F5F3FF"
- icon: "⚡"
  title: "관리자 권한"
  tag: "경우에 따라"
  desc: "설치 시 컴퓨터 관리자 비밀번호를 묻는 경우가 있을 수 있습니다. 미리 비밀번호를 확인해 두세요."
  color: "#FEF2F2"
- icon: "🐙"
  title: "Git (선택)"
  tag: "권장 사항"
  desc: "코드 버전 관리를 위한 Git이 있으면 더 편리합니다. Windows 사용자는 Git for Windows를 권장합니다."
  color: "#F0FDF4"
:::

::: alert-box tip
- title: "Node.js가 뭔가요?"
  desc: "💡 JavaScript 프로그래밍 언어를 컴퓨터에서 직접 실행할 수 있게 해주는 도구입니다. 클로드 코드 내부적으로 이것을 사용하기 때문에 미리 설치되어 있어야 합니다. 마치 한글 문서를 열기 위해 '한글(HWP)' 프로그램이 필요한 것과 같아요!"
:::

# 3. 본인의 운영체제를 선택해 주세요
사용하시는 컴퓨터 종류에 맞는 탭을 눌러주세요. 각 탭마다 맞춤 설치 방법을 안내해 드립니다.

::: os-tabs
- title: "macOS (맥)"
  desc: |
    #### 1. 터미널 열기
    * **방법 1:** `Cmd + Space`를 누르고 **터미널** 또는 **Terminal**을 입력한 뒤 Enter를 누르세요.
    * **방법 2:** Finder -> 응용 프로그램 -> 유틸리티 -> 터미널을 클릭하세요.

    #### 2. Node.js 설치 여부 확인
    터미널에 아래 명령어를 입력하고 Enter를 누르세요.
    ```bash
    node --version
    ```
    * 결과가 `v18.0.0` 이상이면 이미 설치되어 있으므로 3단계로 바로 이동하세요!
    * 에러가 나거나 낮은 버전이면 아래 공식 스크립트로 자동 설치해 주세요.
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```

    #### 3. 클로드 코드 설치
    터미널에 아래 명령어를 입력하여 설치합니다.
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
    *(또는 `npm install -g @anthropic-ai/claude-code` 사용 가능)*

    설치 완료 후 아래 명령어로 정상 설치 여부를 확인합니다.
    ```bash
    claude --version
    ```
- title: "Windows"
  desc: |
    #### 1. PowerShell 열기
    키보드에서 `Windows` 키를 누르고 **PowerShell**을 검색해 클릭하여 실행하세요.

    #### 2. 공식 설치 스크립트 실행
    PowerShell에 아래 명령어를 입력하고 Enter를 누르세요.
    ```powershell
    irm https://claude.ai/install.ps1 | iex
    ```
    * 보안 오류가 발생하는 경우 아래 명령어를 먼저 입력하세요.
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    #### 3. Node.js 별도 설치 방법 (위 방법 실패 시)
    * 공식 스크립트가 잘 안 될 경우 [nodejs.org](https://nodejs.org)에 접속해 **LTS 버전**을 설치하세요.
    * 설치 완료 후 PowerShell을 완전히 닫았다가 다시 열고 아래 명령어로 수동 설치하세요.
    ```powershell
    npm install -g @anthropic-ai/claude-code
    ```

    #### 4. 설치 확인
    ```powershell
    claude --version
    ```
- title: "Linux"
  desc: |
    #### 1. 터미널 열기
    `Ctrl + Alt + T` 단축키로 터미널을 실행하거나 애플리케이션 메뉴에서 검색해 주세요.

    #### 2. 공식 설치 스크립트 실행
    아래 명령어를 입력해 설치하세요.
    ```bash
    curl -fsSL https://claude.ai/install.sh | bash
    ```
    설치 후 셸 설정을 새로고침해 줍니다.
    ```bash
    source ~/.bashrc  # 또는 source ~/.zshrc
    ```

    #### 3. Node.js 수동 설치 (필요 시)
    Node.js가 아예 설치되어 있지 않은 경우:
    ```bash
    sudo apt update && sudo apt install nodejs npm -y
    npm install -g @anthropic-ai/claude-code
    ```
:::

# 4. 처음으로 클로드 코드 실행하기
설치가 끝났으면 이제 실행해볼까요? 처음 실행 시 로그인이 필요합니다.

::: workflow-strip
- title: "claude 입력"
  meta: "터미널에 입력"
  icon: "⌨"
- title: "브라우저 열림"
  meta: "인증창 자동 호출"
  icon: "🌐"
- title: "로그인"
  meta: "Claude 계정 로그인"
  icon: "🔑"
- title: "권한 허용"
  meta: "Authorize 버튼 허용"
  icon: "🔒"
- title: "시작!"
  meta: "사용 준비 완료 🎉"
  icon: "🎉"
:::

::: step-list
- title: "클로드 코드 실행하기"
  desc: "처음 실행 시 자동으로 로그인 화면이 나타납니다"
  meta: "▶"
- title: "첫 번째 대화 시도해보기"
  desc: "로그인 후 바로 대화를 시작할 수 있어요"
  meta: "✓"
- title: "자주 쓰는 명령어"
  desc: "기본 명령어를 알아두면 편리해요"
  meta: "⌨"
:::

# 5. 설치 중 문제가 생겼나요?
가장 자주 발생하는 문제와 해결 방법을 모아봤습니다. 아래 항목을 클릭하면 해결 방법이 펼쳐집니다.

::: faq-list
- title: "\"command not found: claude\" 오류가 나요"
  desc: "설치는 됐지만 터미널이 claude 명령어 위치를 아직 모르는 경우입니다."
- title: "npm 설치 시 \"EACCES: permission denied\" 오류가 나요"
  desc: "npm이 시스템 폴더에 쓰려고 할 때 발생하는 권한 오류입니다. 아래처럼 npm 전역 설치 경로를 내 폴더로 바꿔주세요."
- title: "Node.js 버전이 너무 낮다고 해요 (18 미만)"
  desc: "Node.js를 최신 LTS 버전으로 업그레이드해야 합니다."
- title: "로그인이 안 되거나 인증 오류가 나요"
  desc: "인증을 초기화하고 다시 시도해보세요."
- title: "Windows에서 \"Claude Code is not supported on Windows\" 오류가 나요"
  desc: "CMD나 일반 PowerShell에서 WSL(Linux) 없이 실행할 때 발생합니다. 공식 PowerShell 설치 스크립트를 사용하면 대부분 해결됩니다."
- title: "설치는 됐는데 너무 느려요 / 응답이 없어요"
  desc: "인터넷 연결 상태를 먼저 확인해주세요. 클로드 코드는 매 응답마다 Anthropic 서버와 통신합니다."
:::

# ❓. 자주 묻는 질문
설치 전후로 많이 물어보시는 질문들을 모았습니다.

::: faq-list
- title: "클로드 코드는 무료인가요?"
  desc: "클로드 코드 자체는 무료로 설치할 수 있지만, 사용하려면 Claude Pro($20/월) 이상 구독 또는 Anthropic API 키(사용량 기반 요금)가 필요합니다. Node.js는 완전 무료입니다."
- title: "Claude.ai와 클로드 코드의 차이가 뭔가요?"
  desc: "Claude.ai는 웹 브라우저에서 쓰는 채팅 서비스입니다. 클로드 코드는 내 컴퓨터 파일과 직접 연결되어 동작하는 개발자용 도구입니다. 둘 다 같은 AI를 사용하지만 목적과 방식이 다릅니다."
- title: "코딩을 전혀 모르는데 써도 되나요?"
  desc: "네! 한국어로 자유롭게 질문하면 됩니다. 다만 설치 과정에서 터미널 명령어를 입력해야 하므로 이 가이드를 잘 따라와 주세요. 설치 후 사용은 채팅처럼 편합니다."
- title: "Mac, Windows, Linux 모두 되나요?"
  desc: "네, 세 운영체제 모두 공식 지원됩니다. 이 가이드의 각 탭에서 운영체제별 설치 방법을 안내하고 있습니다."
- title: "설치 후 업데이트는 어떻게 하나요?"
  desc: "클로드 코드는 실행할 때마다 자동으로 최신 버전을 확인하고 업데이트합니다. 수동으로 업데이트하려면 터미널에 claude update를 입력하면 됩니다."
- title: "제 코드나 파일이 외부에 유출되나요?"
  desc: "클로드 코드가 파일을 읽을 때 해당 내용이 Anthropic 서버로 전송됩니다. 민감한 정보(비밀번호, 개인정보 등)가 담긴 파일은 주의하여 사용하세요. 자세한 내용은 Anthropic 개인정보처리방침을 확인하세요."
- title: "삭제(제거)는 어떻게 하나요?"
  desc: "터미널에서 npm uninstall -g @anthropic-ai/claude-code를 입력하면 삭제됩니다. 공식 스크립트로 설치했다면 ~/.claude 또는 ~/.local/bin/claude 파일을 삭제하면 됩니다."
- title: "한국어로 대화할 수 있나요?"
  desc: "물론입니다! 클로드 코드는 한국어를 완벽하게 지원합니다. 질문도 한국어로, 답변도 한국어로 받을 수 있습니다."
:::