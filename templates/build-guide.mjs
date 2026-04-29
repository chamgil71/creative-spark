#!/usr/bin/env node
/**
 * MD → HTML 가이드 변환기
 *
 * 사용법:
 *   node templates/build-guide.mjs <input.md> [output.html]
 *   node templates/build-guide.mjs templates/template.md public/guides/MyGuide.html
 *
 * 옵션:
 *   --style <key>   styles.json의 키로 스타일 강제 지정 (frontmatter보다 우선)
 *   --open          빌드 후 결과 파일 경로 출력
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = JSON.parse(fs.readFileSync(path.join(__dirname, "styles.json"), "utf8"));

// ---- CLI ----
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) flags[a.slice(2)] = argv[i + 1]?.startsWith("--") || !argv[i + 1] ? true : argv[++i];
  else positional.push(a);
}
const inputPath = positional[0];
if (!inputPath) {
  console.error("Usage: node templates/build-guide.mjs <input.md> [output.html] [--style <key>]");
  console.error("Available styles:", Object.keys(STYLES).filter(k => !k.startsWith("$")).join(", "));
  process.exit(1);
}
const raw = fs.readFileSync(inputPath, "utf8");
const { data: fm, content } = matter(raw);

const styleKey = flags.style || fm.style || "ai-chat";
const style = STYLES[styleKey];
if (!style) {
  console.error(`Unknown style "${styleKey}". Available:`, Object.keys(STYLES).filter(k => !k.startsWith("$")).join(", "));
  process.exit(1);
}

// ---- Marked 커스터마이즈: # 헤딩을 섹션으로, ## 를 카드로 ----
const tokens = marked.lexer(content);
let sectionNum = 0;
let html = "";
let openSection = false;
let openCard = false;

function closeCard() {
  if (openCard) { html += `</div>`; openCard = false; }
}
function closeSection() {
  closeCard();
  if (openSection) { html += `</section>`; openSection = false; }
}

function renderInline(tokens) {
  return marked.parser([{ type: "paragraph", tokens }]).replace(/^<p>|<\/p>\n?$/g, "");
}

for (const tok of tokens) {
  if (tok.type === "heading" && tok.depth === 1) {
    closeSection();
    sectionNum++;
    const titleHtml = renderInline(tok.tokens);
    // "1. 제목" 형식이면 번호 분리
    const m = titleHtml.match(/^\s*(\d+)\.\s*(.+)$/);
    const num = m ? m[1] : String(sectionNum);
    const title = m ? m[2] : titleHtml;
    html += `<section class="section"><div class="section-header"><div class="section-num">${num}</div><h2>${title}</h2></div>`;
    openSection = true;
  } else if (tok.type === "heading" && tok.depth === 2) {
    closeCard();
    if (!openSection) { html += `<section class="section">`; openSection = true; }
    html += `<div class="card"><h3 class="card-title">${renderInline(tok.tokens)}</h3>`;
    openCard = true;
  } else if (tok.type === "hr") {
    closeSection();
  } else {
    if (openSection && !openCard) { html += `<div class="card">`; openCard = true; }
    html += marked.parser([tok]);
  }
}
closeSection();

// ---- Hero stats ----
const statsHtml = (fm.stats || [])
  .map(s => `<div class="hero-stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
  .join("");

// ---- 최종 HTML ----
const out = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${fm.title || "가이드"}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet" />
<style>
:root {
  --brand: ${style.brand};
  --brand-dark: ${style.brandDark};
  --brand-deep: ${style.brandDeep};
  --brand-light: ${style.brandLight};
  --brand-mid: ${style.brandMid};
  --text: #1A1A2E;
  --text-2: #4B5575;
  --text-3: #8892B0;
  --bg: ${style.bg};
  --white: #FFFFFF;
  --border: ${style.border};
  --shadow: 0 4px 24px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.10);
  --radius: 16px;
  --radius-sm: 10px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Noto Sans KR', sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; font-size: 16px; }
.hero { background: ${style.heroGradient}; color: white; padding: 80px 24px 60px; text-align: center; position: relative; overflow: hidden; }
.hero-inner { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 500; margin-bottom: 28px; }
.hero-logo { width: 90px; height: 90px; margin: 0 auto 24px; background: rgba(255,255,255,0.12); border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.2); font-size: 44px; }
.hero h1 { font-family: 'Noto Serif KR', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
.hero p { font-size: 1.1rem; opacity: .85; margin-bottom: 40px; }
.hero-stats { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
.hero-stat { text-align: center; }
.hero-stat strong { display: block; font-size: 1.6rem; font-weight: 700; }
.hero-stat span { font-size: .8rem; opacity: .7; }
main { max-width: 960px; margin: 0 auto; padding: 60px 24px; }
.section { margin-bottom: 72px; }
.section-header { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
.section-num { width: 40px; height: 40px; background: var(--brand); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; }
.section-header h2 { font-family: 'Noto Serif KR', serif; font-size: 1.6rem; font-weight: 700; }
.card { background: white; border-radius: var(--radius); border: 1px solid var(--border); padding: 28px; box-shadow: var(--shadow); margin-bottom: 16px; }
.card-title { font-family: 'Noto Serif KR', serif; font-size: 1.2rem; font-weight: 700; color: var(--brand-dark); margin-bottom: 14px; }
.card h4 { font-size: 1rem; font-weight: 700; margin: 18px 0 8px; color: var(--text); }
.card p { margin-bottom: 12px; color: var(--text-2); }
.card ul, .card ol { margin: 8px 0 14px 22px; color: var(--text-2); }
.card li { margin-bottom: 6px; }
.card a { color: var(--brand); text-decoration: none; border-bottom: 1px solid var(--brand-mid); }
.card a:hover { color: var(--brand-dark); }
.card strong { color: var(--text); font-weight: 700; }
.card blockquote { background: var(--brand-light); border-left: 4px solid var(--brand); border-radius: var(--radius-sm); padding: 14px 18px; margin: 14px 0; color: var(--brand-deep); }
.card blockquote p { margin: 0; color: var(--brand-deep); }
.card code { background: var(--brand-light); color: var(--brand-dark); padding: 2px 6px; border-radius: 4px; font-size: .9em; font-family: 'JetBrains Mono', monospace; }
.card pre { background: #0A0F1E; color: #E2E8F0; border-radius: var(--radius-sm); padding: 18px 20px; overflow-x: auto; margin: 14px 0; font-size: .88rem; line-height: 1.6; }
.card pre code { background: transparent; color: #E2E8F0; padding: 0; }
.card table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: .92rem; }
.card th { background: var(--brand-light); color: var(--brand-dark); text-align: left; padding: 10px 12px; font-weight: 700; border-bottom: 2px solid var(--brand-mid); }
.card td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-2); }
.card tr:hover td { background: var(--brand-light); }
.card hr { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
footer { text-align: center; padding: 40px 24px; color: var(--text-3); font-size: .85rem; border-top: 1px solid var(--border); margin-top: 40px; }
</style>
</head>
<body>
<header class="hero">
  <div class="hero-inner">
    ${fm.badge ? `<div class="hero-badge"><span></span>${fm.badge}</div>` : ""}
    ${fm.logo ? `<div class="hero-logo">${fm.logo}</div>` : ""}
    <h1>${fm.title || ""}</h1>
    ${fm.subtitle ? `<p>${fm.subtitle}</p>` : ""}
    ${statsHtml ? `<div class="hero-stats">${statsHtml}</div>` : ""}
  </div>
</header>
<main>
${html}
</main>
<footer>${fm.footer || `${fm.title || "Guide"} · 스타일: ${style.label}`}</footer>
</body>
</html>
`;

const outPath = positional[1] || path.join(
  "public/guides",
  path.basename(inputPath, path.extname(inputPath)) + ".html"
);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, "utf8");
console.log(`✅ Built: ${outPath}  (style: ${styleKey} — ${style.label})`);