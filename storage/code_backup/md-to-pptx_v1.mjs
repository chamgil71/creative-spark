#!/usr/bin/env node
/**
 * md-to-pptx.mjs
 * Markdown 가이드 파일을 PowerPoint(.pptx)로 직접 변환하는 CLI 스크립트
 *
 * 사용법:
 *   node scripts/md-to-pptx.mjs mddata/Supabase.md
 *   node scripts/md-to-pptx.mjs mddata/Supabase.md --out dist/Supabase.pptx
 *   node scripts/md-to-pptx.mjs --all "mddata/*.md"
 *   node scripts/md-to-pptx.mjs mddata/Supabase.md --style ai-dev --verbose
 *
 * 옵션:
 *   --out <path>     출력 .pptx 경로 (기본: dist-pptx/<이름>.pptx)
 *   --style <key>    styles.json 색상 프리셋 강제 지정 (frontmatter보다 우선)
 *   --no-cover       표지 슬라이드 생성 안 함
 *   --verbose        상세 로그 출력
 *   --all            위치 인수를 glob 패턴으로 처리
 *
 * 디자인 설정: scripts/pptdesign.config.json
 * 색상 프리셋:  templates/styles.json
 */

import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import pptxgen from "pptxgenjs";
import { glob } from "node:fs/promises";

// build-guide.mjs에서 가져오지 않고 직접 정의 (독립 실행을 위해 인라인)
function cleanValue(v) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}
function parseShortcodeItems(src) {
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

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJsonWithComments(filePath) {
  const src = readFileSync(filePath, "utf8")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(src);
}

const STYLES = loadJsonWithComments(resolve(__dirname, "../templates/styles.json"));
const D      = loadJsonWithComments(resolve(__dirname, "pptdesign.config.json"));

// ════════════════════════════════════════════════════════════════
//  CLI 파서
// ════════════════════════════════════════════════════════════════

function parseCLI(argv) {
  const flags = { noCover: false, all: false, verbose: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-cover") { flags.noCover = true; continue; }
    if (a === "--all")      { flags.all = true; continue; }
    if (a === "--verbose")  { flags.verbose = true; continue; }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      flags[key] = (!argv[i + 1] || argv[i + 1].startsWith("--")) ? true : argv[++i];
    } else {
      positional.push(a);
    }
  }
  return { positional, ...flags };
}

// ════════════════════════════════════════════════════════════════
//  유틸
// ════════════════════════════════════════════════════════════════

function hexClean(hex) {
  if (!hex) return null;
  hex = (hex + "").replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return hex.length >= 6 ? hex.slice(0, 6).toUpperCase() : null;
}

function stripMd(text) {
  return (text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractText(tok) {
  if (!tok) return "";
  if (typeof tok.text === "string") return tok.text;
  if (Array.isArray(tok.tokens)) return tok.tokens.map(t => extractText(t)).join("");
  return tok.raw || "";
}

// widthInch 안에 fontSize pt 텍스트가 몇 줄인지 추정
function estimateLines(text, widthInch, fontSize) {
  const charsPerLine = Math.max(8, Math.floor(widthInch * 68 / (fontSize * 0.55)));
  return Math.max(1, Math.ceil((text || "").length / charsPerLine));
}

// ════════════════════════════════════════════════════════════════
//  MD 파서 — 슬라이드 데이터 구조 생성
// ════════════════════════════════════════════════════════════════

/**
 * shortcode 블록과 마크다운 텍스트를 분리한 파트 목록 반환
 */
function parseContentParts(content) {
  const parts = [];
  const re = /^:::\s*([A-Za-z0-9_-]+)\s*\n([\s\S]*?)\n:::$/gm;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "md", src: content.slice(lastIndex, match.index) });
    }
    parts.push({
      kind: "shortcode",
      scType: match[1],
      items: parseShortcodeItems(match[2]),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ kind: "md", src: content.slice(lastIndex) });
  }
  return parts;
}

function tokenToBlock(tok) {
  switch (tok.type) {
    case "paragraph":
      return { type: "p", text: stripMd(extractText(tok)) };
    case "heading":
      if (tok.depth === 3) return { type: "h3", text: stripMd(extractText(tok)) };
      if (tok.depth === 4) return { type: "h4", text: stripMd(extractText(tok)) };
      return null;
    case "list":
      return {
        type: tok.ordered ? "ol" : "ul",
        items: tok.items.map(item => stripMd(item.text || extractText(item))),
      };
    case "blockquote": {
      const t = (tok.tokens || []).map(t2 => extractText(t2)).join(" ");
      return { type: "blockquote", text: stripMd(t) };
    }
    case "code":
      return { type: "code", lang: tok.lang || "", text: tok.text || "" };
    case "table":
      return {
        type: "table",
        headers: tok.header.map(h => stripMd(extractText(h))),
        rows: tok.rows.map(row => row.map(cell => stripMd(extractText(cell)))),
      };
    default:
      return null;
  }
}

/**
 * MD 파일 파싱 → { fm, sections, styleKey, style }
 *
 * sections: [{ num, title, items }]
 * items: card | icon-grid | feature-grid | steps | compare-grid
 * card: { type:"card", title, blocks:[Block] }
 */
function buildSlideData(mdPath, styleOverride) {
  const raw = readFileSync(mdPath, "utf8");
  const { data: fm, content } = matter(raw);

  const styleKey = styleOverride || fm.style || "ai-chat";
  const style = STYLES[styleKey] || STYLES["ai-chat"];

  const parts = parseContentParts(content);
  const sections = [];
  let currentSection = null;
  let currentCard = null;
  let sectionNum = 0;

  function closeCard() {
    if (currentCard) {
      if (currentSection) currentSection.items.push(currentCard);
      currentCard = null;
    }
  }
  function closeSection() {
    closeCard();
    if (currentSection) sections.push(currentSection);
    currentSection = null;
  }

  for (const part of parts) {
    if (part.kind === "shortcode") {
      if (!currentSection) {
        sectionNum++;
        currentSection = { num: sectionNum, title: "", items: [] };
      }
      closeCard();
      currentSection.items.push({ type: part.scType, items: part.items });
      continue;
    }

    const tokens = marked.lexer(part.src);
    for (const tok of tokens) {
      if (tok.type === "heading" && tok.depth === 1) {
        closeSection();
        sectionNum++;
        const raw2 = stripMd(extractText(tok));
        const m = raw2.match(/^\s*(\d+)\.\s*(.+)$/);
        currentSection = {
          num: m ? parseInt(m[1]) : sectionNum,
          title: m ? m[2] : raw2,
          items: [],
        };
      } else if (tok.type === "heading" && tok.depth === 2) {
        closeCard();
        if (!currentSection) {
          sectionNum++;
          currentSection = { num: sectionNum, title: "", items: [] };
        }
        currentCard = { type: "card", title: stripMd(extractText(tok)), blocks: [] };
      } else if (tok.type === "hr") {
        closeSection();
      } else if (tok.type === "space") {
        // ignore
      } else {
        if (!currentSection) {
          sectionNum++;
          currentSection = { num: sectionNum, title: "", items: [] };
        }
        if (!currentCard) {
          currentCard = { type: "card", title: "", blocks: [] };
        }
        const block = tokenToBlock(tok);
        if (block) currentCard.blocks.push(block);
      }
    }
  }
  closeSection();

  return { fm, sections, styleKey, style };
}

// ════════════════════════════════════════════════════════════════
//  높이 추정 (인치)
// ════════════════════════════════════════════════════════════════

function blockH(block, w) {
  const c = D.card;
  switch (block.type) {
    case "h3": return (c.h3Size / 72) * 1.7 + c.gap;
    case "h4": return (c.h4Size / 72) * 1.7 + c.gap;
    case "p": {
      const lines = estimateLines(block.text, w - c.padX * 2, c.bodySize);
      return (c.bodySize / 72) * 1.7 * lines + c.gap;
    }
    case "ul":
    case "ol":
      return (c.bodySize / 72) * 1.7 * block.items.length + c.gap;
    case "blockquote": {
      const lines = estimateLines(block.text, w - c.padX * 2 - c.quoteBarW - 0.1, c.quoteTextSize);
      return Math.max(0.4, (c.quoteTextSize / 72) * 1.7 * lines + 0.15) + c.gap;
    }
    case "code": {
      const lines = (block.text || "").split("\n").length;
      return (c.codeSize / 72) * 1.7 * lines + 0.2 + c.gap;
    }
    case "table":
      return 0.35 + 0.28 * (block.rows || []).length + c.gap;
    default:
      return 0;
  }
}

function cardH(card, w) {
  const c = D.card;
  let h = c.padY * 2;
  if (card.title) h += (c.titleSize / 72) * 1.7 + c.gap * 0.5;
  for (const b of (card.blocks || [])) h += blockH(b, w);
  return Math.max(0.45, h);
}

function itemH(item, w) {
  const g = D.grid;
  const c = D.card;
  if (item.type === "card") return cardH(item, w);
  if (item.type === "icon-grid") {
    const cols = Math.max(1, Math.floor(w / g.iconCardMinW));
    return Math.ceil(item.items.length / cols) * (1.4 + g.gap);
  }
  if (item.type === "feature-grid") {
    const cols = Math.max(1, Math.floor(w / g.featureCardMinW));
    return Math.ceil(item.items.length / cols) * (1.5 + g.gap);
  }
  if (item.type === "steps") {
    return item.items.length * (g.stepItemH + c.gap);
  }
  if (item.type === "compare-grid") {
    const cols = Math.max(1, Math.floor(w / g.compareCardMinW));
    return Math.ceil(item.items.length / cols) * (1.4 + g.gap);
  }
  if (item.type === "workflow")  return D.workflow.stepH + D.card.gap;
  if (item.type === "tool-card") return item.items.length * (D.toolCard.h + D.card.gap);
  if (item.type === "plan-grid") {
    const pg = D.planGrid;
    const maxFeat = Math.max(0, ...item.items.map(it =>
      (it.features || "").split("|").filter(Boolean).length
    ));
    return D.card.padY + 0.26 + 0.32 + maxFeat * pg.featureLineH + 0.28 + D.card.padY + D.card.gap;
  }
  if (item.type === "skill-list") return item.items.length * (D.skillList.rowH + D.card.gap);
  if (item.type === "badge-grid") {
    const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / D.badgeGrid.minW)));
    return Math.ceil(item.items.length / cols) * (D.badgeGrid.cardH + D.card.gap);
  }
  if (item.type === "columns")  return 1.5 + D.card.gap;
  if (item.type === "bottom-list") return 1.2 + D.card.gap + D.bottomList.chipH + D.card.gap;
  if (item.type === "compare-2col") {
    if (item.items.length < 2) return 1.5 + D.card.gap;
    const maxFeat = Math.max(0, ...item.items.slice(0, 2).map(it =>
      (it.items || "").split("|").filter(Boolean).length
    ));
    const lh = (D.card.bodySize / 72) * 1.7;
    return D.card.padY + (D.card.titleSize / 72) * 1.7 + D.card.gap + maxFeat * (lh + 0.05) + D.compare2col.noteH + 0.12 + D.card.padY + D.card.gap;
  }
  return 0;
}

// ════════════════════════════════════════════════════════════════
//  색상 팔레트
// ════════════════════════════════════════════════════════════════

function makePalette(style) {
  const p = D.palette;
  return {
    brand:      hexClean(style.brand)      || "6366F1",
    brandDark:  hexClean(style.brandDark)  || "4338CA",
    brandDeep:  hexClean(style.brandDeep)  || "3730A3",
    brandLight: hexClean(style.brandLight) || "EEF2FF",
    border:     hexClean(style.border)     || "D8DCFB",
    bgDark:     p.bgDark,
    white:      p.white,
    text:       p.text,
    text2:      p.text2,
    codeBg:     p.codeBg,
    codeText:   p.codeText,
  };
}

// ════════════════════════════════════════════════════════════════
//  블록 렌더러
// ════════════════════════════════════════════════════════════════

function renderBlock(slide, block, x, y, w, pal) {
  const c = D.card;
  const font = D.slide.font;
  const mono = D.slide.fontMono;

  if (block.type === "h3") {
    const h = (c.h3Size / 72) * 1.7;
    slide.addText(block.text, { x, y, w, h: h + 0.05, fontSize: c.h3Size, bold: true, color: pal.text, fontFace: font, valign: "top" });
    return h + c.gap;
  }

  if (block.type === "h4") {
    const h = (c.h4Size / 72) * 1.7;
    slide.addText(block.text, { x, y, w, h: h + 0.05, fontSize: c.h4Size, bold: true, color: pal.text2, fontFace: font, valign: "top" });
    return h + c.gap;
  }

  if (block.type === "p") {
    const lines = estimateLines(block.text, w, c.bodySize);
    const h = Math.max(0.2, (c.bodySize / 72) * 1.7 * lines);
    slide.addText(block.text, { x, y, w, h, fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true });
    return h + c.gap;
  }

  if (block.type === "ul" || block.type === "ol") {
    const lineH = (c.bodySize / 72) * 1.7;
    const h = Math.max(0.2, lineH * block.items.length);
    const textArr = block.items.map((item, i) => ({
      text: (block.type === "ol" ? `${i + 1}. ` : "• ") + item + "\n",
      options: { fontSize: c.bodySize, color: pal.text2, fontFace: font },
    }));
    slide.addText(textArr, { x, y, w, h, valign: "top" });
    return h + c.gap;
  }

  if (block.type === "blockquote") {
    const lines = estimateLines(block.text, w - c.quoteBarW - 0.12, c.quoteTextSize);
    const h = Math.max(0.38, (c.quoteTextSize / 72) * 1.7 * lines + 0.15);
    slide.addShape("rect", { x, y, w: c.quoteBarW, h, fill: { color: pal.brand }, line: { color: pal.brand } });
    slide.addShape("rect", { x: x + c.quoteBarW, y, w: w - c.quoteBarW, h, fill: { color: pal.brandLight }, line: { color: pal.brandLight } });
    slide.addText(block.text, {
      x: x + c.quoteBarW + 0.1, y: y + 0.06, w: w - c.quoteBarW - 0.14, h: h - 0.1,
      fontSize: c.quoteTextSize, color: pal.brandDeep || pal.brandDark, fontFace: font, italic: true, valign: "middle", wrap: true,
    });
    return h + c.gap;
  }

  if (block.type === "code") {
    const codeLines = (block.text || "").split("\n");
    const h = Math.max(0.4, (c.codeSize / 72) * 1.7 * codeLines.length + 0.2);
    slide.addShape("rect", { x, y, w, h, fill: { color: pal.codeBg }, line: { color: D.palette.codeBorder, width: 0.75 } });
    slide.addText(block.text, {
      x: x + 0.12, y: y + 0.08, w: w - 0.24, h: h - 0.1,
      fontSize: c.codeSize, color: pal.codeText, fontFace: mono, valign: "top", wrap: true,
    });
    return h + c.gap;
  }

  if (block.type === "table") {
    const headerH = 0.35;
    const rowH = 0.28;
    const totalH = headerH + rowH * (block.rows || []).length;
    const colW = w / Math.max(1, block.headers.length);

    const tableData = [
      block.headers.map(h2 => ({
        text: h2,
        options: { bold: true, fontSize: c.bodySize, color: pal.white, fill: { color: pal.brand } },
      })),
      ...(block.rows || []).map(row =>
        row.map(cell => ({
          text: cell,
          options: { fontSize: c.bodySize - 1, color: pal.text2 },
        }))
      ),
    ];

    slide.addTable(tableData, {
      x, y, w,
      colW: block.headers.map(() => colW),
      rowH: [headerH, ...(block.rows || []).map(() => rowH)],
      border: { color: pal.border, size: 0.75 },
      fontFace: font,
    });
    return totalH + c.gap;
  }

  return 0;
}

// ════════════════════════════════════════════════════════════════
//  아이템 렌더러
// ════════════════════════════════════════════════════════════════

function renderCard(slide, card, x, y, w, pal) {
  const c = D.card;
  const font = D.slide.font;
  const h = cardH(card, w);

  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: c.radius,
    fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
  });

  let cy = y + c.padY;
  const cw = w - c.padX * 2;
  const cx = x + c.padX;

  if (card.title) {
    const th = (c.titleSize / 72) * 1.7;
    slide.addText(card.title, {
      x: cx, y: cy, w: cw, h: th + 0.05,
      fontSize: c.titleSize, bold: true, color: pal.brandDark, fontFace: font, valign: "top",
    });
    cy += th + 0.05 + c.gap * 0.5;
  }

  for (const block of (card.blocks || [])) {
    cy += renderBlock(slide, block, cx, cy, cw, pal);
  }

  return h;
}

function renderIconGrid(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const font = D.slide.font;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / g.iconCardMinW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.4;
  const rows = Math.ceil(item.items.length / cols);

  item.items.forEach((it, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap);
    const cy = y + row * (cardH2 + g.gap);

    slide.addShape("roundRect", {
      x: cx, y: cy, w: cardW, h: cardH2, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    if (it.icon) {
      slide.addText(it.icon, { x: cx + 0.1, y: cy + 0.1, w: cardW - 0.2, h: 0.42, fontSize: 20, align: "center", valign: "middle" });
    }
    slide.addText(it.title || "", {
      x: cx + 0.1, y: cy + 0.58, w: cardW - 0.2, h: 0.28,
      fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, align: "center",
    });
    if (it.desc) {
      slide.addText(it.desc, {
        x: cx + 0.1, y: cy + 0.88, w: cardW - 0.2, h: cardH2 - 0.94,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, align: "center", wrap: true, valign: "top",
      });
    }
  });

  return rows * (cardH2 + g.gap);
}

function renderFeatureGrid(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const font = D.slide.font;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / g.featureCardMinW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.5;
  const rows = Math.ceil(item.items.length / cols);

  item.items.forEach((it, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap);
    const cy = y + row * (cardH2 + g.gap);

    slide.addShape("roundRect", {
      x: cx, y: cy, w: cardW, h: cardH2, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    // 상단 액센트 바
    slide.addShape("rect", {
      x: cx, y: cy, w: cardW, h: 0.04,
      fill: { color: pal.brand }, line: { color: pal.brand },
    });

    let ty = cy + 0.12;
    if (it.tag) {
      slide.addText(it.tag, {
        x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.22,
        fontSize: 8, bold: true, color: pal.brandDark, fontFace: font,
      });
      ty += 0.24;
    }
    const titleText = (it.icon ? it.icon + " " : "") + (it.title || "");
    slide.addText(titleText, {
      x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.3,
      fontSize: c.titleSize, bold: true, color: pal.text, fontFace: font,
    });
    ty += 0.34;
    if (it.desc) {
      slide.addText(it.desc, {
        x: cx + 0.12, y: ty, w: cardW - 0.24, h: cardH2 - (ty - cy) - 0.08,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top",
      });
    }
  });

  return rows * (cardH2 + g.gap);
}

function renderSteps(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const font = D.slide.font;
  const stepH = g.stepItemH;

  item.items.forEach((it, idx) => {
    const cy = y + idx * (stepH + c.gap);
    slide.addShape("roundRect", {
      x, y: cy, w, h: stepH, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });

    const numSz = 0.42;
    const ny = cy + (stepH - numSz) / 2;
    slide.addShape("roundRect", {
      x: x + 0.1, y: ny, w: numSz, h: numSz, rectRadius: 0.1,
      fill: { color: pal.brand }, line: { color: pal.brand },
    });
    slide.addText(String(it.num || idx + 1), {
      x: x + 0.1, y: ny, w: numSz, h: numSz,
      fontSize: 13, bold: true, color: pal.white, fontFace: font, align: "center", valign: "middle",
    });

    const tx = x + 0.1 + numSz + 0.12;
    const tw = w - 0.1 - numSz - 0.22;
    slide.addText(it.title || "", {
      x: tx, y: cy + 0.07, w: tw, h: 0.26,
      fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, valign: "top",
    });
    if (it.desc) {
      slide.addText(it.desc, {
        x: tx, y: cy + 0.34, w: tw, h: stepH - 0.4,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top",
      });
    }
  });

  return item.items.length * (stepH + c.gap);
}

function renderCompareGrid(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const font = D.slide.font;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / g.compareCardMinW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.4;
  const rows = Math.ceil(item.items.length / cols);

  item.items.forEach((it, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap);
    const cy = y + row * (cardH2 + g.gap);

    slide.addShape("roundRect", {
      x: cx, y: cy, w: cardW, h: cardH2, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    slide.addText(it.title || "", {
      x: cx + 0.12, y: cy + 0.1, w: cardW - 0.24, h: 0.3,
      fontSize: c.titleSize, bold: true, color: pal.brandDark, fontFace: font,
    });
    if (it.desc) {
      slide.addText(it.desc, {
        x: cx + 0.12, y: cy + 0.42, w: cardW - 0.24, h: 0.6,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top",
      });
    }
    if (it.note) {
      slide.addShape("roundRect", {
        x: cx + 0.12, y: cy + 1.05, w: cardW - 0.24, h: 0.28, rectRadius: 0.06,
        fill: { color: pal.brandLight }, line: { color: pal.brandLight },
      });
      slide.addText(it.note, {
        x: cx + 0.12, y: cy + 1.05, w: cardW - 0.24, h: 0.28,
        fontSize: 8, bold: true, color: pal.brandDark, fontFace: font, align: "center", valign: "middle",
      });
    }
  });

  return rows * (cardH2 + g.gap);
}

function renderWorkflow(slide, item, x, y, w, pal) {
  const c = D.card;
  const font = D.slide.font;
  const n = item.items.length;
  if (!n) return 0;
  const stepH = D.workflow.stepH;
  const arrowW = D.workflow.arrowW;
  const stepW = (w - (n - 1) * arrowW) / n;

  item.items.forEach((it, idx) => {
    const cx = x + idx * (stepW + arrowW);
    slide.addShape("roundRect", {
      x: cx, y, w: stepW, h: stepH, rectRadius: c.radius / 2,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    if (it.icon) {
      slide.addText(it.icon, { x: cx, y: y + 0.08, w: stepW, h: 0.3, fontSize: 16, align: "center", valign: "middle" });
    }
    slide.addText(it.name || "", {
      x: cx + 0.06, y: y + 0.42, w: stepW - 0.12, h: 0.26,
      fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, align: "center",
    });
    if (it.tool) {
      slide.addText(it.tool, {
        x: cx + 0.06, y: y + 0.68, w: stepW - 0.12, h: 0.18,
        fontSize: c.bodySize - 2, color: pal.text2, fontFace: font, align: "center",
      });
    }
    if (idx < n - 1) {
      slide.addText("→", {
        x: cx + stepW, y: y + (stepH - 0.22) / 2, w: arrowW, h: 0.22,
        fontSize: 14, color: D.palette.workflowArrow, align: "center", valign: "middle",
      });
    }
  });
  return stepH + c.gap;
}

function renderToolCard(slide, item, x, y, w, pal) {
  const c = D.card;
  const font = D.slide.font;
  const cardH = D.toolCard.h;
  let cy = y;

  for (const it of item.items) {
    const bgColor = hexClean(it.color) || pal.brand;
    slide.addShape("roundRect", {
      x, y: cy, w, h: cardH, rectRadius: c.radius / 2,
      fill: { color: bgColor }, line: { color: bgColor },
    });
    let cx = x + 0.16;
    if (it.icon) {
      slide.addText(it.icon, { x: cx, y: cy, w: 0.52, h: cardH, fontSize: 20, align: "center", valign: "middle" });
      cx += 0.58;
    }
    const badgeW = it.badge ? 1.1 : 0;
    const tw = w - (cx - x) - badgeW - 0.14;
    slide.addText(it.name || "", {
      x: cx, y: cy + 0.1, w: tw, h: 0.28,
      fontSize: c.titleSize, bold: true, color: D.palette.white, fontFace: font,
    });
    if (it.tagline) {
      slide.addText(it.tagline, {
        x: cx, y: cy + 0.4, w: tw, h: 0.22,
        fontSize: c.bodySize - 2, color: D.palette.codeText, fontFace: font,
      });
    }
    if (it.badge) {
      slide.addText(it.badge, {
        x: x + w - badgeW - 0.08, y: cy + (cardH - 0.22) / 2, w: badgeW, h: 0.22,
        fontSize: 9, bold: true, color: D.palette.white, fontFace: font, align: "right",
      });
    }
    cy += cardH + c.gap;
  }
  return item.items.length * (cardH + c.gap);
}

// ════════════════════════════════════════════════════════════════
//  신규 레이아웃 렌더러
// ════════════════════════════════════════════════════════════════

function renderPlanGrid(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const pg = D.planGrid;
  const p  = D.palette;
  const font = D.slide.font;
  const cols = Math.max(1, Math.min(item.items.length, pg.maxCols));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const maxFeat = Math.max(0, ...item.items.map(it =>
    (it.features || "").split("|").filter(Boolean).length
  ));
  const cardH2 = c.padY + 0.26 + 0.32 + maxFeat * pg.featureLineH + 0.28 + c.padY;

  item.items.forEach((it, idx) => {
    if (idx >= cols) return;
    const cx = x + idx * (cardW + g.gap);
    const isFeatured = it.featured === "true";

    slide.addShape("roundRect", {
      x: cx, y, w: cardW, h: cardH2, rectRadius: c.radius,
      fill: { color: isFeatured ? pal.brandLight : p.white },
      line: { color: isFeatured ? pal.brand : pal.border, width: isFeatured ? 1.5 : 0.75 },
    });
    slide.addShape("rect", {
      x: cx, y, w: cardW, h: 0.05,
      fill: { color: isFeatured ? pal.brand : pal.border },
      line: { color: isFeatured ? pal.brand : pal.border },
    });

    let ty = y + c.padY;
    if (it.badge) {
      const bw = Math.min(cardW - 0.24, 1.2);
      slide.addShape("roundRect", {
        x: cx + 0.12, y: ty, w: bw, h: 0.22, rectRadius: 0.08,
        fill: { color: isFeatured ? pal.brand : pal.brandLight },
        line: { color: isFeatured ? pal.brand : pal.brandLight },
      });
      slide.addText(it.badge, {
        x: cx + 0.12, y: ty, w: bw, h: 0.22,
        fontSize: 8, bold: true, color: isFeatured ? p.white : pal.brandDark,
        fontFace: font, align: "center", valign: "middle",
      });
      ty += 0.26;
    }
    slide.addText(it.title || "", {
      x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.28,
      fontSize: c.titleSize, bold: true, color: pal.text, fontFace: font, valign: "top",
    });
    ty += 0.32;

    const features = (it.features || "").split("|").map(f => f.trim()).filter(Boolean);
    for (const feat of features) {
      slide.addText("• " + feat, {
        x: cx + 0.12, y: ty, w: cardW - 0.24, h: pg.featureLineH,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, valign: "top",
      });
      ty += pg.featureLineH;
    }
    if (it.note) {
      const noteY = y + cardH2 - c.padY - 0.24;
      slide.addShape("roundRect", {
        x: cx + 0.12, y: noteY, w: cardW - 0.24, h: 0.22, rectRadius: 0.06,
        fill: { color: isFeatured ? pal.brand : pal.brandLight },
        line: { color: isFeatured ? pal.brand : pal.brandLight },
      });
      slide.addText(it.note, {
        x: cx + 0.12, y: noteY, w: cardW - 0.24, h: 0.22,
        fontSize: 8, bold: true, color: isFeatured ? p.white : pal.brandDark,
        fontFace: font, align: "center", valign: "middle",
      });
    }
  });
  return cardH2 + c.gap;
}

function renderSkillList(slide, item, x, y, w, pal) {
  const c  = D.card;
  const sl = D.skillList;
  const font = D.slide.font;
  const rowH  = sl.rowH;
  const iconSz = sl.iconSize;

  item.items.forEach((it, idx) => {
    const cy = y + idx * (rowH + c.gap);
    slide.addShape("roundRect", {
      x, y: cy, w, h: rowH, rectRadius: c.radius / 2,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    const iy = cy + (rowH - iconSz) / 2;
    slide.addShape("roundRect", {
      x: x + 0.1, y: iy, w: iconSz, h: iconSz, rectRadius: 0.08,
      fill: { color: pal.brandLight }, line: { color: pal.brandLight },
    });
    if (it.icon) {
      slide.addText(it.icon, {
        x: x + 0.1, y: iy, w: iconSz, h: iconSz,
        fontSize: 16, align: "center", valign: "middle",
      });
    }
    const tx = x + 0.1 + iconSz + 0.12;
    const tw = w - 0.1 - iconSz - 0.22;
    slide.addText(it.title || "", {
      x: tx, y: cy + 0.1, w: tw * 0.38, h: rowH - 0.2,
      fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, valign: "middle",
    });
    if (it.desc) {
      slide.addText(it.desc, {
        x: tx + tw * 0.4, y: cy + 0.1, w: tw * 0.58, h: rowH - 0.2,
        fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, valign: "middle",
      });
    }
  });
  return item.items.length * (rowH + c.gap);
}

function renderBadgeGrid(slide, item, x, y, w, pal) {
  const g  = D.grid;
  const c  = D.card;
  const bg = D.badgeGrid;
  const font = D.slide.font;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / bg.minW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = bg.cardH;
  const rows = Math.ceil(item.items.length / cols);

  item.items.forEach((it, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap);
    const cy = y + row * (cardH2 + g.gap);
    slide.addShape("roundRect", {
      x: cx, y: cy, w: cardW, h: cardH2, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    if (it.icon) {
      slide.addText(it.icon, {
        x: cx, y: cy + 0.1, w: cardW, h: 0.34,
        fontSize: 16, align: "center", valign: "middle",
      });
    }
    slide.addText(it.name || "", {
      x: cx + 0.06, y: cy + 0.48, w: cardW - 0.12, h: 0.26,
      fontSize: c.bodySize - 1, bold: true, color: pal.text, fontFace: font, align: "center",
    });
    if (it.type) {
      slide.addText(it.type, {
        x: cx + 0.06, y: cy + 0.76, w: cardW - 0.12, h: 0.22,
        fontSize: c.bodySize - 2, color: pal.text2, fontFace: font, align: "center",
      });
    }
  });
  return rows * (cardH2 + g.gap);
}

// 좌우 배치 2~5단
function renderColumns(slide, item, x, y, w, pal) {
  const g = D.grid;
  const c = D.card;
  const font = D.slide.font;
  const n = Math.min(item.items.length, D.columns.maxCols);
  if (!n) return 0;
  const colW = (w - (n - 1) * g.gap) / n;

  const maxH = Math.max(0.8, ...item.items.slice(0, n).map(it => {
    let h = c.padY * 2 + 0.05;
    if (it.title) h += (c.titleSize / 72) * 1.7 + c.gap;
    if (it.desc)  h += (c.bodySize / 72) * 1.7 * estimateLines(it.desc, colW - c.padX * 2, c.bodySize) + c.gap;
    return h;
  }));

  item.items.slice(0, n).forEach((it, idx) => {
    const cx = x + idx * (colW + g.gap);
    slide.addShape("roundRect", {
      x: cx, y, w: colW, h: maxH, rectRadius: c.radius,
      fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
    });
    slide.addShape("rect", {
      x: cx, y, w: colW, h: 0.04,
      fill: { color: pal.brand }, line: { color: pal.brand },
    });
    let ty = y + c.padY;
    if (it.title) {
      const th = (c.titleSize / 72) * 1.7;
      slide.addText(it.title, {
        x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: th + 0.05,
        fontSize: c.titleSize, bold: true, color: pal.brandDark, fontFace: font, valign: "top",
      });
      ty += th + c.gap;
    }
    if (it.desc) {
      const lines = estimateLines(it.desc, colW - c.padX * 2, c.bodySize);
      slide.addText(it.desc, {
        x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: Math.max(0.2, (c.bodySize / 72) * 1.7 * lines),
        fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true,
      });
    }
  });
  return maxH + c.gap;
}

// 하단 요점 칩 배치
function renderBottomList(slide, item, x, y, w, pal) {
  const c  = D.card;
  const bl = D.bottomList;
  const font = D.slide.font;
  if (!item.items.length) return 0;
  const it = item.items[0];
  const points = (it.points || "").split("|").map(p => p.trim()).filter(Boolean);

  const bodyLines = it.body ? estimateLines(it.body, w - c.padX * 2, c.bodySize) : 0;
  const topH = Math.max(0.8,
    c.padY * 2
    + (it.title ? (c.titleSize / 72) * 1.7 + c.gap : 0)
    + (bodyLines > 0 ? (c.bodySize / 72) * 1.7 * bodyLines + c.gap : 0)
  );

  slide.addShape("roundRect", {
    x, y, w, h: topH, rectRadius: c.radius,
    fill: { color: pal.white }, line: { color: pal.border, width: 0.75 },
  });
  let ty = y + c.padY;
  if (it.title) {
    const th = (c.titleSize / 72) * 1.7;
    slide.addText(it.title, {
      x: x + c.padX, y: ty, w: w - c.padX * 2, h: th + 0.05,
      fontSize: c.titleSize, bold: true, color: pal.brandDark, fontFace: font, valign: "top",
    });
    ty += th + c.gap;
  }
  if (it.body) {
    slide.addText(it.body, {
      x: x + c.padX, y: ty, w: w - c.padX * 2, h: Math.max(0.2, (c.bodySize / 72) * 1.7 * bodyLines),
      fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true,
    });
  }

  if (points.length) {
    const chipBY = y + topH + c.gap;
    const chipW  = (w - (points.length - 1) * bl.chipGap) / points.length;
    points.forEach((pt, i) => {
      const cx = x + i * (chipW + bl.chipGap);
      slide.addShape("roundRect", {
        x: cx, y: chipBY, w: chipW, h: bl.chipH, rectRadius: bl.chipRadius,
        fill: { color: pal.brandLight }, line: { color: pal.border, width: 0.75 },
      });
      slide.addText(pt, {
        x: cx + bl.chipPadX, y: chipBY, w: chipW - bl.chipPadX * 2, h: bl.chipH,
        fontSize: c.bodySize - 1, bold: true, color: pal.brandDeep || pal.brandDark,
        fontFace: font, align: "center", valign: "middle",
      });
    });
    return topH + c.gap + bl.chipH + c.gap;
  }
  return topH + c.gap;
}

// 2단 비교 (주요 내용 하단 여러줄 정리)
function renderCompare2Col(slide, item, x, y, w, pal) {
  const c  = D.card;
  const cc = D.compare2col;
  const p  = D.palette;
  const font = D.slide.font;
  if (item.items.length < 2) return renderCompareGrid(slide, item, x, y, w, pal);

  const colW = (w - cc.colGap) / 2;
  const lh = (c.bodySize / 72) * 1.7;

  const maxH = Math.max(1.2, ...item.items.slice(0, 2).map(it => {
    const its = (it.items || "").split("|").map(s => s.trim()).filter(Boolean);
    return c.padY + (c.titleSize / 72) * 1.7 + c.gap
         + its.length * (lh + 0.05)
         + (it.note ? cc.noteH + 0.12 : 0)
         + c.padY;
  }));

  item.items.slice(0, 2).forEach((it, idx) => {
    const cx = x + idx * (colW + cc.colGap);
    const isLeft = idx === 0;

    slide.addShape("roundRect", {
      x: cx, y, w: colW, h: maxH, rectRadius: c.radius,
      fill: { color: isLeft ? pal.brandLight : p.white },
      line: { color: isLeft ? pal.brand : pal.border, width: isLeft ? 1.5 : 0.75 },
    });
    slide.addShape("rect", {
      x: cx, y, w: colW, h: 0.05,
      fill: { color: isLeft ? pal.brand : pal.text2 },
      line: { color: isLeft ? pal.brand : pal.text2 },
    });

    let ty = y + c.padY;
    slide.addText(it.col || it.title || "", {
      x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: (c.titleSize / 72) * 1.7 + 0.05,
      fontSize: c.titleSize + 1, bold: true,
      color: isLeft ? (pal.brandDeep || pal.brandDark) : pal.text,
      fontFace: font, valign: "top",
    });
    ty += (c.titleSize / 72) * 1.7 + c.gap;

    const its = (it.items || "").split("|").map(s => s.trim()).filter(Boolean);
    for (const bullet of its) {
      slide.addText("• " + bullet, {
        x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: lh + 0.05,
        fontSize: c.bodySize,
        color: isLeft ? (pal.brandDeep || pal.brandDark) : pal.text2,
        fontFace: font,
      });
      ty += lh + 0.05;
    }

    if (it.note) {
      const noteY = y + maxH - c.padY - cc.noteH;
      slide.addShape("roundRect", {
        x: cx + c.padX, y: noteY, w: colW - c.padX * 2, h: cc.noteH, rectRadius: cc.noteRadius,
        fill: { color: isLeft ? pal.brand : pal.brandLight },
        line: { color: isLeft ? pal.brand : pal.brandLight },
      });
      slide.addText(it.note, {
        x: cx + c.padX, y: noteY, w: colW - c.padX * 2, h: cc.noteH,
        fontSize: 8, bold: true, color: isLeft ? p.white : pal.brandDark,
        fontFace: font, align: "center", valign: "middle",
      });
    }
  });
  return maxH + c.gap;
}

function renderItem(slide, item, x, y, w, pal) {
  if (item.type === "card")          return renderCard(slide, item, x, y, w, pal);
  if (item.type === "icon-grid")     return renderIconGrid(slide, item, x, y, w, pal);
  if (item.type === "feature-grid")  return renderFeatureGrid(slide, item, x, y, w, pal);
  if (item.type === "steps")         return renderSteps(slide, item, x, y, w, pal);
  if (item.type === "compare-grid")  return renderCompareGrid(slide, item, x, y, w, pal);
  if (item.type === "workflow")      return renderWorkflow(slide, item, x, y, w, pal);
  if (item.type === "tool-card")     return renderToolCard(slide, item, x, y, w, pal);
  if (item.type === "plan-grid")     return renderPlanGrid(slide, item, x, y, w, pal);
  if (item.type === "skill-list")    return renderSkillList(slide, item, x, y, w, pal);
  if (item.type === "badge-grid")    return renderBadgeGrid(slide, item, x, y, w, pal);
  if (item.type === "columns")       return renderColumns(slide, item, x, y, w, pal);
  if (item.type === "bottom-list")   return renderBottomList(slide, item, x, y, w, pal);
  if (item.type === "compare-2col")  return renderCompare2Col(slide, item, x, y, w, pal);
  return 0;
}

// ════════════════════════════════════════════════════════════════
//  슬라이드 렌더러
// ════════════════════════════════════════════════════════════════

function renderCover(prs, fm, pal) {
  const slide = prs.addSlide();
  const dc = D.cover;
  const sw = D.slide.widthIn;
  const font = D.slide.font;

  slide.background = { color: pal.bgDark };

  // 액센트 바
  slide.addShape("rect", {
    x: dc.accentBarX, y: dc.accentBarY, w: dc.accentBarW, h: dc.accentBarH,
    fill: { color: pal.brand }, line: { color: pal.brand },
  });

  let ty = dc.titleY;

  // 로고
  if (fm.logo) {
    slide.addText(fm.logo, {
      x: dc.titleX, y: ty - 0.85, w: 0.85, h: 0.75,
      fontSize: dc.logoFontSize, align: "left", valign: "middle",
    });
  }

  // 제목
  slide.addText(fm.title || "", {
    x: dc.titleX, y: ty, w: sw - dc.titleX - 0.5, h: 1.2,
    fontSize: dc.titleFontSize, bold: true, color: pal.white, fontFace: font, valign: "top",
  });
  ty += 1.2;

  // 부제목
  if (fm.subtitle) {
    slide.addText(fm.subtitle, {
      x: dc.titleX, y: ty, w: sw - dc.titleX - 0.5, h: 0.4,
      fontSize: dc.subtitleFontSize, color: D.palette.coverSubtitle, fontFace: font,
    });
    ty += 0.5;
  }

  // 통계
  if (fm.stats?.length) {
    const statW = 1.4;
    fm.stats.forEach((stat, i) => {
      const sx = dc.titleX + i * (statW + 0.2);
      slide.addText(stat.value || "", {
        x: sx, y: ty, w: statW, h: 0.38,
        fontSize: 18, bold: true, color: pal.brand, fontFace: font,
      });
      slide.addText(stat.label || "", {
        x: sx, y: ty + 0.36, w: statW, h: 0.24,
        fontSize: 10, color: D.palette.coverStatLabel, fontFace: font,
      });
    });
  }
}

function renderSectionSlide(prs, section, pal, verbose) {
  const slide = prs.addSlide();
  const dh = D.header;
  const sw = D.slide.widthIn;
  const mx = D.slide.marginX;
  const font = D.slide.font;
  const bodyW = sw - mx * 2;

  slide.background = { color: D.palette.white };

  // 헤더 바
  slide.addShape("rect", {
    x: 0, y: dh.y, w: sw, h: dh.h,
    fill: { color: pal.bgDark }, line: { color: pal.bgDark },
  });

  // 섹션 번호 박스
  const nbs = dh.numBoxSize;
  const nby = dh.y + (dh.h - nbs) / 2;
  slide.addShape("roundRect", {
    x: dh.paddingX, y: nby, w: nbs, h: nbs, rectRadius: 0.1,
    fill: { color: pal.brand }, line: { color: pal.brand },
  });
  slide.addText(String(section.num), {
    x: dh.paddingX, y: nby, w: nbs, h: nbs,
    fontSize: dh.numFontSize, bold: true, color: pal.white, fontFace: font, align: "center", valign: "middle",
  });

  // 섹션 제목
  slide.addText(section.title, {
    x: dh.paddingX + nbs + 0.15, y: dh.y, w: sw - dh.paddingX - nbs - 0.25, h: dh.h,
    fontSize: dh.titleFontSize, bold: true, color: pal.white, fontFace: font, valign: "middle",
  });

  // 본문 아이템
  let curY = D.slide.bodyTopY;
  const bottomY = D.slide.bodyBottomY;

  for (const item of section.items) {
    const estH = itemH(item, bodyW);
    if (curY + estH > bottomY + 0.1 && verbose) {
      console.warn(`  ⚠️  섹션 "${section.title}": 콘텐츠 높이 초과 (type=${item.type})`);
    }
    const used = renderItem(slide, item, mx, curY, bodyW, pal);
    curY += used + D.card.gap;
  }
}

function renderDoneSlide(prs, fm, pal) {
  if (!fm.done?.title) return;
  const slide = prs.addSlide();
  const dd = D.done;
  const p  = D.palette;
  const sw = D.slide.widthIn;
  const font = D.slide.font;

  slide.background = { color: pal.brandDeep || pal.brandDark };

  slide.addText(fm.done.title, {
    x: 1, y: dd.titleY, w: sw - 2, h: dd.titleH,
    fontSize: dd.titleFontSize, bold: true, color: p.white, fontFace: font, align: "center",
  });
  if (fm.done.subtitle) {
    slide.addText(fm.done.subtitle, {
      x: 1.5, y: dd.subtitleY, w: sw - 3, h: dd.subtitleH,
      fontSize: dd.subtitleFontSize, color: p.doneSubtitle, fontFace: font, align: "center", wrap: true,
    });
  }
  if (fm.done.ctaLabel) {
    slide.addText(fm.done.ctaLabel + " →", {
      x: (sw - dd.ctaW) / 2, y: dd.ctaY, w: dd.ctaW, h: 0.5,
      fontSize: dd.ctaFontSize, bold: true, color: pal.brand, fontFace: font, align: "center",
    });
  }
}

// ════════════════════════════════════════════════════════════════
//  메인 변환 함수
// ════════════════════════════════════════════════════════════════

export async function convertMdToPptx(mdPath, opts = {}) {
  const { out, styleOverride, noCover, verbose } = opts;

  const { fm, sections, styleKey, style } = buildSlideData(mdPath, styleOverride);
  const pal = makePalette(style);

  if (verbose) {
    console.log(`  📄 ${basename(mdPath)}  style: ${styleKey}`);
    sections.forEach(s =>
      console.log(`     [${s.num}] "${s.title}"  items: ${s.items.map(i => i.type).join(", ")}`)
    );
  }

  const prs = new pptxgen();
  prs.layout = D.slide.layout;

  if (!noCover) renderCover(prs, fm, pal);
  for (const section of sections) renderSectionSlide(prs, section, pal, verbose);
  renderDoneSlide(prs, fm, pal);

  const name = basename(mdPath, extname(mdPath));
  const suffix = D.output.suffix || "";
  const outPath = out || join(D.output.dir, `${name}${suffix}.pptx`);

  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  await prs.writeFile({ fileName: outPath });

  console.log(`✅ ${basename(mdPath)} → ${outPath}  (섹션 ${sections.length}개)`);
  return outPath;
}

// ════════════════════════════════════════════════════════════════
//  CLI 진입점
// ════════════════════════════════════════════════════════════════

const args = parseCLI(process.argv.slice(2));

if (!args.positional.length) {
  console.error([
    "사용법:",
    "  node scripts/md-to-pptx.mjs <input.md> [--out path.pptx] [--style key] [--no-cover] [--verbose]",
    "  node scripts/md-to-pptx.mjs --all \"mddata/*.md\"",
    "",
    `스타일 키: ${Object.keys(STYLES).filter(k => !k.startsWith("$")).join(" | ")}`,
  ].join("\n"));
  process.exit(1);
}

const convOpts = {
  out: args.out || null,
  styleOverride: args.style || null,
  noCover: !!args.noCover,
  verbose: !!args.verbose,
};

if (args.all) {
  for (const pattern of args.positional) {
    const files = [];
    for await (const f of glob(pattern)) files.push(f);
    if (!files.length) { console.warn(`매칭 파일 없음: ${pattern}`); continue; }
    for (const f of files) await convertMdToPptx(resolve(f), { ...convOpts, out: null });
  }
} else {
  for (const mdPath of args.positional) {
    await convertMdToPptx(resolve(mdPath), convOpts);
  }
}
