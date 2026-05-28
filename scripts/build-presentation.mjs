#!/usr/bin/env node
/**
 * build-presentation.mjs
 * Markdown -> Slide HTML (Full-screen, Horizontal Scrolling Presentation Mode)
 * Supports combining multiple markdown files, folders, and globs into a single deck!
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_DIR = path.join(ROOT, "config");

// Load configs (reused from build-guide)
function loadJsonWithComments(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const src = fs.readFileSync(filePath, "utf8").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(src);
}

const STYLES = loadJsonWithComments(path.join(CONFIG_DIR, "styles.json"));
const CONFIG = loadJsonWithComments(path.join(CONFIG_DIR, "pptdesign.config.json"));

// Helpers
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function cleanValue(v) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function splitMeta(meta) {
  if (!meta) return [];
  return String(meta).split(/[|\n]/).map(s => s.trim().replace(/^["']|["']$/g, "").trim()).filter(Boolean);
}

function standardizeItem(item) {
  const rawName = item.name || item.title || "";
  const iconMatch = rawName.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*(.*)$/);
  const icon =     item.icon || (iconMatch ? iconMatch[1] : "") || "";
  const title =    item.title || (iconMatch ? iconMatch[2] : item.name) || item.col || "";
  const desc =     item.desc || item.description || item.tagline || item.body || "";
  const tag =      item.tag || item.badge || item.type || "";
  const color =    item.color || "";
  const featured = String(item.featured || "").trim().toLowerCase() === "true" ? "true" : "";
  const meta = item.meta || item.tool || item.features || item.items || item.points || "";
  const note = item.note || "";

  return { ...item, icon, title, desc, tag, meta, note, color, featured };
}

function parseShortcodeItems(src) {
  const items = [];
  let current = null;
  let currentKey = null;
  let inLiteralBlock = false;

  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (inLiteralBlock && line.startsWith("    ")) {
      const val = line.slice(4);
      const sep = currentKey === 'meta' ? ' | ' : '\n';
      const existing = current[currentKey];
      current[currentKey] = (!existing || existing === '|') ? val : existing + sep + val;
      continue;
    } else {
      inLiteralBlock = false;
    }

    const firstMatch = line.match(/^\s*-\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (firstMatch) {
      currentKey = firstMatch[1];
      let val = cleanValue(firstMatch[2]);
      if (val === "|") {
        inLiteralBlock = true;
        current = { [currentKey]: "" };
      } else {
        current = { [currentKey]: val };
      }
      items.push(current);
      continue;
    }

    const nextMatch = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (nextMatch && current) {
      currentKey = nextMatch[1];
      let val = cleanValue(nextMatch[2]);
      if (val === "|") {
        inLiteralBlock = true;
        current[currentKey] = "";
      } else {
        current[currentKey] = val;
      }
      continue;
    }

    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && current && currentKey) {
      const val = listMatch[1].trim();
      const existing = current[currentKey];
      const sep = currentKey === 'meta' ? ' | ' : '\n';
      current[currentKey] = (!existing || existing === '|') ? val : existing + sep + val;
      continue;
    }

    if (line.match(/^\s+\S/) && current && currentKey) {
      const val = line.trim();
      if (val === '|') {
        inLiteralBlock = true;
        continue;
      }
      const existing = current[currentKey];
      const sep = currentKey === 'meta' ? ' | ' : '\n';
      current[currentKey] = (!existing || existing === '|') ? val : existing + sep + val;
    }
  }

  return items.map(standardizeItem);
}

// Render shortcode (same visual blocks as build-guide)
function renderShortcode(type, body, args) {
  const items = parseShortcodeItems(body);
  if (!items.length) return "";

  const renderAccent = (color) => color ? `style="border-color: ${color}; background-color: ${color}08;"` : "";
  const renderTextColor = (color) => color ? `style="color: ${color};"` : "";

  const colsMatch = (args || "").match(/cols=(\d+)/);
  const cols = colsMatch ? colsMatch[1] : null;
  const gridStyle = cols ? `style="grid-template-columns: repeat(${cols}, 1fr);"` : "";

  if (["icon-grid", "feature-grid", "badge-grid", "stat-grid"].includes(type)) {
    const isBadge = type === "badge-grid";
    const isFeat = type === "feature-grid";
    const isStat = type === "stat-grid";
    const clsName = isBadge ? "badge-grid" : (isFeat ? "feature-grid" : (isStat ? "stat-grid" : "icon-grid"));

    return `<div class="${clsName}" ${gridStyle}>${items.map(it => {
      if (isBadge) {
        return `<div class="badge-item" ${renderAccent(it.color)}>
          <div class="badge-icon">${escapeHtml(it.icon)}</div>
          <div class="badge-title" style="color: var(--text);">${escapeHtml(it.title)}</div>
          <div class="badge-tag">${escapeHtml(it.tag)}</div>
        </div>`;
      }
      if (isStat) {
        return `<div class="stat-card" ${it.color ? `style="border-top: 3px solid ${it.color};"` : `style="border-top: 3px solid var(--brand);"`}>
          <div class="stat-val" ${it.color ? `style="color:${it.color}"` : ""}>${escapeHtml(it.icon || it.title)}</div>
          ${it.icon ? `<div class="stat-name">${escapeHtml(it.title)}</div>` : ""}
          ${it.desc ? `<div class="stat-note">${escapeHtml(it.desc)}</div>` : ""}
        </div>`;
      }
      return `<div class="${isFeat ? 'feature-card' : 'icon-card'}" ${renderAccent(it.color)}>
        ${isFeat && it.color ? `<div class="card-top-bar" style="background-color:${it.color}"></div>` : ''}
        ${it.tag ? `<span class="feature-tag" ${it.color ? `style="background:${it.color}; color:#fff;"` : ""}>${escapeHtml(it.tag)}</span>` : ""}
        ${isFeat ? `
          <div class="feature-card-title" style="color: var(--brand-light);">
            ${it.icon ? `<span class="fc-icon">${escapeHtml(it.icon)}</span>` : ""}${escapeHtml(it.title)}
          </div>
        ` : `
          <div class="icon-card-icon" style="color: var(--brand);">${escapeHtml(it.icon)}</div>
          <div class="icon-card-title" style="color: var(--text);">${escapeHtml(it.title)}</div>
        `}
        <p>${escapeHtml(it.desc)}</p>
      </div>`;
    }).join("")}</div>`;
  }

  if (type === "tool-box") {
    return items.map(it => {
      const grad = it.color ? `linear-gradient(135deg, ${it.color}, ${it.color}CC)` : `var(--brand-gradient)`;
      const metaItems = splitMeta(it.meta);
      return `<div class="tool-card">
        <div class="tc-header" style="background: ${grad}; color: #fff;">
          <div class="tc-icon">${escapeHtml(it.icon)}</div>
          <div class="tc-content">
            <div class="tc-name">${escapeHtml(it.title)}</div>
            <div class="tc-sub">${escapeHtml(it.desc)}</div>
          </div>
          ${it.tag ? `<div class="tc-badge">${escapeHtml(it.tag)}</div>` : ""}
        </div>
        ${metaItems.length ? `<ul class="tc-list">${metaItems.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");
  }

  if (type === "workflow-strip") {
    return `<div class="workflow-strip">${items.map((it, idx) => `
      <div class="wf-step" ${renderAccent(it.color)}>
        <div class="wf-icon" ${it.color ? `style="background:${it.color}; color:#fff;"` : ""}>${escapeHtml(it.icon)}</div>
        <div class="wf-name" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <div class="wf-tool">${escapeHtml(it.meta)}</div>
        ${idx < items.length - 1 ? `<div class="wf-arrow">→</div>` : ""}
      </div>`).join("")}</div>`;
  }

  if (type === "step-list") {
    return `<div class="step-list">${items.map((it, idx) => `
      <div class="step-item" ${renderAccent(it.color)}>
        <div class="step-num" ${it.color ? `style="background:${it.color}"` : ""}>${idx + 1}</div>
        <div class="step-content">
          <div class="step-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
          <p>${escapeHtml(it.desc)}</p>
        </div>
      </div>`).join("")}</div>`;
  }

  if (type === "compare-grid") {
    return `<div class="compare-grid" ${gridStyle}>${items.map(it => {
      const activeNote = it.note || it.meta;
      return `
      <div class="compare-card" ${renderAccent(it.color)}>
        <div class="compare-card-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <p>${escapeHtml(it.desc)}</p>
        ${activeNote ? `<div class="compare-note" ${it.color ? `style="background:${it.color}15; color:${it.color}"` : ""}>${escapeHtml(activeNote)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  if (type === "plan-grid") {
    return `<div class="plan-grid" ${gridStyle}>${items.map(it => {
      const isFeat = it.featured === "true" || it.tag === "Best" || it.color;
      const highlight = isFeat ? "plan-featured" : "";
      const style = it.color ? `style="border-color:${it.color}; box-shadow: 0 8px 24px ${it.color}33;"` : "";
      const topBarStyle = it.color ? `style="background:${it.color};"` : "";
      const metaItems = splitMeta(it.meta);

      return `<div class="plan-card ${highlight}" ${style}>
        <div class="card-top-bar" ${topBarStyle}></div>
        ${it.tag ? `<div class="plan-badge" ${topBarStyle}>${escapeHtml(it.tag)}</div>` : ""}
        <div class="plan-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <ul class="plan-features">
          ${metaItems.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
        ${it.desc ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.desc)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  if (type === "skill-list") {
    return `<div class="skill-list">${items.map(it => `
      <div class="skill-item" ${renderAccent(it.color)}>
        <div class="skill-icon" ${it.color ? `style="background:${it.color}22; color:${it.color};"` : ""}>${escapeHtml(it.icon)}</div>
        <div class="skill-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <div class="skill-desc">${escapeHtml(it.desc)}</div>
      </div>`).join("")}</div>`;
  }

  if (type === "columns-grid") {
    return `<div class="columns-grid" ${gridStyle}>${items.map(it => {
      const activeNote = it.note || it.meta;
      return `
      <div class="column-card" ${renderAccent(it.color)}>
        <div class="card-top-bar" ${it.color ? `style="background:${it.color}"` : ""}></div>
        <div class="col-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <p>${escapeHtml(it.desc)}</p>
        ${activeNote ? `<div class="compare-note" ${it.color ? `style="background:${it.color}15; color:${it.color}"` : ""}>${escapeHtml(activeNote)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  if (type === "bottom-list") {
    const it = items[0];
    const chips = splitMeta(it.meta);
    return `<div class="bottom-list-card" ${renderAccent(it.color)}>
      <div class="bl-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
      <p class="bl-desc">${escapeHtml(it.desc)}</p>
      ${chips.length ? `<div class="bl-chips">${chips.map(c => `<span class="bl-chip" ${it.color ? `style="background:${it.color}15; color:${it.color}"` : ""}>${escapeHtml(c)}</span>`).join('')}</div>` : ""}
    </div>`;
  }

  if (type === "compare-split") {
    if (items.length < 2) return renderShortcode("compare-grid", body, args);
    return `<div class="compare-2col">${items.slice(0, 2).map((it, idx) => {
      const isLeft = idx === 0;
      const classes = isLeft ? "c2-card c2-left" : "c2-card c2-right";
      const metaItems = splitMeta(it.meta);
      const metaHtml = metaItems.length ? `<ul class="c2-list">${metaItems.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : "";
      const descHtml = it.desc ? `<p class="c2-desc" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px; white-space: pre-line;">${escapeHtml(it.desc)}</p>` : "";
      return `<div class="${classes}">
        <div class="card-top-bar"></div>
        <div class="c2-title">${escapeHtml(it.title)}</div>
        ${metaHtml}
        ${descHtml}
        ${it.note ? `<div class="c2-note">${escapeHtml(it.note)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  if (type === "alert-box") {
    const typeColors = { tip: "var(--brand)", warn: "#F59E0B", success: "#22C55E", danger: "#EF4444" };
    return items.map(it => {
      const t = (args || it.type || it.tag || "tip").trim().toLowerCase();
      const color = typeColors[t] || "var(--brand)";
      return `<div class="alert-box alert-${t}" style="--alert-color:${color}">
        ${it.icon ? `<div class="alert-icon">${escapeHtml(it.icon)}</div>` : ""}
        <div class="alert-body">
          ${it.title ? `<strong>${escapeHtml(it.title)}</strong>` : ""}
          ${it.desc ? `<p>${escapeHtml(it.desc)}</p>` : ""}
        </div>
      </div>`;
    }).join("");
  }

  if (type === "cmd-box") {
    return items.map(it => {
      const label = it.title || it.tag || "Terminal";
      const lang  = it.meta || "bash";
      return `<div class="cmd-block">
        <div class="cmd-header">
          <span class="cmd-label">${escapeHtml(label)}</span>
          <span class="cmd-lang">${escapeHtml(lang)}</span>
          <button class="cmd-copy" onclick="(function(b){var p=b.closest('.cmd-block').querySelector('.cmd-pre');navigator.clipboard.writeText(p.textContent.trim()).then(()=>{b.textContent='복사됨';setTimeout(()=>b.textContent='복사',1500)})})(this)">복사</button>
        </div>
        <pre class="cmd-pre"><code>${escapeHtml(it.desc)}</code></pre>
      </div>`;
    }).join("");
  }

  if (type === "faq-list") {
    return `<div class="faq-list">${items.map(it => `
      <div class="faq-item">
        <button class="faq-q" onclick="this.closest('.faq-item').classList.toggle('open')">
          <span>${escapeHtml(it.title)}</span>
          <span class="faq-arrow">▼</span>
        </button>
        <div class="faq-a">${it.desc ? `<p>${escapeHtml(it.desc)}</p>` : ""}</div>
      </div>`).join("")}</div>`;
  }

  if (type === "console-box") {
    return items.map(it => `
      <div class="prompt-box">
        ${it.title ? `<div class="prompt-label">${escapeHtml(it.title)}</div>` : ""}
        <pre class="prompt-content">${escapeHtml(it.desc)}</pre>
      </div>`).join("");
  }

  if (type === "git-flow-strip") {
    return `<div class="git-flow-container"><div class="flow-branches">${items.map((it, idx) => {
      const color = it.color || "var(--brand)";
      const metaItems = splitMeta(it.meta);
      return `<div class="branch-row">
        <div class="branch-label" style="background: ${color}12; border-left: 4px solid ${color}; color: ${color}; font-weight: 800;">
          ${escapeHtml(it.title)}
        </div>
        <div class="branch-line" style="background: linear-gradient(90deg, ${color} 30%, rgba(203, 213, 225, 0.4) 100%);">
          <div class="commit" style="border-color: ${color};">
            ${it.tag ? `<span class="commit-label" style="background: ${color};">${escapeHtml(it.tag)}</span>` : ""}
            <div class="commit-line" style="border-color: ${color};">
              ${metaItems.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    }).join("")}</div></div>`;
  }

  if (type === "editor-box") {
    return items.map(it => {
      const codeLines = (it.desc || "").split('\n');
      const filename = it.title || "untitled";
      const lang = it.tag || "javascript";
      return `<div class="editor-sim">
        <div class="editor-titlebar">
          <div class="editor-dot red"></div>
          <div class="editor-dot yellow"></div>
          <div class="editor-dot green"></div>
          <div class="editor-tab active">${escapeHtml(filename)} <span style="font-size:0.75rem;opacity:0.5;">(${escapeHtml(lang)})</span></div>
        </div>
        <div class="editor-body">
          <div class="line-nums">
            ${codeLines.map((_, i) => `<span>${i + 1}</span>`).join('')}
          </div>
          <div class="code-area"><pre><code>${escapeHtml(it.desc)}</code></pre></div>
        </div>
      </div>`;
    }).join("");
  }

  if (type === "network-box") {
    const mainNode = items[0];
    const subNodes = items.slice(1);
    const color = mainNode.color || "var(--brand)";
    return `<div class="graph-visual">
      <div class="graph-nodes">
        <div class="node node-main" style="background: ${color}; box-shadow: 0 0 24px ${color}88;">
          ${escapeHtml(mainNode.title)}
        </div>
        ${subNodes.map((n, i) => {
          const subColor = n.color || "var(--brand-dark)";
          return `<div class="node node-${i + 1}" style="border: 2px solid ${subColor}; color: ${subColor};">
            ${escapeHtml(n.title)}
            ${n.meta ? `<span style="font-size:0.7rem; opacity:0.6; display:block;">${escapeHtml(n.meta)}</span>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }

  return "";
}

export function buildPresentationHtml(inputPaths, opts = {}) {
  const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
  if (!paths.length) throw new Error("변환할 마크다운 파일 경로가 지정되지 않았습니다.");

  const slides = [];
  let mainFm = null;

  // Process all files and collect their H1/H2 slide divisions!
  for (const fp of paths) {
    if (!fs.existsSync(fp)) {
      console.warn(`⚠️ Warning: 파일이 존재하지 않아 스킵합니다: ${fp}`);
      continue;
    }
    const raw = fs.readFileSync(fp, "utf8");
    const { data: fm, content } = matter(raw);
    if (!mainFm) mainFm = fm;

    const styleKey = opts.style || fm.style || "ai-chat";
    const style = STYLES[styleKey] || STYLES["ai-chat"];

    // Parse shortcodes
    const processedContent = content.replace(/^:::\s*([A-Za-z0-9_-]+)(?:[ \t]+([^\r\n]+))?[ \t]*\r?\n([\s\S]*?)(?:\r?\n|^):::[ \t]*$/gm, (_, type, args, body) => {
      const html = renderShortcode(type, body, args);
      return html ? `\n${html.replace(/\n\s+/g, '\n')}\n` : "";
    });

    const tokens = marked.lexer(processedContent);
    let currentSlide = null;

    for (const tok of tokens) {
      if (tok.type === "heading" && tok.depth === 1) {
        if (currentSlide) slides.push(currentSlide);
        const title = marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "");
        currentSlide = {
          type: "cover",
          title,
          body: fm.subtitle || fm.description || "",
          style
        };
      } else if (tok.type === "heading" && tok.depth === 2) {
        if (currentSlide) slides.push(currentSlide);
        const title = marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "");
        currentSlide = {
          type: "content",
          title,
          body: "",
          style
        };
      } else {
        if (!currentSlide) {
          currentSlide = {
            type: "cover",
            title: fm.title || path.basename(fp, ".md"),
            body: fm.subtitle || fm.description || "",
            style
          };
        }
        currentSlide.body += marked.parser([tok]);
      }
    }
    if (currentSlide) slides.push(currentSlide);
  }

  if (!slides.length) throw new Error("변환된 슬라이드 데이터가 없습니다.");

  // Config-based border-radius
  const radiusVal = CONFIG?.slide?.globalRadius || 0.08;
  const cssRadius = radiusVal > 0 ? `${Math.round(radiusVal * 150)}px` : "12px";

  // Generate slide sections HTML with dynamic per-slide branding!
  const slidesHtml = slides.map((s, idx) => {
    const sNum = `${idx + 1} / ${slides.length}`;
    const activeStyle = s.style || STYLES["ai-chat"];
    const styleAttr = `style="--brand: ${activeStyle.brand}; --brand-dark: ${activeStyle.brandDark}; --brand-deep: ${activeStyle.brandDeep}; --brand-light: ${activeStyle.brandLight}; --brand-mid: ${activeStyle.brandMid};"`;

    if (s.type === "cover") {
      return `<div class="slide cover" ${styleAttr}>
        <div class="slide-num">${sNum}</div>
        <h1>${s.title}</h1>
        ${s.body ? `<p>${s.body}</p>` : ""}
      </div>`;
    }
    return `<div class="slide content" ${styleAttr}>
      <header class="slide-header">
        <h2>${s.title}</h2>
        <div class="slide-num">${sNum}</div>
      </header>
      <div class="slide-body">
        ${s.body}
      </div>
    </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Presentation - ${mainFm?.title || 'Slide Deck'}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
  :root {
    --border:     rgba(255, 255, 255, 0.1);
    --bg:         #0b0d12;
    --text:       #f8fafc;
    --text-muted: #94a3b8;
    --card-bg:    #11141b;
    --radius:     ${cssRadius};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }

  .slides-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .slides-container::-webkit-scrollbar { display: none; }

  .slide {
    flex: 0 0 100vw;
    width: 100vw;
    height: 100vh;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    padding: 80px 100px;
    box-sizing: border-box;
    position: relative;
    overflow-y: auto;
    background: var(--bg);
  }

  /* Slide types */
  .slide.cover {
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, var(--brand-deep), var(--brand-dark));
    text-align: center;
  }
  .slide.cover h1 {
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(2.5rem, 6vw, 4.2rem);
    font-weight: 900;
    color: #fff;
    margin-bottom: 20px;
    text-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  .slide.cover p {
    font-size: 1.5rem;
    color: var(--brand-light);
    max-width: 800px;
  }
  
  .slide.content {
    justify-content: flex-start;
    align-items: flex-start;
  }

  .slide-header {
    width: 100%;
    border-bottom: 2px solid var(--brand);
    padding-bottom: 20px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .slide-header h2 {
    font-family: 'Noto Serif KR', serif;
    font-size: 2.2rem;
    color: var(--brand-light);
    font-weight: 700;
  }
  .slide-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    color: var(--text-muted);
  }

  .slide-body {
    width: 100%;
    flex: 1;
    font-size: 1.25rem;
    line-height: 1.8;
  }
  .slide-body p { margin-bottom: 20px; color: #cbd5e1; }
  .slide-body h3 { font-size: 1.5rem; color: #fff; margin: 24px 0 12px; }

  /* Standard visual components inside slides */
  .icon-grid, .feature-grid, .compare-grid, .plan-grid, .columns-grid { display: grid; gap: 20px; margin: 25px 0; width: 100%; }
  .icon-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .feature-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .plan-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .compare-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .columns-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

  .icon-card, .feature-card, .compare-card, .column-card, .plan-card, .bottom-list-card, .badge-item { 
    background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; 
    position: relative; overflow: hidden; transition: 0.2s;
  }
  .card-top-bar { height: 4px; background: var(--brand); position: absolute; top: 0; left: 0; right: 0; }
  .icon-card-icon { font-size: 2.5rem; margin-bottom: 12px; text-align: center; }
  .icon-card-title, .feature-card-title, .compare-card-title, .col-title, .plan-title { 
    font-weight: 800; font-size: 1.2rem; margin-bottom: 8px; color: #fff; 
  }
  .feature-tag { position: absolute; top: 12px; right: 12px; font-size: 0.75rem; font-weight: 900; padding: 4px 10px; border-radius: 100px; background: var(--brand); color: #fff; }
  .slide-body p { color: #94a3b8; font-size: 0.95rem; }

  /* Plan Grid details */
  .plan-card { text-align: center; padding-top: 35px; }
  .plan-featured { border-color: var(--brand); box-shadow: 0 8px 30px rgba(99,102,241,0.2); }
  .plan-badge { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: var(--brand); color: #fff; font-size: 0.75rem; font-weight: 900; padding: 4px 12px; border-radius: 100px; }
  .plan-features { list-style: none; margin: 0 0 15px 0; padding: 0; text-align: left; }
  .plan-features li { padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; color: #cbd5e1; }
  .plan-features li:before { content: '✓'; color: var(--brand); margin-right: 8px; font-weight: bold; }
  .plan-note { margin-top: auto; padding: 6px; background: var(--brand-dark); color: #fff; font-size: 0.85rem; font-weight: bold; border-radius: 8px; }

  /* Alert Box */
  .alert-box { display: flex; gap: 14px; padding: 16px 20px; border-radius: var(--radius); border-left: 4px solid var(--alert-color, var(--brand)); background: rgba(255,255,255,0.02); margin: 20px 0; }
  .alert-tip  { --alert-color: var(--brand); }
  .alert-warn { --alert-color: #F59E0B; }
  .alert-success { --alert-color: #22C55E; }
  .alert-danger { --alert-color: #EF4444; }
  .alert-icon { font-size: 1.3rem; flex-shrink: 0; line-height: 1.5; }
  .alert-body strong { display: block; font-size: 0.95rem; font-weight: 800; color: var(--alert-color, var(--brand)); margin-bottom: 4px; }
  .alert-body p { margin: 0; font-size: 0.92rem; color: #cbd5e1; }

  /* Cmd / Code block */
  .cmd-block { background: #000; border-radius: var(--radius); overflow: hidden; margin: 20px 0; width: 100%; }
  .cmd-header { display: flex; align-items: center; gap: 8px; padding: 9px 16px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .cmd-label { font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: 'JetBrains Mono', monospace; flex: 1; }
  .cmd-lang { font-size: 0.75rem; color: var(--brand); font-family: 'JetBrains Mono', monospace; }
  .cmd-copy { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 3px 10px; font-size: 0.75rem; cursor: pointer; transition: 0.15s; }
  .cmd-copy:hover { background: rgba(255,255,255,0.1); color: white; }
  .cmd-pre { margin: 0; padding: 18px 20px; color: #cbd5e1; font-size: 0.95rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; }

  /* Git Flow */
  .git-flow-container { background: #000; padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); margin: 25px 0; width: 100%; }
  .flow-branches { display: flex; flex-direction: column; gap: 20px; }
  .branch-row { display: grid; grid-template-columns: 160px 1fr; gap: 24px; align-items: center; }
  .branch-label { padding: 6px 12px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; text-align: center; }
  .branch-line { height: 4px; position: relative; border-radius: 2px; }
  .commit { width: 16px; height: 16px; background: #000; border: 3px solid var(--brand); border-radius: 50%; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); cursor: pointer; }
  .commit-label { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 100px; white-space: nowrap; font-family: 'JetBrains Mono', monospace; }
  .commit-line { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; list-style: none; font-size: 0.75rem; color: #94a3b8; display: none; z-index: 10; min-width: 140px; text-align: left; }
  .commit-line li { padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .commit:hover .commit-line { display: block; }

  /* Editor Box */
  .editor-sim { background: #1e1e1e; border: 1px solid #333; border-radius: var(--radius); overflow: hidden; margin: 25px 0; width: 100%; }
  .editor-titlebar { background: #2d2d2d; height: 36px; display: flex; align-items: center; padding: 0 16px; gap: 8px; }
  .editor-dot { width: 10px; height: 10px; border-radius: 50%; }
  .editor-dot.red { background: #FF5F56; }
  .editor-dot.yellow { background: #FFBD2E; }
  .editor-dot.green { background: #27C93F; }
  .editor-tab { background: #1e1e1e; color: #fff; height: 100%; display: flex; align-items: center; padding: 0 16px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; margin-left: 12px; border-top: 2px solid var(--brand); }
  .editor-body { display: grid; grid-template-columns: 40px 1fr; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.8; color: #d4d4d4; }
  .line-nums { background: #1e1e1e; color: #858585; text-align: right; padding: 12px 10px 12px 0; border-right: 1px solid #3c3c3c; user-select: none; display: flex; flex-direction: column; }
  .code-area { padding: 12px 20px; overflow-x: auto; }
  .code-area pre { margin: 0; }

  /* Network Box */
  .graph-visual { background: #05070a; border-radius: var(--radius); border: 1px solid var(--border); height: 260px; position: relative; margin: 25px 0; overflow: hidden; width: 100%; }
  .graph-nodes { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .node { position: absolute; border-radius: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; text-align: center; }
  .node-main { width: 90px; height: 90px; color: #fff; font-size: 0.95rem; z-index: 5; background: var(--brand); box-shadow: 0 0 20px var(--brand); animation: pulseGlow 3s infinite ease-in-out; }
  .node-1 { width: 70px; height: 70px; transform: translate(-140px, -40px); border: 2px solid var(--brand-light); color: var(--brand-light); }
  .node-2 { width: 70px; height: 70px; transform: translate(140px, 40px); border: 2px solid var(--brand-light); color: var(--brand-light); }
  .node-3 { width: 70px; height: 70px; transform: translate(-90px, 80px); border: 2px solid var(--brand-light); color: var(--brand-light); }
  .node-4 { width: 70px; height: 70px; transform: translate(100px, -70px); border: 2px solid var(--brand-light); color: var(--brand-light); }

  /* Controls */
  .controls {
    position: fixed; bottom: 30px; right: 40px; display: flex; gap: 15px; z-index: 1000;
  }
  .controls button {
    background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1); color: #fff;
    width: 50px; height: 50px; border-radius: 50%; cursor: pointer;
    font-size: 20px; display: flex; align-items: center; justify-content: center;
    transition: 0.2s;
  }
  .controls button:hover:not(:disabled) {
    background: var(--brand); transform: scale(1.1);
  }
  .controls button:disabled {
    opacity: 0.3; cursor: not-allowed;
  }

  .progress-bar {
    position: fixed; bottom: 0; left: 0; height: 4px; background: var(--brand);
    transition: width 0.2s ease; z-index: 1000;
  }
  
  .slide-info {
    position: fixed; bottom: 43px; left: 40px; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; color: var(--text-muted); z-index: 1000;
  }
</style>
</head>
<body>
  <div class="slides-container" id="slides">
    ${slidesHtml}
  </div>

  <div class="slide-info" id="slideInfo"></div>
  <div class="progress-bar" id="progress"></div>

  <div class="controls">
    <button id="btnPrev" title="이전 슬라이드 (← / PageUp)">←</button>
    <button id="btnNext" title="다음 슬라이드 (→ / Space / PageDown)">→</button>
  </div>

  <script>
    const container = document.getElementById('slides');
    const slides = document.querySelectorAll('.slide');
    const progress = document.getElementById('progress');
    const slideInfo = document.getElementById('slideInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    let currentIdx = 0;

    function update() {
      progress.style.width = ((currentIdx + 1) / slides.length * 100) + '%';
      slideInfo.textContent = 'SLIDE ' + (currentIdx + 1) + ' / ' + slides.length;
      btnPrev.disabled = currentIdx === 0;
      btnNext.disabled = currentIdx === slides.length - 1;
    }

    function scrollToSlide(idx) {
      if (idx < 0 || idx >= slides.length) return;
      currentIdx = idx;
      slides[idx].scrollIntoView({ behavior: 'smooth' });
      update();
    }

    btnPrev.addEventListener('click', () => scrollToSlide(currentIdx - 1));
    btnNext.addEventListener('click', () => scrollToSlide(currentIdx + 1));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSlide(currentIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSlide(currentIdx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSlide(slides.length - 1);
      }
    });

    // Handle touch/manual mouse scroll snapping
    let scrollTimeout;
    container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const idx = Math.round(container.scrollLeft / width);
        if (idx !== currentIdx && idx >= 0 && idx < slides.length) {
          currentIdx = idx;
          update();
        }
      }, 100);
    });

    update();
  </script>
</body>
</html>`;

  return { html, styleKey: opts.style || mainFm?.style || "ai-chat", fm: mainFm };
}

// CLI entry
const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isMain) {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h") || !argv.length) {
    console.log([
      "",
      "사용법:",
      "  node scripts/build-presentation.mjs <input1.md> [input2.md ...] [output.html]",
      "  node scripts/build-presentation.mjs <directory_path> [output.html]",
      "  node scripts/build-presentation.mjs <glob_pattern> [--out path.html] [--style key]",
      "",
      "옵션:",
      "  --out <path>   출력 HTML 경로 (기본: public/presentation/<이름>.html 또는 unified-deck.html)",
      "  --style <key>  색상 프리셋 지정",
      "",
    ].join("\n"));
    process.exit(0);
  }

  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out")   flags.out = argv[++i];
    else if (argv[i] === "--style") flags.style = argv[++i];
    else if (!argv[i].startsWith("--")) positional.push(argv[i]);
  }

  // Gather all matching markdown files
  const files = [];
  let explicitOut = flags.out;

  // Check if the last positional argument represents a manually specified output HTML file
  let possibleOutput = null;
  if (positional.length > 1) {
    const last = positional[positional.length - 1];
    if (last.toLowerCase().endsWith(".html") || last.toLowerCase().endsWith(".htm")) {
      possibleOutput = positional.pop();
    }
  }

  for (const arg of positional) {
    const abs = path.resolve(arg);
    if (fs.existsSync(abs)) {
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        // Search folder
        const found = fs.readdirSync(abs)
          .filter(f => f.toLowerCase().endsWith(".md"))
          .map(f => path.join(abs, f))
          .sort();
        files.push(...found);
      } else if (stat.isFile() && abs.toLowerCase().endsWith(".md")) {
        files.push(abs);
      }
    } else {
      // Glob pattern
      try {
        const { glob } = await import("node:fs/promises");
        const found = [];
        for await (const f of glob(arg)) {
          if (f.toLowerCase().endsWith(".md")) {
            found.push(path.resolve(f));
          }
        }
        files.push(...found.sort());
      } catch (err) {
        console.warn(`⚠️ Warning: glob scanning failed for ${arg}: ${err.message}`);
      }
    }
  }

  if (!files.length) {
    console.error("❌ 에러: 변환 대상이 되는 마크다운(*.md) 파일을 발견하지 못했습니다.");
    process.exit(1);
  }

  try {
    const { html } = buildPresentationHtml(files, { style: flags.style || null });
    
    // Determine the default output name
    let outPath = explicitOut || possibleOutput;
    if (!outPath) {
      if (files.length === 1) {
        outPath = path.join("public", "presentation", path.basename(files[0], ".md") + ".html");
      } else {
        // If it was a folder scan, name it after the folder
        const firstAbs = files[0];
        const parentDir = path.dirname(firstAbs);
        const folderName = path.basename(parentDir);
        if (folderName && folderName !== "guides" && folderName !== "md_src") {
          outPath = path.join("public", "presentation", `${folderName}-presentation.html`);
        } else {
          outPath = path.join("public", "presentation", "unified-deck.html");
        }
      }
    } else {
      // Folder fallback matching templates/build-guide.mjs
      const ext = path.extname(outPath).toLowerCase();
      if (ext !== ".html" && ext !== ".htm") {
        if (files.length === 1) {
          outPath = path.join(outPath, path.basename(files[0], ".md") + ".html");
        } else {
          outPath = path.join(outPath, "unified-deck.html");
        }
      }
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`✅ 프레젠테이션 횡 슬라이드 병합 HTML 생성 완료 (${files.length}개 파일): ${outPath}`);
  } catch (e) {
    console.error("❌ 에러 발생:", e.message);
    process.exit(1);
  }
}
