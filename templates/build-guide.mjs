#!/usr/bin/env node
/**
 * MD → HTML 가이드 변환기
 *
 * 사용법 (CLI):
 *   node templates/build-guide.mjs <input.md> [output.html]
 *   node templates/build-guide.mjs templates/template.md public/guides/MyGuide.html
 *
 * 옵션:
 *   --style <key>   styles.json의 키로 스타일 강제 지정 (frontmatter보다 우선)
 *
 * 모듈 import:
 *   import { buildHtml, parseShortcodeItems } from "./templates/build-guide.mjs";
 *   const { html, styleKey, fm } = buildHtml("mddata/Supabase.md", { style: "ai-dev" });
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = JSON.parse(fs.readFileSync(path.join(__dirname, "styles.json"), "utf8"));

// ════════════════════════════════════════════════════════════════
//  유틸리티
// ════════════════════════════════════════════════════════════════

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[c]));
}

function cleanValue(v) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function darkenHex(hex, amount = 40) {
  const h = (hex || "333333").replace(/^#/, "");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function parseShortcodeItems(src) {
  const items = [];
  let current = null;
  for (const line of src.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const first = line.match(/^\s*-\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    const next  = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (first) {
      current = {};
      items.push(current);
      current[first[1]] = cleanValue(first[2]);
    } else if (next && current) {
      current[next[1]] = cleanValue(next[2]);
    }
  }
  return items;
}

function renderShortcode(type, body) {
  const items = parseShortcodeItems(body);
  if (!items.length) return "";

  if (type === "icon-grid") {
    return `<div class="icon-grid">${items.map((item) => `
      <div class="icon-card">
        <div class="icon-card-icon">${escapeHtml(item.icon || "•")}</div>
        <div class="icon-card-title">${escapeHtml(item.title)}</div>
        <p>${escapeHtml(item.desc || item.description || "")}</p>
      </div>`).join("")}
    </div>`;
  }

  if (type === "feature-grid") {
    return `<div class="feature-grid">${items.map((item) => `
      <div class="feature-card">
        ${item.tag ? `<span class="feature-tag">${escapeHtml(item.tag)}</span>` : ""}
        <div class="feature-card-title">${escapeHtml(item.icon || "")} ${escapeHtml(item.title)}</div>
        <p>${escapeHtml(item.desc || item.description || "")}</p>
      </div>`).join("")}
    </div>`;
  }

  if (type === "steps") {
    return `<div class="step-list">${items.map((item, index) => `
      <div class="step-item">
        <div class="step-num">${escapeHtml(item.num || index + 1)}</div>
        <div>
          <div class="step-title">${escapeHtml(item.title)}</div>
          <p>${escapeHtml(item.desc || item.description || "")}</p>
        </div>
      </div>`).join("")}
    </div>`;
  }

  if (type === "compare-grid") {
    return `<div class="compare-grid">${items.map((item) => `
      <div class="compare-card">
        <div class="compare-card-title">${escapeHtml(item.title)}</div>
        <p>${escapeHtml(item.desc || item.description || "")}</p>
        ${item.note ? `<div class="compare-note">${escapeHtml(item.note)}</div>` : ""}
      </div>`).join("")}
    </div>`;
  }

  if (type === "tool-card") {
    return items.map((item) => {
      const color = cleanValue(item.color || "#333333");
      const dark  = darkenHex(color);
      return `<div class="tool-card"><div class="tc-header" style="background:linear-gradient(135deg,${color},${dark});"><div class="tc-icon">${escapeHtml(item.icon || "")}</div><div><div class="tc-name">${escapeHtml(item.name || "")}</div>${item.tagline ? `<div class="tc-sub">${escapeHtml(item.tagline)}</div>` : ""}</div>${item.badge ? `<div class="tc-badge">${escapeHtml(item.badge)}</div>` : ""}</div></div>`;
    }).join("\n");
  }

  if (type === "workflow") {
    const steps = items.map((item) =>
      `<div class="wf-step"><div class="wf-icon">${escapeHtml(item.icon || "")}</div><div class="wf-name">${escapeHtml(item.name || "")}</div>${item.tool ? `<div class="wf-tool">${escapeHtml(item.tool)}</div>` : ""}</div>`
    ).join("");
    return `<div class="workflow-strip">${steps}</div>`;
  }

  return "";
}

function renderShortcodes(src) {
  return src.replace(/^:::\s*([A-Za-z0-9_-]+)\s*\n([\s\S]*?)\n:::\s*$/gm, (_, type, body) => {
    const html = renderShortcode(type, body);
    return html ? `\n${html}\n` : "";
  });
}

// ════════════════════════════════════════════════════════════════
//  buildHtml — 핵심 변환 함수 (모듈 export + CLI 공용)
// ════════════════════════════════════════════════════════════════

/**
 * MD 파일을 읽어 스타일이 적용된 HTML 문자열을 반환합니다.
 * @param {string} inputPath  - MD 파일 경로
 * @param {{ style?: string }} opts
 * @returns {{ html: string, styleKey: string, fm: object }}
 */
export function buildHtml(inputPath, opts = {}) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const { data: fm, content } = matter(raw);

  const styleKey = opts.style || fm.style || "ai-chat";
  const style = STYLES[styleKey];
  if (!style) {
    const available = Object.keys(STYLES).filter(k => !k.startsWith("$")).join(", ");
    throw new Error(`Unknown style "${styleKey}". Available: ${available}`);
  }

  // ---- 마크다운 → HTML 섹션/카드 구조 ----
  function renderInline(tokens) {
    return marked.parser([{ type: "paragraph", tokens }]).replace(/^<p>|<\/p>\n?$/g, "");
  }

  const tokens = marked.lexer(renderShortcodes(content));
  let sectionNum = 0;
  let bodyHtml = "";
  let openSection = false;
  let openCard = false;

  function closeCard() {
    if (openCard) { bodyHtml += `</div>`; openCard = false; }
  }
  function closeSection() {
    closeCard();
    if (openSection) { bodyHtml += `</section>`; openSection = false; }
  }

  for (const tok of tokens) {
    if (tok.type === "heading" && tok.depth === 1) {
      closeSection();
      sectionNum++;
      const titleHtml = renderInline(tok.tokens);
      const m = titleHtml.match(/^\s*(\d+)\.\s*(.+)$/);
      const num   = m ? m[1] : String(sectionNum);
      const title = m ? m[2] : titleHtml;
      bodyHtml += `<section class="section"><div class="section-header"><div class="section-num">${num}</div><h2>${title}</h2></div>`;
      openSection = true;
    } else if (tok.type === "heading" && tok.depth === 2) {
      closeCard();
      if (!openSection) { bodyHtml += `<section class="section">`; openSection = true; }
      bodyHtml += `<div class="card"><h3 class="card-title">${renderInline(tok.tokens)}</h3>`;
      openCard = true;
    } else if (tok.type === "hr") {
      closeSection();
    } else {
      if (openSection && !openCard) { bodyHtml += `<div class="card">`; openCard = true; }
      bodyHtml += marked.parser([tok]);
    }
  }
  closeSection();

  // ---- Hero / Done / Footer ----
  const statsHtml = (fm.stats || [])
    .map(s => `<div class="hero-stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
    .join("");
  const heroCtaHtml = fm.heroCta?.label && fm.heroCta?.url
    ? `<a class="hero-cta" href="${escapeHtml(fm.heroCta.url)}" target="_blank" rel="noopener">${escapeHtml(fm.heroCta.label)}</a>`
    : "";
  const doneHtml = fm.done?.title
    ? `<section class="done-section"><h2>${escapeHtml(fm.done.title)}</h2>${fm.done.subtitle ? `<p>${escapeHtml(fm.done.subtitle)}</p>` : ""}${fm.done.ctaLabel && fm.done.ctaUrl ? `<a class="done-link" href="${escapeHtml(fm.done.ctaUrl)}" target="_blank" rel="noopener">${escapeHtml(fm.done.ctaLabel)}</a>` : ""}</section>`
    : "";
  const footerHtml = Array.isArray(fm.footer)
    ? fm.footer.map((line) => `<div>${marked.parseInline(String(line))}</div>`).join("")
    : (fm.footer || `${fm.title || "Guide"} · 스타일: ${style.label}`);

  // ---- 최종 HTML ----
  const html = `<!DOCTYPE html>
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
.hero-cta { display: inline-flex; align-items: center; gap: 8px; background: white; color: var(--brand-dark); font-weight: 800; font-size: 16px; padding: 13px 24px; border-radius: 100px; text-decoration: none; box-shadow: var(--shadow-lg); margin-bottom: 38px; transition: transform .2s, box-shadow .2s; }
.hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 44px rgba(0,0,0,0.18); }
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
.icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin: 18px 0; }
.icon-card { background: linear-gradient(180deg, white, var(--brand-light)); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: center; }
.icon-card-icon { width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 12px; border-radius: 14px; background: white; box-shadow: var(--shadow); font-size: 26px; }
.icon-card-title { font-weight: 800; color: var(--text); margin-bottom: 6px; }
.icon-card p { margin: 0; font-size: .88rem; color: var(--text-2); }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 18px 0; }
.feature-card { background: white; border: 2px solid var(--border); border-radius: var(--radius); padding: 22px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
.feature-card::before { content: ""; position: absolute; inset: 0 0 auto; height: 4px; background: var(--brand); }
.feature-tag { display: inline-flex; margin-bottom: 12px; background: var(--brand-light); color: var(--brand-dark); border: 1px solid var(--border); border-radius: 100px; padding: 3px 10px; font-size: .76rem; font-weight: 800; }
.feature-card-title { font-weight: 800; color: var(--text); font-size: 1.03rem; margin-bottom: 8px; }
.feature-card p { margin: 0; color: var(--text-2); font-size: .92rem; }
.step-list { display: flex; flex-direction: column; gap: 14px; margin: 18px 0; }
.step-item { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: start; background: white; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px; box-shadow: var(--shadow); }
.step-num { width: 44px; height: 44px; border-radius: 14px; background: var(--brand); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; }
.step-title { font-weight: 800; color: var(--text); margin-bottom: 4px; }
.step-item p { margin: 0; color: var(--text-2); }
.compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin: 18px 0; }
.compare-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.compare-card-title { font-weight: 800; color: var(--brand-dark); margin-bottom: 8px; }
.compare-card p { margin: 0 0 10px; color: var(--text-2); }
.compare-note { background: var(--brand-light); color: var(--brand-deep); border-radius: 8px; padding: 8px 10px; font-size: .84rem; font-weight: 700; }
.done-section { background: linear-gradient(135deg, var(--brand-deep), var(--brand)); color: white; padding: 72px 24px; text-align: center; }
.done-section h2 { font-family: 'Noto Serif KR', serif; font-size: clamp(1.8rem, 4vw, 2.6rem); margin-bottom: 10px; }
.done-section p { opacity: .86; margin-bottom: 24px; }
.done-link { display: inline-flex; align-items: center; background: white; color: var(--brand-dark); font-weight: 800; padding: 13px 24px; border-radius: 100px; text-decoration: none; box-shadow: var(--shadow-lg); }
.workflow-strip { display: flex; gap: 0; margin: 18px 0; overflow-x: auto; }
.wf-step { flex: 1; min-width: 120px; padding: 14px 10px; text-align: center; background: white; border: 1px solid var(--border); position: relative; }
.wf-step:not(:last-child)::after { content: '→'; position: absolute; right: -12px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: var(--text-3); z-index: 1; }
.wf-step:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.wf-step:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.wf-icon { font-size: 1.5rem; margin-bottom: 4px; }
.wf-name { font-size: .82rem; font-weight: 700; }
.wf-tool { font-size: .75rem; color: var(--text-3); }
.tool-card { background: white; border-radius: var(--radius); border: 2px solid var(--border); overflow: hidden; margin-bottom: 16px; box-shadow: var(--shadow); }
.tc-header { padding: 20px 24px; display: flex; align-items: center; gap: 14px; }
.tc-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.3rem; color: white; background: rgba(255,255,255,0.2); flex-shrink: 0; }
.tc-name { font-family: 'Noto Serif KR', serif; font-size: 1.2rem; font-weight: 700; color: white; }
.tc-sub { font-size: .85rem; color: rgba(255,255,255,0.8); margin-top: 2px; }
.tc-badge { margin-left: auto; background: rgba(255,255,255,0.25); padding: 5px 14px; border-radius: 100px; font-size: .82rem; font-weight: 700; color: white; white-space: nowrap; }
footer { text-align: center; padding: 40px 24px; color: var(--text-3); font-size: .85rem; border-top: 1px solid var(--border); margin-top: 40px; }
footer a { color: var(--brand); text-decoration: none; }
</style>
</head>
<body>
<header class="hero">
  <div class="hero-inner">
    ${fm.badge ? `<div class="hero-badge"><span></span>${fm.badge}</div>` : ""}
    ${fm.logo ? `<div class="hero-logo">${fm.logo}</div>` : ""}
    <h1>${fm.title || ""}</h1>
    ${fm.subtitle ? `<p>${fm.subtitle}</p>` : ""}
    ${heroCtaHtml}
    ${statsHtml ? `<div class="hero-stats">${statsHtml}</div>` : ""}
  </div>
</header>
<main>
${bodyHtml}
</main>
${doneHtml}
<footer>${footerHtml}</footer>
</body>
</html>
`;

  return { html, styleKey, fm };
}

// ════════════════════════════════════════════════════════════════
//  CLI 진입점 (직접 실행 시에만 동작)
// ════════════════════════════════════════════════════════════════

const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isMain) {
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

  try {
    const { html, styleKey, fm } = buildHtml(path.resolve(inputPath), { style: flags.style });
    const outPath = positional[1] || path.join(
      "public/guides",
      path.basename(inputPath, path.extname(inputPath)) + ".html"
    );
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`✅ Built: ${outPath}  (style: ${styleKey} — ${STYLES[styleKey].label})`);
  } catch (e) {
    console.error("❌", e.message);
    process.exit(1);
  }
}
