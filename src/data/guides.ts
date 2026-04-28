export type GuideCategory = {
  id: string;
  label: string;
  description: string;
  colorVar: string;
  guides: Guide[];
};

export type Guide = {
  slug: string;
  title: string;
  subtitle: string;
  file: string;
};

export const categories: GuideCategory[] = [
  {
    id: "ai-chat",
    label: "AI 챗봇 & 어시스턴트",
    description: "범용 AI 어시스턴트로 생각하고, 쓰고, 검색하기",
    colorVar: "--cat-chat",
    guides: [
      { slug: "chatgpt", title: "ChatGPT", subtitle: "OpenAI 대화형 AI 활용 가이드", file: "Chatgpt.html" },
      { slug: "claude", title: "Claude", subtitle: "Anthropic의 추론 강화형 AI", file: "Claude.html" },
      { slug: "gemini", title: "Gemini", subtitle: "Google 멀티모달 AI", file: "Gemini.html" },
      { slug: "grok", title: "Grok", subtitle: "xAI 실시간 대화형 AI", file: "Grok.html" },
      { slug: "perplexity", title: "Perplexity", subtitle: "출처 기반 AI 검색", file: "Perplexity.html" },
      { slug: "genspark", title: "Genspark", subtitle: "AI 에이전트 검색 엔진", file: "Genspark.html" },
      { slug: "manus", title: "Manus", subtitle: "자율 작업 AI 에이전트", file: "Manus.html" },
    ],
  },
  {
    id: "ai-dev",
    label: "AI 개발 도구",
    description: "코드 작성과 협업을 위한 개발 환경",
    colorVar: "--cat-dev",
    guides: [
      { slug: "antigravity", title: "Antigravity", subtitle: "AI 개발 생산성 플랫폼", file: "Antigravity.html" },
      { slug: "vscode", title: "VS Code", subtitle: "코드 에디터 완전 정복", file: "Vscode.html" },
      { slug: "github", title: "GitHub", subtitle: "버전 관리와 협업", file: "github.html" },
    ],
  },
  {
    id: "knowledge",
    label: "노트 & 지식 관리",
    description: "정보를 모으고 연결해 두 번째 뇌 만들기",
    colorVar: "--cat-knowledge",
    guides: [
      { slug: "notebooklm", title: "NotebookLM", subtitle: "Google AI 노트 도구", file: "NotebookLM.html" },
      { slug: "notebooklm-importer", title: "NotebookLM Importer", subtitle: "NotebookLM 자료 가져오기", file: "NotebookLM Importer.html" },
      { slug: "notion", title: "Notion", subtitle: "올인원 워크스페이스", file: "notion.html" },
      { slug: "obsidian", title: "Obsidian", subtitle: "로컬 마크다운 지식 그래프", file: "obsidian.html" },
    ],
  },
  {
    id: "productivity",
    label: "생산성 유틸리티",
    description: "PC 사용을 빠르게 만드는 필수 도구",
    colorVar: "--cat-prod",
    guides: [
      { slug: "everything", title: "Everything (에브리띵)", subtitle: "초고속 파일 검색", file: "Everything.html" },
      { slug: "grabit", title: "Grabit (그랩잇)", subtitle: "스크린 캡처 & 텍스트 추출", file: "Grabit.html" },
      { slug: "snipaste", title: "Snipaste", subtitle: "캡처와 화면 부착 도구", file: "Snipaste.html" },
    ],
  },
  {
    id: "creative",
    label: "크리에이티브 AI",
    description: "이미지 · 영상 · 디자인을 AI로 만들기",
    colorVar: "--cat-creative",
    guides: [
      { slug: "image-ai", title: "이미지 생성 AI", subtitle: "텍스트로 이미지 만들기", file: "이미지생성ai.html" },
      { slug: "video-music-ai", title: "영상 · 음악 AI", subtitle: "AI로 멀티미디어 제작", file: "영상음악AI.html" },
      { slug: "design-viz", title: "디자인 & 시각화", subtitle: "디자인 자동화와 데이터 시각화", file: "디자인및시각화.html" },
    ],
  },
];

export const allGuides = categories.flatMap((c) =>
  c.guides.map((g) => ({ ...g, categoryId: c.id, categoryLabel: c.label, colorVar: c.colorVar })),
);

export function findGuide(slug: string) {
  return allGuides.find((g) => g.slug === slug);
}

export function findCategoryByGuide(slug: string) {
  return categories.find((c) => c.guides.some((g) => g.slug === slug));
}