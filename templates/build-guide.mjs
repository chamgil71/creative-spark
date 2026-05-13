#!/usr/bin/env node
/**
 * build-guide.mjs
 * Markdown -> HTML 변환기
 * [완전판] PPTX와 100% 동기화: 6대 표준 키 지원, 모든 신규 숏코드 CSS 구현, Config 연동
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ════════════════════════════════════════════════════════════════
//  1. 설정 로드 및 표준화 (PPTX와 동일)
// ════════════════════════════════════════════════════════════════

function loadJsonWithComments(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const src = fs.readFileSync(filePath, "utf8").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(src);
}

const CONFIG_DIR = path.join(__dirname, "../config");
const STYLES = loadJsonWithComments(path.join(CONFIG_DIR, "styles.json"));
const CONFIG = loadJsonWithComments(path.join(CONFIG_DIR, "pptdesign.config.json"));

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function cleanValue(v) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function standardizeItem(item) {
  const rawName = item.name || item.title || "";
  const iconMatch = rawName.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*(.*)$/);

  return {
    ...item,
    icon:  item.icon || (iconMatch ? iconMatch[1] : "") || "",
    title: item.title || (iconMatch ? iconMatch[2] : item.name) || item.col || "",
    desc:  item.desc || item.description || item.tagline || item.body || "",
    tag:   item.tag || item.badge || item.type || "",
    meta:  item.meta || item.note || item.tool || item.features || item.items || item.points || "",
    color: item.color || ""
  };
}

function parseShortcodeItems(src) {
  const items = [];
  let current = null;
  for (const line of src.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const first = line.match(/^\s*-\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    const next  = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (first) {
      current = { [first[1]]: cleanValue(first[2]) };
      items.push(current);
    } else if (next && current) {
      current[next[1]] = cleanValue(next[2]);
    }
  }
  return items.map(standardizeItem);
}

// ════════════════════════════════════════════════════════════════
//  2. 숏코드 렌더링 엔진 (모든 숏코드 지원)
// ════════════════════════════════════════════════════════════════

function renderShortcode(type, body) {
  const items = parseShortcodeItems(body);
  if (!items.length) return "";

  const renderAccent = (color) => color ? `style="border-color: ${color}; background-color: ${color}08;"` : "";
  const renderTextColor = (color) => color ? `style="color: ${color};"` : "";

  // 1. icon-grid, feature-grid, badge-grid
  if (["icon-grid", "feature-grid", "badge-grid"].includes(type)) {
    return `<div class="${type}">${items.map(it => {
      if (type === "badge-grid") {
        return `<div class="badge-item" ${renderAccent(it.color)}>
          <div class="badge-icon">${escapeHtml(it.icon)}</div>
          <div class="badge-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
          <div class="badge-tag">${escapeHtml(it.tag)}</div>
        </div>`;
      }
      const isFeat = type === "feature-grid";
      return `<div class="${isFeat ? 'feature-card' : 'icon-card'}" ${renderAccent(it.color)}>
        ${isFeat && it.color ? `<div class="card-top-bar" style="background-color:${it.color}"></div>` : ''}
        ${it.tag ? `<span class="feature-tag" ${it.color ? `style="background:${it.color}; color:#fff;"` : ""}>${escapeHtml(it.tag)}</span>` : ""}
        ${isFeat ? `
          <div class="feature-card-title" ${renderTextColor(it.color)}>
            ${it.icon ? `<span class="fc-icon">${escapeHtml(it.icon)}</span>` : ""}${escapeHtml(it.title)}
          </div>
        ` : `
          <div class="icon-card-icon" ${renderTextColor(it.color)}>${escapeHtml(it.icon)}</div>
          <div class="icon-card-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        `}
        <p>${escapeHtml(it.desc)}</p>
      </div>`;
    }).join("")}</div>`;
  }

  // 2. tool-card
  if (type === "tool-card") {
    return items.map(it => {
      const grad = it.color ? `linear-gradient(135deg, ${it.color}, ${it.color}CC)` : `var(--brand-gradient)`;
      return `<div class="tool-card">
        <div class="tc-header" style="background: ${grad}; color: #fff;">
          <div class="tc-icon">${escapeHtml(it.icon)}</div>
          <div class="tc-content">
            <div class="tc-name">${escapeHtml(it.title)}</div>
            <div class="tc-sub">${escapeHtml(it.desc)}</div>
          </div>
          ${it.tag ? `<div class="tc-badge">${escapeHtml(it.tag)}</div>` : ""}
        </div>
        ${it.meta ? `<ul class="tc-list">${it.meta.split("|").filter(Boolean).map(f => `<li>${escapeHtml(f.trim())}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");
  }

  // 3. workflow
  if (type === "workflow") {
    return `<div class="workflow-strip">${items.map((it, idx) => `
      <div class="wf-step" ${renderAccent(it.color)}>
        <div class="wf-icon" ${it.color ? `style="background:${it.color}; color:#fff;"` : ""}>${escapeHtml(it.icon)}</div>
        <div class="wf-name" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <div class="wf-tool">${escapeHtml(it.meta)}</div>
        ${idx < items.length - 1 ? `<div class="wf-arrow">→</div>` : ""}
      </div>`).join("")}</div>`;
  }

  // 4. steps
  if (type === "steps") {
    return `<div class="step-list">${items.map((it, idx) => `
      <div class="step-item" ${renderAccent(it.color)}>
        <div class="step-num" ${it.color ? `style="background:${it.color}"` : ""}>${idx + 1}</div>
        <div class="step-content">
          <div class="step-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
          <p>${escapeHtml(it.desc)}</p>
        </div>
      </div>`).join("")}</div>`;
  }

  // 5. compare-grid
  if (type === "compare-grid") {
    return `<div class="compare-grid">${items.map(it => `
      <div class="compare-card" ${renderAccent(it.color)}>
        <div class="compare-card-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <p>${escapeHtml(it.desc)}</p>
        ${it.meta ? `<div class="compare-note" ${it.color ? `style="background:${it.color}15; color:${it.color}"` : ""}>${escapeHtml(it.meta)}</div>` : ""}
      </div>`).join("")}</div>`;
  }

  // 6. plan-grid
  if (type === "plan-grid") {
    return `<div class="plan-grid">${items.map(it => {
      const isFeat = it.featured === "true" || it.tag === "Best" || it.color;
      const highlight = isFeat ? "plan-featured" : "";
      const style = it.color ? `style="border-color:${it.color}; box-shadow: 0 8px 24px ${it.color}33;"` : "";
      const topBarStyle = it.color ? `style="background:${it.color};"` : "";
      
      return `<div class="plan-card ${highlight}" ${style}>
        <div class="card-top-bar" ${topBarStyle}></div>
        ${it.tag ? `<div class="plan-badge" ${topBarStyle}>${escapeHtml(it.tag)}</div>` : ""}
        <div class="plan-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <ul class="plan-features">
          ${it.meta.split('|').filter(Boolean).map(f => `<li>${escapeHtml(f.trim())}</li>`).join('')}
        </ul>
        ${it.desc ? `<div class="plan-note" ${topBarStyle}>${escapeHtml(it.desc)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  // 7. skill-list
  if (type === "skill-list") {
    return `<div class="skill-list">${items.map(it => `
      <div class="skill-item" ${renderAccent(it.color)}>
        <div class="skill-icon" ${it.color ? `style="background:${it.color}22; color:${it.color};"` : ""}>${escapeHtml(it.icon)}</div>
        <div class="skill-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <div class="skill-desc">${escapeHtml(it.desc)}</div>
      </div>`).join("")}</div>`;
  }

  // 8. columns
  if (type === "columns") {
    return `<div class="columns-grid">${items.map(it => `
      <div class="column-card" ${renderAccent(it.color)}>
        <div class="card-top-bar" ${it.color ? `style="background:${it.color}"` : ""}></div>
        <div class="col-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
        <p>${escapeHtml(it.desc)}</p>
      </div>`).join("")}</div>`;
  }

  // 9. bottom-list
  if (type === "bottom-list") {
    const it = items[0];
    const chips = it.meta.split('|').filter(Boolean);
    return `<div class="bottom-list-card" ${renderAccent(it.color)}>
      <div class="bl-title" ${renderTextColor(it.color)}>${escapeHtml(it.title)}</div>
      <p class="bl-desc">${escapeHtml(it.desc)}</p>
      ${chips.length ? `<div class="bl-chips">${chips.map(c => `<span class="bl-chip" ${it.color ? `style="background:${it.color}15; color:${it.color}"` : ""}>${escapeHtml(c.trim())}</span>`).join('')}</div>` : ""}
    </div>`;
  }

  // 10. compare-2col
  if (type === "compare-2col") {
    if (items.length < 2) return renderShortcode("compare-grid", body);
    return `<div class="compare-2col">${items.slice(0, 2).map((it, idx) => {
      const isLeft = idx === 0;
      const classes = isLeft ? "c2-card c2-left" : "c2-card c2-right";
      return `<div class="${classes}">
        <div class="card-top-bar"></div>
        <div class="c2-title">${escapeHtml(it.title)}</div>
        <ul class="c2-list">
          ${it.meta.split('|').filter(Boolean).map(f => `<li>${escapeHtml(f.trim())}</li>`).join('')}
        </ul>
        ${it.desc ? `<div class="c2-note">${escapeHtml(it.desc)}</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  // 11. alert-box — tip / warn / success / danger 타입 알림 박스
  if (type === "alert-box") {
    const typeColors = { tip: "var(--brand)", warn: "#F59E0B", success: "#22C55E", danger: "#EF4444" };
    return items.map(it => {
      const t = it.type || it.tag || "tip";
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

  // 12. command-block — 복사 버튼 있는 터미널 코드 블록
  if (type === "command-block") {
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

  // 13. tabs — 클릭으로 전환되는 탭 UI (OS별 안내 등)
  if (type === "tabs") {
    const uid = "t" + Math.random().toString(36).slice(2, 7);
    return `<div class="tabs-wrap">
      <div class="tabs-nav">
        ${items.map((it, i) => `<button class="tab-btn${i === 0 ? " active" : ""}" onclick="switchTab(this,'${uid}-${i}')">${escapeHtml(it.title || it.tag || `탭 ${i+1}`)}</button>`).join("")}
      </div>
      ${items.map((it, i) => `<div class="tab-panel${i === 0 ? " active" : ""}" id="${uid}-${i}">${it.desc ? marked.parse(it.desc) : ""}</div>`).join("")}
    </div>`;
  }

  // 14. faq-accordion — 펼침/접힘 FAQ
  if (type === "faq-accordion") {
    return `<div class="faq-list">${items.map(it => `
      <div class="faq-item">
        <button class="faq-q" onclick="this.closest('.faq-item').classList.toggle('open')">
          <span>${escapeHtml(it.title)}</span>
          <span class="faq-arrow">▼</span>
        </button>
        <div class="faq-a">${it.desc ? `<p>${escapeHtml(it.desc)}</p>` : ""}</div>
      </div>`).join("")}</div>`;
  }

  // 15. prompt-example — AI 프롬프트 예시 블록
  if (type === "prompt-example") {
    return items.map(it => `
      <div class="prompt-box">
        ${it.title ? `<div class="prompt-label">${escapeHtml(it.title)}</div>` : ""}
        <pre class="prompt-content">${escapeHtml(it.desc)}</pre>
      </div>`).join("");
  }

  // 16. stat-highlight — 큰 수치 강조 카드 그리드
  if (type === "stat-highlight") {
    return `<div class="stat-grid">${items.map(it => `
      <div class="stat-card" ${it.color ? `style="border-top: 3px solid ${it.color};"` : `style="border-top: 3px solid var(--brand);"`}>
        <div class="stat-val" ${it.color ? `style="color:${it.color}"` : ""}>${escapeHtml(it.icon || it.title)}</div>
        ${it.icon ? `<div class="stat-name">${escapeHtml(it.title)}</div>` : ""}
        ${it.desc ? `<div class="stat-note">${escapeHtml(it.desc)}</div>` : ""}
      </div>`).join("")}</div>`;
  }

  return "";
}

// ════════════════════════════════════════════════════════════════
//  3. HTML 조립 (Config 연동 CSS 적용)
// ════════════════════════════════════════════════════════════════

export function buildHtml(inputPath, opts = {}) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const { data: fm, content } = matter(raw);
  const styleKey = opts.style || fm.style || "ai-chat";
  const style = STYLES[styleKey] || STYLES["ai-chat"];

  // Config에서 둥글기 값 가져오기 (없으면 0.08인치 -> 12px)
  const radiusVal = CONFIG?.slide?.globalRadius || 0.08;
  const cssRadius = radiusVal > 0 ? `${Math.round(radiusVal * 150)}px` : "0px";

  const processedContent = content.replace(/^:::\s*([A-Za-z0-9_-]+)\s*\n([\s\S]*?)\n:::\s*$/gm, (_, type, body) => {
    const html = renderShortcode(type, body);
    // 💡 핵심: \n 뒤의 모든 공백(들여쓰기)을 제거하여 코드 블록으로 인식되는 것을 방지합니다.
    return html ? `\n${html.replace(/\n\s+/g, '\n')}\n` : "";
  });

  const tokens = marked.lexer(processedContent);
  let sectionNum = 0, bodyHtml = "", navLinksHtml = "", openSection = false, openCard = false;

  const closeCard = () => { if (openCard) { bodyHtml += `</div>`; openCard = false; } };
  const closeSection = () => { closeCard(); if (openSection) { bodyHtml += `</section>`; openSection = false; } };

  for (const tok of tokens) {
    if (tok.type === "heading" && tok.depth === 1) {
      closeSection(); sectionNum++;
      const title = marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "");
      const id = `sec-${sectionNum}`;
      bodyHtml += `<section class="section" id="${id}"><div class="section-header"><div class="section-num">${sectionNum}</div><h2>${title}</h2></div>`;
      navLinksHtml += `<li><a href="#${id}">${title}</a></li>`;
      openSection = true;
    } else if (tok.type === "heading" && tok.depth === 2) {
      closeCard();
      bodyHtml += `<div class="card"><h3 class="card-title">${marked.parser([{type: 'paragraph', tokens: tok.tokens}]).replace(/^<p>|<\/p>\n?$/g, "")}</h3>`;
      openCard = true;
    } else {
      if (openSection && !openCard) { bodyHtml += `<div class="card">`; openCard = true; }
      bodyHtml += marked.parser([tok]);
    }
  }
  closeSection();

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${fm.title || 'Guide'}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
  :root {
    --brand:      ${style.brand};
    --brand-dark: ${style.brandDark};
    --brand-deep: ${style.brandDeep};
    --brand-light:${style.brandLight};
    --brand-mid:  ${style.brandMid};
    --border:     ${style.border};
    --bg:         ${style.bg || '#F8FAFC'};
    --text:   #1A1A2E; --text-2: #475569; --text-3: #8892B0;
    --shadow:    0 4px 24px rgba(0,0,0,0.06);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.10);
    --radius: ${cssRadius};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; }
  
  /* Navigation & Hero */
  .nav { position: sticky; top: 0; z-index: 1000; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); height: 60px; }
  .nav-inner { max-width: 960px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 24px; }
  .nav-logo { font-weight: 900; color: var(--brand); text-decoration: none; font-size: 1.1rem; }
  .nav-links { display: flex; gap: 18px; list-style: none; }
  .nav-links a { text-decoration: none; color: var(--text-2); font-size: 14px; font-weight: 500; transition: 0.2s; }
  .nav-links a:hover { color: var(--brand); }
  .hero { background: ${style.heroGradient || 'var(--brand-dark)'}; color: white; padding: 80px 24px 60px; text-align: center; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, ${style.brand}55 0%, transparent 60%); pointer-events: none; }
  .hero-inner { max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
  .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 500; margin-bottom: 28px; }
  .hero-badge span { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
  .hero-logo { width: 90px; height: 90px; margin: 0 auto 24px; background: rgba(255,255,255,0.12); border-radius: 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); font-size: 44px; }
  .hero h1 { font-family: 'Noto Serif KR', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
  .hero p { font-size: 1.1rem; color: ${style.subtitleColor || 'rgba(255,255,255,0.85)'}; margin-bottom: 40px; }
  .hero-cta { display: inline-flex; align-items: center; gap: 8px; background: white; color: var(--brand-dark); font-weight: 800; font-size: 16px; padding: 13px 24px; border-radius: 100px; text-decoration: none; box-shadow: var(--shadow-lg); margin-bottom: 38px; transition: transform .2s, box-shadow .2s; }
  .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 44px rgba(0,0,0,0.18); }
  .hero-stats { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
  .hero-stat { text-align: center; }
  .hero-stat strong { display: block; font-size: 1.6rem; font-weight: 700; }
  .hero-stat span { font-size: .8rem; opacity: .7; }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.2); } }

  /* Layout */
  main { max-width: 960px; margin: 0 auto; padding: 60px 24px; }
  .section { margin-bottom: 80px; scroll-margin-top: 80px; }
  .section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
  .section-num { width: 40px; height: 40px; background: var(--brand); color: #fff; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.15rem; }
  .section-header h2 { font-family: 'Noto Serif KR', serif; font-size: 1.9rem; font-weight: 700; }
  .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 35px; margin-bottom: 24px; box-shadow: var(--shadow); }
  .card-title { font-size: 1.4rem; color: var(--brand-dark); margin-bottom: 20px; border-bottom: 2px solid var(--brand-light); display: inline-block; padding-bottom: 5px; font-weight: 800;}
  
  /* 공통 카드 스타일 */
  .card-top-bar { height: 4px; background: var(--brand); position: absolute; top: 0; left: 0; right: 0; }
  .feature-card { padding: 18px; }
  
  /* Grid Systems */
  .icon-grid, .feature-grid, .compare-grid, .plan-grid, .columns-grid { display: grid; gap: 20px; margin: 25px 0; }
  .icon-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .feature-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .plan-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .compare-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .columns-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .badge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; margin: 25px 0;}

  /* Cards */
  .icon-card, .feature-card, .compare-card, .column-card, .plan-card, .bottom-list-card, .badge-item { 
    background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 25px; 
    position: relative; overflow: hidden; transition: 0.2s; box-shadow: var(--shadow);
  }
  .icon-card:hover, .feature-card:hover, .plan-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
  
  
  .icon-card-icon { font-size: 2.5rem; margin-bottom: 15px; text-align: center; }
  .icon-card-title, .feature-card-title, .compare-card-title, .col-title, .plan-title, .bl-title { 
    font-weight: 800; font-size: 1.15rem; margin-bottom: 10px; color: var(--text); 
  }
  .icon-card-title { text-align: center; }
  .fc-icon { margin-right: 8px; font-size: 1.2rem; }
  .feature-tag { position: absolute; top: 15px; right: 15px; font-size: 0.75rem; font-weight: 900; padding: 4px 12px; border-radius: 100px; background: var(--brand-light); color: var(--brand-dark); }
  p { color: var(--text-2); font-size: 0.95rem; margin-bottom: 1rem; }
  .icon-card p { text-align: center; }

  /* Tool Card */
  .tool-card { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow); margin: 25px 0; }
  .tc-header { padding: 25px; display: flex; align-items: center; gap: 20px; }
  .tc-icon { width: 55px; height: 55px; border-radius: calc(var(--radius) / 2); background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
  .tc-name { font-size: 1.3rem; font-weight: 800; }
  .tc-sub { font-size: 0.9rem; opacity: 0.9; }
  .tc-badge { margin-left: auto; font-size: 0.8rem; font-weight: 800; padding: 5px 15px; border-radius: 100px; background: rgba(255,255,255,0.25); }
  .tc-list { padding: 12px 25px 14px 40px; font-size: 0.88rem; background: var(--bg); border-top: 1px solid var(--border); color: var(--text-2); margin: 0; line-height: 1.9; }

  /* Workflow */
  .workflow-strip { display: flex; gap: 15px; margin: 25px 0; overflow-x: auto; padding-bottom: 10px; }
  .wf-step { flex: 1; min-width: 140px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; position: relative; }
  .wf-icon { width: 45px; height: 45px; margin: 0 auto 10px; background: var(--brand-light); color: var(--brand); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
  .wf-name { font-weight: 800; font-size: 1rem; margin-bottom: 5px; }
  .wf-tool { font-size: 0.8rem; color: var(--text-2); }
  .wf-arrow { position: absolute; right: -15px; top: 50%; transform: translateY(-50%); font-weight: 900; color: #cbd5e1; z-index: 1; font-size: 1.2rem; }

  /* Steps */
  .step-list { display: flex; flex-direction: column; gap: 15px; margin: 25px 0; }
  .step-item { display: flex; gap: 20px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .step-num { width: 35px; height: 35px; background: var(--brand); color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0; }
  .step-title { font-weight: 800; font-size: 1.1rem; margin-bottom: 5px; }

  /* Plan Grid */
  .plan-card { text-align: center; padding-top: 35px; }
  .plan-featured { border-color: var(--brand); box-shadow: 0 8px 30px rgba(99,102,241,0.15); transform: translateY(-5px); }
  .plan-badge { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: var(--brand); color: #fff; font-size: 0.75rem; font-weight: 900; padding: 4px 15px; border-radius: 100px; }
  .plan-title { font-size: 1.3rem; margin-bottom: 20px; }
  .plan-features { list-style: none; margin: 0 0 20px 0; padding: 0; text-align: left; }
  .plan-features li { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; color: var(--text-2); }
  .plan-features li:before { content: '✓'; color: var(--brand); margin-right: 8px; font-weight: bold; }
  .plan-note { margin-top: auto; padding: 8px; background: var(--brand-light); color: var(--brand-dark); font-size: 0.85rem; font-weight: bold; border-radius: 8px; }

  /* Skill List */
  .skill-list { display: flex; flex-direction: column; gap: 15px; margin: 25px 0; }
  .skill-item { display: flex; align-items: center; gap: 20px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 15px 25px; }
  .skill-icon { width: 40px; height: 40px; background: var(--brand-light); color: var(--brand); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
  .skill-title { font-weight: 800; font-size: 1.05rem; width: 30%; }
  .skill-desc { font-size: 0.95rem; color: var(--text-2); flex: 1; margin: 0; }

  /* Badge Grid */
  .badge-item { text-align: center; padding: 20px 15px; }
  .badge-icon { font-size: 2rem; margin-bottom: 10px; }
  .badge-title { font-weight: 800; font-size: 1rem; margin-bottom: 5px; }
  .badge-tag { font-size: 0.8rem; color: var(--text-2); }

  /* Bottom List */
  .bl-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .bl-chip { background: var(--brand-light); color: var(--brand-dark); font-size: 0.85rem; font-weight: 800; padding: 6px 15px; border-radius: 100px; }

  /* Compare 2Col */
  .compare-2col { display: flex; gap: 20px; margin: 25px 0; }
  .c2-card { flex: 1; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 30px; position: relative; overflow: hidden; box-shadow: var(--shadow); }
  .c2-left { background: var(--brand-light); border-color: var(--brand); border-width: 2px; }
  .c2-left .card-top-bar { background: var(--brand); }
  .c2-right .card-top-bar { background: var(--text-2); }
  .c2-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 20px; color: var(--brand-dark); }
  .c2-right .c2-title { color: var(--text); }
  .c2-list { list-style: none; margin: 0; padding: 0; }
  .c2-list li { padding: 8px 0; font-size: 1rem; color: var(--text-2); display: flex; gap: 10px; }
  .c2-left .c2-list li { color: var(--brand-dark); }
  .c2-list li:before { content: '•'; font-weight: bold; }
  .c2-note { margin-top: 20px; padding: 10px; background: var(--brand); color: #fff; font-size: 0.85rem; font-weight: bold; text-align: center; border-radius: 8px; }
  .c2-right .c2-note { background: var(--border); color: var(--text); }
  @media(max-width: 768px) { .compare-2col { flex-direction: column; } }

  /* Done section */
  .done-section { background: linear-gradient(135deg, var(--brand-deep), var(--brand)); color: white; padding: 72px 24px; text-align: center; }
  .done-section h2 { font-family: 'Noto Serif KR', serif; font-size: clamp(1.8rem, 4vw, 2.6rem); margin-bottom: 10px; }
  .done-section p { color: ${style.doneSubtitleColor || 'rgba(255,255,255,0.86)'}; margin-bottom: 24px; }
  .done-link { display: inline-flex; align-items: center; background: white; color: var(--brand-dark); font-weight: 800; padding: 13px 24px; border-radius: 100px; text-decoration: none; box-shadow: var(--shadow-lg); }

  /* Back to top */
  .back-top { position: fixed; bottom: 32px; right: 32px; width: 46px; height: 46px; background: var(--brand); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: var(--shadow-lg); font-size: 20px; transition: all .2s; }
  .back-top:hover { background: var(--brand-dark); transform: translateY(-2px); }

  /* Footer */
  footer { text-align: center; padding: 40px 24px; color: var(--text-3); font-size: .85rem; border-top: 1px solid var(--border); margin-top: 40px; }
  footer a { color: var(--brand); text-decoration: none; }

  /* Alert Box */
  .alert-box { display: flex; gap: 14px; padding: 16px 20px; border-radius: var(--radius); border-left: 4px solid var(--alert-color, var(--brand)); background: color-mix(in srgb, var(--alert-color, var(--brand)) 8%, white); margin: 20px 0; }
  .alert-tip  { --alert-color: var(--brand); }
  .alert-warn { --alert-color: #F59E0B; }
  .alert-success { --alert-color: #22C55E; }
  .alert-danger { --alert-color: #EF4444; }
  .alert-icon { font-size: 1.3rem; flex-shrink: 0; line-height: 1.5; }
  .alert-body strong { display: block; font-size: 0.95rem; font-weight: 800; color: var(--alert-color, var(--brand)); margin-bottom: 4px; }
  .alert-body p { margin: 0; font-size: 0.92rem; color: var(--text-2); }

  /* Command Block */
  .cmd-block { background: #0F172A; border-radius: var(--radius); overflow: hidden; margin: 20px 0; }
  .cmd-header { display: flex; align-items: center; gap: 8px; padding: 9px 16px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .cmd-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); font-family: 'JetBrains Mono', monospace; flex: 1; }
  .cmd-lang { font-size: 0.75rem; color: var(--brand); font-family: 'JetBrains Mono', monospace; }
  .cmd-copy { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 3px 10px; font-size: 0.75rem; cursor: pointer; transition: 0.15s; font-family: inherit; }
  .cmd-copy:hover { background: rgba(255,255,255,0.16); color: white; }
  .cmd-pre { margin: 0; padding: 18px 20px; background: transparent; color: #CBD5E1; font-size: 0.92rem; overflow-x: auto; border-radius: 0; white-space: pre-wrap; word-break: break-all; }
  .cmd-pre code { background: none; padding: 0; font-size: inherit; }

  /* Tabs */
  .tabs-wrap { margin: 25px 0; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .tabs-nav { display: flex; background: var(--bg); border-bottom: 1px solid var(--border); overflow-x: auto; }
  .tab-btn { padding: 11px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: var(--text-2); white-space: nowrap; transition: 0.15s; font-family: inherit; margin-bottom: -1px; }
  .tab-btn.active { color: var(--brand); border-bottom-color: var(--brand); background: white; }
  .tab-btn:hover:not(.active) { color: var(--text); background: rgba(0,0,0,0.03); }
  .tab-panel { display: none; padding: 24px; background: white; }
  .tab-panel.active { display: block; }
  .tab-panel p { margin-bottom: 0.8rem; }

  /* FAQ Accordion */
  .faq-list { display: flex; flex-direction: column; gap: 8px; margin: 25px 0; }
  .faq-item { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.15s; }
  .faq-item.open { border-color: var(--brand); }
  .faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: transparent; border: none; cursor: pointer; font-size: 0.97rem; font-weight: 700; color: var(--text); text-align: left; gap: 12px; font-family: inherit; transition: background 0.15s; }
  .faq-q:hover { background: var(--brand-light); }
  .faq-item.open .faq-q { color: var(--brand-dark); background: var(--brand-light); }
  .faq-arrow { transition: transform 0.2s; font-size: 0.7rem; opacity: 0.5; flex-shrink: 0; }
  .faq-item.open .faq-arrow { transform: rotate(180deg); opacity: 1; }
  .faq-a { display: none; padding: 0 20px 16px; }
  .faq-item.open .faq-a { display: block; }
  .faq-a p { margin: 0; font-size: 0.93rem; color: var(--text-2); }

  /* Prompt Example */
  .prompt-box { background: #0F172A; border-radius: var(--radius); overflow: hidden; margin: 20px 0; }
  .prompt-label { padding: 9px 16px; background: var(--brand); color: white; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.03em; }
  .prompt-content { display: block; margin: 0; padding: 18px 20px; color: #CBD5E1; font-family: 'JetBrains Mono', monospace; font-size: 0.88rem; white-space: pre-wrap; line-height: 1.9; background: transparent; border-radius: 0; }

  /* Stat Highlight */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin: 25px 0; }
  .stat-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 16px; text-align: center; box-shadow: var(--shadow); transition: 0.2s; }
  .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .stat-val { font-size: 1.9rem; font-weight: 900; color: var(--brand); font-family: 'Noto Serif KR', serif; margin-bottom: 6px; line-height: 1.1; }
  .stat-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
  .stat-note { font-size: 0.8rem; color: var(--text-3); }

  /* Misc */
  .compare-note { margin-top: 15px; padding: 8px; background: var(--brand-light); color: var(--brand-dark); text-align: center; font-size: 0.85rem; font-weight: bold; border-radius: 8px; }
  blockquote { background: var(--brand-light); border-left: 4px solid var(--brand); border-radius: var(--radius); padding: 14px 18px; margin: 14px 0; color: var(--brand-dark); }
  blockquote p { margin: 0; color: var(--brand-dark); }
  pre { background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px; overflow-x: auto; }
  code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
  
  /* [복구] 비교표(Table) 원본 스타일 가깝게 수정 */
  table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem; }
  th { background: var(--brand); color: white; padding: 12px; font-weight: 800; border: 1px solid var(--border); }
  td { padding: 12px; border: 1px solid var(--border); text-align: center; color: var(--text-2); }
  tr:nth-child(even) { background: #fafafa; }

  /* ✓ 기호가 들어간 셀 자동 강조 */
  td:contains('✓') { color: var(--brand-dark); font-weight: 800; background: var(--brand-light); }
</style>
</head>
<body>
  <nav class="nav"><div class="nav-inner"><a href="#" class="nav-logo">${fm.logo ? fm.logo + " " : ""}${fm.title}</a><ul class="nav-links">${navLinksHtml}</ul></div></nav>
  <header class="hero">
    <div class="hero-inner">
      ${fm.badge ? `<div class="hero-badge"><span></span>${escapeHtml(fm.badge)}</div>` : ""}
      ${fm.logo ? `<div class="hero-logo">${escapeHtml(fm.logo)}</div>` : ""}
      <h1>${escapeHtml(fm.title)}</h1>
      <p>${escapeHtml(fm.subtitle)}</p>
      ${fm.heroCta ? `<a class="hero-cta" href="${escapeHtml(fm.heroCta.url || "#")}" target="_blank" rel="noopener">${escapeHtml(fm.heroCta.label)}</a>` : ""}
      ${fm.stats && fm.stats.length ? `<div class="hero-stats">${fm.stats.map(s => `<div class="hero-stat"><strong>${escapeHtml(s.value)}</strong><span>${escapeHtml(s.label)}</span></div>`).join("")}</div>` : ""}
    </div>
  </header>
  <main id="top">${bodyHtml}</main>
  ${fm.done ? `<section class="done-section">
    <h2>${escapeHtml(fm.done.title || "")}</h2>
    ${fm.done.subtitle ? `<p>${escapeHtml(fm.done.subtitle)}</p>` : ""}
    ${fm.done.ctaLabel ? `<a class="done-link" href="${escapeHtml(fm.done.ctaUrl || "#")}" target="_blank" rel="noopener">${escapeHtml(fm.done.ctaLabel)}</a>` : ""}
  </section>` : ""}
  ${fm.footer && fm.footer.length ? `<footer>${fm.footer.map(line => `<div>${marked.parseInline(line)}</div>`).join("")}</footer>` : ""}
  <a class="back-top" href="#top" title="맨 위로">↑</a>
<script>
function switchTab(btn,id){var w=btn.closest('.tabs-wrap');w.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});w.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')});btn.classList.add('active');document.getElementById(id).classList.add('active');}
</script>
</body>
</html>`;

  return { html, styleKey, fm };
}

// ════════════════════════════════════════════════════════════════
//  4. CLI 진입점
// ════════════════════════════════════════════════════════════════

const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isMain) {
  // ── CLI 인수 파싱 ──────────────────────────────────────────────
  // 지원 플래그:
  //   --all          위치 인수를 glob 패턴으로 처리, 매칭된 모든 .md 일괄 변환
  //   --out <path>   단일 파일 변환 시 출력 경로 지정
  //   --style <key>  styles.json 색상 프리셋 강제 지정 (frontmatter보다 우선)
  //   --help         사용법 출력
  const argv = process.argv.slice(2);

  // --help: 사용법 안내 후 종료
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log([
      "",
      "사용법:",
      "  node templates/build-guide.mjs <input.md> [output.html]",
      "  node templates/build-guide.mjs <input.md> [--out path.html] [--style key]",
      "  node templates/build-guide.mjs --all \"mddata/*.md\" [--style key]",
      "",
      "옵션:",
      "  --out <path>   출력 HTML 경로 (기본: public/guides/<이름>.html)",
      "  --style <key>  색상 프리셋 강제 지정 (frontmatter보다 우선)",
      "  --all          위치 인수를 glob 패턴으로 처리, 일괄 변환",
      "  --help         이 도움말 출력",
      "",
      `스타일 키: ${Object.keys(STYLES).filter(k => !k.startsWith("$")).join(" | ")}`,
      "",
    ].join("\n"));
    process.exit(0);
  }

  // 플래그와 위치 인수 분리
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--all")        flags.all = true;
    else if (argv[i] === "--out")   flags.out = argv[++i];
    else if (argv[i] === "--style") flags.style = argv[++i];
    else if (!argv[i].startsWith("--")) positional.push(argv[i]);
  }

  // 인수 없으면 간단한 안내
  if (!positional.length) {
    console.error("사용법: node templates/build-guide.mjs <input.md>  (--help 로 전체 옵션 확인)");
    process.exit(1);
  }

  // --all: glob 패턴으로 여러 파일 일괄 변환
  // 출력은 항상 public/guides/<이름>.html (--out 무시)
  if (flags.all) {
    const { glob } = await import("node:fs/promises");
    for (const pattern of positional) {
      const files = [];
      for await (const f of glob(pattern)) files.push(f);
      if (!files.length) { console.warn(`매칭 파일 없음: ${pattern}`); continue; }
      for (const f of files) {
        try {
          const abs = path.resolve(f);
          const { html } = buildHtml(abs, { style: flags.style || null });
          const outPath = path.join("public/guides", path.basename(abs, ".md") + ".html");
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, html, "utf8");
          console.log(`✅ ${path.basename(abs)} → ${outPath}`);
        } catch (e) {
          console.error(`❌ ${f}: ${e.message}`);
        }
      }
    }
  } else {
    // 단일 파일 변환
    // 출력 경로 우선순위: --out > 두 번째 위치 인수 > 기본 경로
    try {
      const abs = path.resolve(positional[0]);
      const { html } = buildHtml(abs, { style: flags.style || null });
      const outPath = flags.out || positional[1] || path.join("public/guides", path.basename(abs, ".md") + ".html");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, "utf8");
      console.log(`✅ 가이드 HTML 생성 완료: ${outPath}`);
    } catch (e) {
      console.error("❌ 에러 발생:", e.message);
      process.exit(1);
    }
  }
}