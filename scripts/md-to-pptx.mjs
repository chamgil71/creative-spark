#!/usr/bin/env node
/**
 * md-to-pptx_v2.mjs
 * Universal Schema(6대 표준 키: icon, title, desc, tag, meta, color) 기반 MD→PPTX 변환 CLI
 *
 * 사용법:
 *   node scripts/md-to-pptx_v2.mjs mddata/Supabase.md
 *   node scripts/md-to-pptx_v2.mjs mddata/Supabase.md --out dist/Supabase.pptx
 *   node scripts/md-to-pptx_v2.mjs --all "mddata/*.md"
 *   node scripts/md-to-pptx_v2.mjs mddata/Supabase.md --style ai-dev --verbose
 *
 * 옵션:
 *   --out <path>     출력 .pptx 경로 (기본: dist-pptx/<이름>.pptx)
 *   --style <key>    styles.json 색상 프리셋 강제 지정
 *   --no-cover       표지 슬라이드 생성 안 함
 *   --verbose        상세 로그 출력
 *   --all            위치 인수를 glob 패턴으로 처리
 */

import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import pptxgen from "pptxgenjs";
import { glob } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ════════════════════════════════════════════════════════════════
//  1. Universal Schema — 6대 표준 키값
// ════════════════════════════════════════════════════════════════

function splitMeta(meta) {
  if (!meta) return [];
  return String(meta)
    .split(/[|\n]/)
    .map(s => s.trim().replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

function standardizeItem(item) {
  const rawName = item.name || item.title || "";
  const iconMatch = rawName.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*(.*)$/);

  const icon =     item.icon || (iconMatch ? iconMatch[1] : "") || "";
  const title =    item.title || (iconMatch ? iconMatch[2] : item.name) || item.col || "";
  const desc =     item.desc || item.description || item.tagline || item.body || "";
  const tag =      item.tag || item.badge || "";
  const color =    item.color || "";
  const featured = String(item.featured || "").trim().toLowerCase() === "true" ? "true" : "";

  // meta와 note를 뭉개지 않고 각각의 고유값을 완벽하게 보존합니다.
  const meta = item.meta || item.features || item.items || item.points || item.tool || "";
  const note = item.note || "";

  return {
    icon,
    title,
    desc,
    tag,
    meta,
    note,
    color,
    featured
  };
}

function parseShortcodeItems(src) {
  const items = [];
  let current = null;
  let currentKey = null;
  let inLiteralBlock = false;

  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;  // 빈 줄 무시

    // 멀티라인 리터럴 블록 내부 파싱 보장 (공백 4칸 들여쓰기 유지 시)
    if (inLiteralBlock && line.startsWith("    ")) {
      const val = line.slice(4);
      const sep = currentKey === 'meta' ? ' | ' : '\n';
      const existing = current[currentKey];
      current[currentKey] = (!existing || existing === '|') ? val : existing + sep + val;
      continue;
    } else {
      inLiteralBlock = false;
    }

    // 1. 새 아이템 시작: - key: value
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

    // 2. 기존 아이템 내 새 키 (들여쓰기 + key: value)
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

    // 3. 들여쓰기된 하이픈 리스트 항목 (들여쓰기 + - value)
    //    meta → | 구분, desc/note → \n 구분
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && current && currentKey) {
      const val = listMatch[1].trim();
      const existing = current[currentKey];
      const sep = currentKey === 'meta' ? ' | ' : '\n';
      current[currentKey] = (!existing || existing === '|') ? val : existing + sep + val;
      continue;
    }

    // 4. 들여쓰기된 연속 텍스트 (desc/note 멀티라인, YAML | 블록 스칼라 지원)
    //    반드시 인덴트가 있어야 캡처됨 → 새 아이템 오인 방지
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

function cleanValue(v) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

// ════════════════════════════════════════════════════════════════
//  2. 설정 로드
// ════════════════════════════════════════════════════════════════

function loadJsonWithComments(filePath) {
  const src = readFileSync(filePath, "utf8")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(src);
}

const CONFIG_DIR = resolve(__dirname, "../config");
const STYLES = loadJsonWithComments(resolve(CONFIG_DIR, "styles.json"));
const D      = loadJsonWithComments(resolve(CONFIG_DIR, "pptdesign.config.json"));

// ════════════════════════════════════════════════════════════════
//  3. CLI 파서
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
//  4. 유틸
// ════════════════════════════════════════════════════════════════

function hexClean(hex) {
  if (!hex) return null;
  hex = (hex + "").replace(/^["']|["']$/g, "").replace(/^#/, "");
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

function estimateLines(text, widthInch, fontSize) {
  const charsPerLine = Math.max(8, Math.floor(widthInch * 68 / (fontSize * 0.55)));
  return Math.max(1, Math.ceil((text || "").length / charsPerLine));
}

// ════════════════════════════════════════════════════════════════
//  5. MD 파서
// ════════════════════════════════════════════════════════════════

function parseContentParts(content) {
  const parts = [];
  const re = /^:::\s*([A-Za-z0-9_-]+)(?:[ \t]+([^\r\n]+))?[ \t]*\r?\n([\s\S]*?)(?:\r?\n|^):::[ \t]*$/gm;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "md", src: content.slice(lastIndex, match.index) });
    }
    parts.push({ kind: "shortcode", scType: match[1], args: match[2] || "", items: parseShortcodeItems(match[3]) });
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
      if (!currentSection) { sectionNum++; currentSection = { num: sectionNum, title: "", items: [] }; }
      closeCard();
      currentSection.items.push({ type: part.scType, args: part.args || "", items: part.items });
      continue;
    }
    const tokens = marked.lexer(part.src);
    for (const tok of tokens) {
      if (tok.type === "heading" && tok.depth === 1) {
        closeSection();
        sectionNum++;
        const raw2 = stripMd(extractText(tok));
        const m = raw2.match(/^\s*(\d+)\.\s*(.+)$/);
        currentSection = { num: m ? parseInt(m[1]) : sectionNum, title: m ? m[2] : raw2, items: [] };
      } else if (tok.type === "heading" && tok.depth === 2) {
        closeCard();
        if (!currentSection) { sectionNum++; currentSection = { num: sectionNum, title: "", items: [] }; }
        currentCard = { type: "card", title: stripMd(extractText(tok)), blocks: [] };
      } else if (tok.type === "hr") {
        closeSection();
      } else if (tok.type === "space") {
        // ignore
      } else {
        if (!currentSection) { sectionNum++; currentSection = { num: sectionNum, title: "", items: [] }; }
        if (!currentCard) currentCard = { type: "card", title: "", blocks: [] };
        const block = tokenToBlock(tok);
        if (block) currentCard.blocks.push(block);
      }
    }
  }
  closeSection();
  return { fm, sections, styleKey, style };
}

// ════════════════════════════════════════════════════════════════
//  6. 높이 추정
// ════════════════════════════════════════════════════════════════

function blockH(block, w) {
  const c = D.card;
  switch (block.type) {
    case "h3": return (c.h3Size / 72) * 1.7 + c.gap;
    case "h4": return ((c.h3Size - 1) / 72) * 1.7 + c.gap;
    case "p": return (c.bodySize / 72) * 1.7 * estimateLines(block.text, w - c.padX * 2, c.bodySize) + c.gap;
    case "ul":
    case "ol": return (c.bodySize / 72) * 1.7 * block.items.length + c.gap;
    case "blockquote": return Math.max(0.4, (c.bodySize / 72) * 1.7 * estimateLines(block.text, w - c.padX * 2 - c.quoteBarW - 0.1, c.bodySize) + 0.15) + c.gap;
    case "code": return (c.codeSize / 72) * 1.7 * (block.text || "").split("\n").length + 0.2 + c.gap;
    case "table": return 0.35 + 0.28 * (block.rows || []).length + c.gap;
    default: return 0;
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
  if (item.type === "card")         return cardH(item, w);
  if (item.type === "icon-grid")    return Math.ceil(item.items.length / Math.max(1, Math.floor(w / g.iconCardMinW))) * (1.4 + g.gap);
  if (item.type === "feature-grid") return Math.ceil(item.items.length / Math.max(1, Math.floor(w / g.featureCardMinW))) * (1.5 + g.gap);
  
  // 신형 표준 숏코드 및 3대 특화 숏코드 높이 매핑
  if (item.type === "step-list" || item.type === "steps") {
    return item.items.length * (g.stepItemH + c.gap);
  }
  if (item.type === "compare-grid" || item.type === "network-box") {
    return Math.ceil(item.items.length / Math.max(1, Math.floor(w / 2.4))) * (1.4 + g.gap);
  }
  if (item.type === "columns-grid" || item.type === "columns") {
    return Math.ceil(item.items.length / Math.max(1, Math.floor(w / 2.4))) * (1.4 + g.gap);
  }
  if (item.type === "workflow-strip" || item.type === "workflow" || item.type === "git-flow-strip") {
    return D.workflow.stepH + c.gap;
  }
  if (item.type === "tool-box" || item.type === "tool-card") {
    return item.items.reduce((sum, it) => {
      const metaLines = splitMeta(it.meta).length;
      const h = D.toolCard.h + (metaLines > 0 ? 0.3 + metaLines * 0.24 : 0);
      return sum + h + c.gap;
    }, 0);
  }
  if (item.type === "plan-grid") {
    const maxFeat = Math.max(0, ...item.items.map(it => splitMeta(it.meta).length));
    return c.padY + 0.26 + 0.32 + maxFeat * D.planGrid.featureLineH + 0.28 + c.padY + c.gap;
  }
  if (item.type === "bottom-list")  return 1.2 + c.gap + D.bottomList.chipH + c.gap;
  if (item.type === "compare-split" || item.type === "compare-2col") {
    if (item.items.length < 2) return 1.5 + c.gap;
    const cc = D.compare2col;
    const colW = (w - cc.colGap) / 2;
    const lh = (c.bodySize / 72) * 1.7;
    const maxH = Math.max(1.2, ...item.items.slice(0, 2).map(it => {
      // desc: \n 구분 각 세그먼트의 줄바꿈 포함 높이 합산
      const descSegs = (it.desc || "").split("\n").filter(Boolean);
      const descH = descSegs.reduce((sum, seg) =>
        sum + lh * Math.max(1, estimateLines(seg, colW - c.padX * 2, c.bodySize)) + 0.05, 0);
      // meta: | 구분 불릿 수
      const metaLines = splitMeta(it.meta).length;
      return c.padY
        + (c.titleSize / 72) * 1.7 + c.gap
        + (descSegs.length > 0 ? descH + c.gap : 0)
        + metaLines * (lh + 0.05)
        + (it.note ? 0.28 + 0.12 : 0)
        + c.padY;
    }));
    return maxH + c.gap;
  }
  if (item.type === "alert-box") {
    return item.items.reduce((sum, it) => {
      const lines = estimateLines(it.desc || "", w - c.padX * 2 - 0.12, c.bodySize);
      return sum + c.padY * 2 + (it.title ? (c.titleSize / 72) * 1.7 + c.gap * 0.5 : 0) + (c.bodySize / 72) * 1.7 * lines + c.gap;
    }, 0);
  }
  if (item.type === "faq-accordion") {
    return item.items.reduce((sum, it) => {
      const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize);
      return sum + (c.titleSize / 72) * 1.7 + 0.1 + (c.bodySize / 72) * 1.7 * lines + c.gap * 0.5 + c.gap;
    }, 0);
  }
  if (item.type === "prompt-example") {
    return item.items.reduce((sum, it) => {
      const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize - 1);
      return sum + c.padY + (c.titleSize / 72) * 1.7 + c.gap * 0.5 + (c.bodySize - 1) / 72 * 1.7 * lines + c.padY + c.gap;
    }, 0);
  }
  if (item.type === "command-block") {
    return item.items.reduce((sum, it) => {
      const codeLines = (it.desc || "").split("\n");
      const h = Math.max(0.4, (c.codeSize / 72) * 1.7 * codeLines.length + 0.2) + 0.38;
      return sum + h + c.gap;
    }, 0);
  }
  if (item.type === "tabs") {
    return item.items.reduce((sum, it) => {
      const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize);
      return sum + 0.4 + (c.bodySize / 72) * 1.7 * lines + c.gap;
    }, 0);
  }
  if (item.type === "stat-highlight") {
    const cols = Math.max(1, Math.min(item.items.length, 4));
    return Math.ceil(item.items.length / cols) * (1.2 + g.gap);
  }
  // Phase 4 신규 구현
  if (item.type === "flow") {
    return D.workflow.stepH + 0.3 + c.gap;
  }
  if (item.type === "takeaway") {
    return item.items.reduce((sum, it) => {
      const lines = estimateLines(it.desc || "", w - c.padX * 2 - 0.5, c.bodySize + 1);
      return sum + c.padY * 2 + (it.title ? (c.titleSize / 72) * 1.7 + c.gap * 0.5 : 0) + (c.bodySize + 1) / 72 * 1.7 * Math.max(1, lines) + c.gap;
    }, 0);
  }
  if (item.type === "compare-before-after") {
    if (item.items.length < 2) return 1.5 + c.gap;
    const cc = D.compare2col; const colW = (w - cc.colGap) / 2; const lh = (c.bodySize / 72) * 1.7;
    const maxH = Math.max(1.2, ...item.items.slice(0, 2).map(it => {
      const descSegs = (it.desc || "").split("\n").filter(Boolean);
      const descH = descSegs.reduce((s, seg) => s + lh * Math.max(1, estimateLines(seg, colW - c.padX * 2, c.bodySize)) + 0.05, 0);
      return c.padY + (c.titleSize / 72) * 1.7 + c.gap + (descSegs.length ? descH + c.gap : 0) + c.padY;
    }));
    return maxH + c.gap;
  }
  return 0;
}

// ════════════════════════════════════════════════════════════════
//  7. 팔레트
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
    muted:      p.muted      || "8892B0",
    mutedLight: p.mutedLight || "CCDDDD",
    codeBg:     p.codeBg,
    codeText:   p.codeText   || "A8B2D8",
  };
}

// ════════════════════════════════════════════════════════════════
//  8. 블록 렌더러
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
    const fs = c.h3Size - 1;
    const h = (fs / 72) * 1.7;
    slide.addText(block.text, { x, y, w, h: h + 0.05, fontSize: fs, bold: true, color: pal.text2, fontFace: font, valign: "top" });
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
    const lines = estimateLines(block.text, w - c.quoteBarW - 0.12, c.bodySize);
    const h = Math.max(0.38, (c.bodySize / 72) * 1.7 * lines + 0.15);
    slide.addShape("rect", { x, y, w: c.quoteBarW, h, fill: { color: pal.brand }, line: { color: pal.brand } });
    slide.addShape("rect", { x: x + c.quoteBarW, y, w: w - c.quoteBarW, h, fill: { color: pal.brandLight }, line: { color: pal.brandLight } });
    slide.addText(block.text, {
      x: x + c.quoteBarW + 0.1, y: y + 0.06, w: w - c.quoteBarW - 0.14, h: h - 0.1,
      fontSize: c.bodySize, color: pal.brandDeep || pal.brandDark, fontFace: font, italic: true, valign: "middle", wrap: true,
    });
    return h + c.gap;
  }
  if (block.type === "code") {
    const codeLines = (block.text || "").split("\n");
    const h = Math.max(0.4, (c.codeSize / 72) * 1.7 * codeLines.length + 0.2);
    slide.addShape("rect", { x, y, w, h, fill: { color: pal.codeBg || "0F172A" }, line: { color: pal.border, width: 0.75 } });
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
      block.headers.map(h2 => ({ text: h2, options: { bold: true, fontSize: c.bodySize, color: pal.white, fill: { color: pal.brand } } })),
      ...(block.rows || []).map(row => row.map(cell => ({ text: cell, options: { fontSize: c.bodySize - 1, color: pal.text2 } }))),
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
//  9. 숏코드 렌더러 (Universal Schema 키 사용)
// ════════════════════════════════════════════════════════════════

function renderCard(slide, card, x, y, w, pal) {
  const c = D.card;
  const font = D.slide.font;
  const r = D.slide.globalRadius;
  const h = cardH(card, w);
  slide.addShape("roundRect", { x, y, w, h, rectRadius: r, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
  let cy = y + c.padY;
  if (card.title) {
    const th = (c.titleSize / 72) * 1.7;
    slide.addText(card.title, { x: x + c.padX, y: cy, w: w - c.padX * 2, h: th + 0.05, fontSize: c.titleSize, bold: true, color: pal.brandDark, fontFace: font, valign: "top" });
    cy += th + 0.05 + c.gap * 0.5;
  }
  for (const block of (card.blocks || [])) cy += renderBlock(slide, block, x + c.padX, cy, w - c.padX * 2, pal);
  return h;
}

function renderIconGrid(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / g.iconCardMinW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.4;
  item.items.forEach((it, idx) => {
    const col = idx % cols; const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap); const cy = y + row * (cardH2 + g.gap);
    const ac = it.color ? hexClean(it.color) : null;
    slide.addShape("roundRect", { x: cx, y: cy, w: cardW, h: cardH2, rectRadius: r, fill: ac ? { color: ac, transparency: 95 } : { color: pal.white }, line: { color: ac || pal.border, width: 0.75 } });
    if (ac) slide.addShape("rect", { x: cx, y: cy, w: cardW, h: 0.04, fill: { color: ac } });
    if (it.icon && it.icon !== "•") slide.addText(it.icon, { x: cx + 0.1, y: cy + 0.1, w: cardW - 0.2, h: 0.42, fontSize: 20, align: "center", valign: "middle" });
    slide.addText(it.title, { x: cx + 0.1, y: cy + 0.58, w: cardW - 0.2, h: 0.28, fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, align: "center" });
    if (it.desc) slide.addText(it.desc, { x: cx + 0.1, y: cy + 0.88, w: cardW - 0.2, h: cardH2 - 0.94, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, align: "center", wrap: true, valign: "top" });
  });
  return Math.ceil(item.items.length / cols) * (cardH2 + g.gap);
}

function renderFeatureGrid(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / g.featureCardMinW)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.5;
  item.items.forEach((it, idx) => {
    const col = idx % cols; const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap); const cy = y + row * (cardH2 + g.gap);
    const ac = it.color ? hexClean(it.color) : pal.brand;
    slide.addShape("roundRect", { x: cx, y: cy, w: cardW, h: cardH2, rectRadius: r, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
    slide.addShape("rect", { x: cx, y: cy, w: cardW, h: 0.04, fill: { color: ac }, line: { color: ac } });
    let ty = cy + 0.12;
    if (it.tag) { slide.addText(it.tag, { x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.22, fontSize: 8, bold: true, color: pal.brandDark, fontFace: font }); ty += 0.24; }
    const titleText = (it.icon && it.icon !== "•" ? it.icon + " " : "") + it.title;
    slide.addText(titleText, { x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.3, fontSize: c.titleSize, bold: true, color: pal.text, fontFace: font });
    ty += 0.34;
    if (it.desc) slide.addText(it.desc, { x: cx + 0.12, y: ty, w: cardW - 0.24, h: cardH2 - (ty - cy) - 0.08, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top" });
  });
  return Math.ceil(item.items.length / cols) * (cardH2 + g.gap);
}

function renderSteps(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const stepH = g.stepItemH;
  item.items.forEach((it, idx) => {
    const ac = hexClean(it.color) || pal.brand;
    const cy = y + idx * (stepH + c.gap);
    slide.addShape("roundRect", { x, y: cy, w: stepH, h: stepH, rectRadius: r, fill: it.color ? { color: ac, transparency: 90 } : { color: pal.white }, line: { color: it.color ? ac : pal.border, width: 0.75 } });
    const numSz = 0.42; const ny = cy + (stepH - numSz) / 2;
    slide.addShape("roundRect", { x: x + 0.1, y: ny, w: numSz, h: numSz, rectRadius: 0.1, fill: { color: ac }, line: { color: ac } });
    slide.addText(String(idx + 1), { x: x + 0.1, y: ny, w: numSz, h: numSz, fontSize: 13, bold: true, color: pal.white, fontFace: font, align: "center", valign: "middle" });
    const tx = x + 0.1 + numSz + 0.12; const tw = w - 0.1 - numSz - 0.22;
    slide.addText(it.title, { x: tx, y: cy + 0.07, w: tw, h: 0.26, fontSize: c.bodySize, bold: true, color: it.color ? ac : pal.text, fontFace: font, valign: "top" });
    if (it.desc) slide.addText(it.desc, { x: tx, y: cy + 0.34, w: tw, h: stepH - 0.4, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top" });
  });
  return item.items.length * (stepH + c.gap);
}

function renderCompareGrid(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const cols = Math.max(1, Math.min(item.items.length, Math.floor(w / 2.4)));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.4;
  item.items.forEach((it, idx) => {
    const col = idx % cols; const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap); const cy = y + row * (cardH2 + g.gap);
    const ac = hexClean(it.color) || pal.brand;
    slide.addShape("roundRect", { x: cx, y: cy, w: cardW, h: cardH2, rectRadius: r, fill: it.color ? { color: ac, transparency: 95 } : { color: pal.white }, line: { color: it.color ? ac : pal.border, width: 0.75 } });
    slide.addShape("rect", { x: cx, y: cy, w: cardW, h: 0.04, fill: { color: ac }, line: { color: ac } });
    slide.addText(it.title, { x: cx + 0.12, y: cy + 0.1, w: cardW - 0.24, h: 0.3, fontSize: c.titleSize, bold: true, color: it.color ? ac : pal.brandDark, fontFace: font });
    if (it.desc) slide.addText(it.desc, { x: cx + 0.12, y: cy + 0.42, w: cardW - 0.24, h: 0.6, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, wrap: true, valign: "top" });
    const activeNote = it.note || it.meta;
    if (activeNote) {
      slide.addShape("roundRect", { x: cx + 0.12, y: cy + 1.05, w: cardW - 0.24, h: 0.28, rectRadius: 0.06, fill: it.color ? { color: ac, transparency: 85 } : { color: pal.brandLight }, line: { color: ac } });
      slide.addText(activeNote, { x: cx + 0.12, y: cy + 1.05, w: cardW - 0.24, h: 0.28, fontSize: 8, bold: true, color: ac, fontFace: font, align: "center", valign: "middle" });
    }
  });
  return Math.ceil(item.items.length / cols) * (cardH2 + g.gap);
}

function renderWorkflow(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const n = item.items.length; if (!n) return 0;
  const stepH = D.workflow.stepH; const arrowW = D.workflow.arrowW;
  const stepW = (w - (n - 1) * arrowW) / n;
  item.items.forEach((it, idx) => {
    const cx = x + idx * (stepW + arrowW);
    const stepBg = it.color ? { color: hexClean(it.color), transparency: 90 } : { color: pal.brandLight };
    slide.addShape("roundRect", { x: cx, y, w: stepW, h: stepH, rectRadius: r, fill: stepBg, line: { color: it.color ? hexClean(it.color) : pal.border, width: 0.75 } });
    if (it.icon && it.icon !== "•") slide.addText(it.icon, { x: cx, y: y + 0.08, w: stepW, h: 0.3, fontSize: 16, align: "center", valign: "middle" });
    slide.addText(it.title, { x: cx + 0.06, y: y + 0.42, w: stepW - 0.12, h: 0.26, fontSize: c.bodySize, bold: true, color: pal.text, fontFace: font, align: "center" });
    if (it.meta) slide.addText(it.meta, { x: cx + 0.06, y: y + 0.68, w: stepW - 0.12, h: 0.18, fontSize: c.bodySize - 2, color: pal.text2, fontFace: font, align: "center" });
    if (idx < n - 1) slide.addText("→", { x: cx + stepW, y: y + (stepH - 0.22) / 2, w: arrowW, h: 0.22, fontSize: 14, color: D.palette.workflowArrow, align: "center", valign: "middle" });
  });
  return stepH + c.gap;
}

function renderToolCard(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const tcH = D.toolCard.h || 0.85;
  let cy = y;
  for (const it of item.items) {
    const bgColor = hexClean(it.color) || pal.brand;
    const metaList = (it.meta || "").split("|").filter(Boolean).map(f => f.trim());
    const hasMeta = metaList.length > 0;
    const cardH = tcH + (hasMeta ? 0.3 + metaList.length * 0.24 : 0);
    
    // Draw outer round rect wrapper
    slide.addShape("roundRect", { x, y: cy, w, h: cardH, rectRadius: r / 2, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
    
    // Draw top banner header
    slide.addShape("roundRect", { x, y: cy, w, h: tcH, rectRadius: r / 2, fill: { color: bgColor }, line: { color: bgColor } });
    // Cover the bottom rounding of top banner with a flat rect to make it merge cleanly if there is a meta list
    if (hasMeta) {
      slide.addShape("rect", { x, y: cy + tcH - 0.1, w, h: 0.1, fill: { color: bgColor }, line: { color: bgColor } });
    }
    
    let cx = x + 0.16;
    if (it.icon && it.icon !== "•") { slide.addText(it.icon, { x: cx, y: cy, w: 0.52, h: tcH, fontSize: 20, align: "center", valign: "middle" }); cx += 0.58; }
    const badgeW = it.tag ? 1.1 : 0; const tw = w - (cx - x) - badgeW - 0.14;
    slide.addText(it.title, { x: cx, y: cy + 0.1, w: tw, h: 0.28, fontSize: c.titleSize, bold: true, color: D.palette.white, fontFace: font });
    if (it.desc) slide.addText(it.desc, { x: cx, y: cy + 0.4, w: tw, h: 0.22, fontSize: c.bodySize - 2, color: pal.mutedLight, fontFace: font });
    if (it.tag) slide.addText(it.tag, { x: x + w - badgeW - 0.08, y: cy + (tcH - 0.22) / 2, w: badgeW, h: 0.22, fontSize: 9, bold: true, color: D.palette.white, fontFace: font, align: "right" });
    
    if (hasMeta) {
      let my = cy + tcH + 0.12;
      metaList.forEach(m => {
        slide.addText("• " + m, { x: x + 0.3, y: my, w: w - 0.6, h: 0.22, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font });
        my += 0.24;
      });
    }
    
    cy += cardH + c.gap;
  }
  return cy - y;
}

function renderPlanGrid(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const pg = D.planGrid; const font = D.slide.font; const r = D.slide.globalRadius;
  const cols = Math.max(1, Math.min(item.items.length, pg.maxCols));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const maxFeat = Math.max(0, ...item.items.map(it => splitMeta(it.meta).length));
  const cardH2 = c.padY + 0.26 + 0.32 + maxFeat * pg.featureLineH + 0.28 + c.padY;
  item.items.forEach((it, idx) => {
    if (idx >= cols) return;
    const cx = x + idx * (cardW + g.gap); const isFeatured = it.featured === "true";
    const ac = hexClean(it.color) || (isFeatured ? pal.brand : pal.brand);
    const usedColor = hexClean(it.color);
    const cardFill = usedColor ? { color: usedColor, transparency: 95 } : { color: isFeatured ? pal.brandLight : D.palette.white };
    const cardLine = usedColor || (isFeatured ? pal.brand : pal.border);
    slide.addShape("roundRect", { x: cx, y, w: cardW, h: cardH2, rectRadius: r, fill: cardFill, line: { color: cardLine, width: (usedColor || isFeatured) ? 1.5 : 0.75 } });
    slide.addShape("rect", { x: cx, y, w: cardW, h: 0.05, fill: { color: ac }, line: { color: ac } });
    let ty = y + c.padY;
    if (it.tag) {
      const bw = Math.min(cardW - 0.24, 1.2);
      slide.addShape("roundRect", { x: cx + 0.12, y: ty, w: bw, h: 0.22, rectRadius: 0.08, fill: { color: (usedColor || isFeatured) ? ac : pal.brandLight }, line: { color: ac } });
      slide.addText(it.tag, { x: cx + 0.12, y: ty, w: bw, h: 0.22, fontSize: 8, bold: true, color: (usedColor || isFeatured) ? D.palette.white : pal.brandDark, fontFace: font, align: "center", valign: "middle" });
      ty += 0.26;
    }
    slide.addText(it.title, { x: cx + 0.12, y: ty, w: cardW - 0.24, h: 0.28, fontSize: c.titleSize, bold: true, color: pal.text, fontFace: font, valign: "top" });
    ty += 0.32;
    for (const feat of splitMeta(it.meta)) {
      slide.addText("• " + feat, { x: cx + 0.12, y: ty, w: cardW - 0.24, h: pg.featureLineH, fontSize: c.bodySize - 1, color: pal.text2, fontFace: font, valign: "top" });
      ty += pg.featureLineH;
    }
    if (it.note) {
      const noteY = y + cardH2 - c.padY - 0.24;
      slide.addShape("roundRect", { x: cx + 0.12, y: noteY, w: cardW - 0.24, h: 0.22, rectRadius: 0.06, fill: { color: (usedColor || isFeatured) ? ac : pal.brandLight }, line: { color: ac } });
      slide.addText(it.note, { x: cx + 0.12, y: noteY, w: cardW - 0.24, h: 0.22, fontSize: 8, bold: true, color: (usedColor || isFeatured) ? D.palette.white : pal.brandDark, fontFace: font, align: "center", valign: "middle" });
    }
  });
  return cardH2 + c.gap;
}

function renderBottomList(slide, item, x, y, w, pal) {
  const c = D.card; const bl = D.bottomList; const font = D.slide.font; const r = D.slide.globalRadius;
  if (!item.items.length) return 0;
  const it = item.items[0];
  const ac = hexClean(it.color) || pal.brand;
  const points = splitMeta(it.meta);
  const bodyLines = it.desc ? estimateLines(it.desc, w - c.padX * 2, c.bodySize) : 0;
  const topH = Math.max(0.8, c.padY * 2 + (it.title ? (c.titleSize / 72) * 1.7 + c.gap : 0) + (bodyLines > 0 ? (c.bodySize / 72) * 1.7 * bodyLines + c.gap : 0));
  slide.addShape("roundRect", { x, y, w: topH, rectRadius: r, fill: it.color ? { color: ac, transparency: 95 } : { color: pal.white }, line: { color: it.color ? ac : pal.border, width: 0.75 } });
  let ty = y + c.padY;
  if (it.title) {
    const th = (c.titleSize / 72) * 1.7;
    slide.addText(it.title, { x: x + c.padX, y: ty, w: w - c.padX * 2, h: th + 0.05, fontSize: c.titleSize, bold: true, color: it.color ? ac : pal.brandDark, fontFace: font, valign: "top" });
    ty += th + c.gap;
  }
  if (it.desc) slide.addText(it.desc, { x: x + c.padX, y: ty, w: w - c.padX * 2, h: Math.max(0.2, (c.bodySize / 72) * 1.7 * bodyLines), fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true });
  if (points.length) {
    const chipBY = y + topH + c.gap; const chipW = (w - (points.length - 1) * bl.chipGap) / points.length;
    points.forEach((pt, i) => {
      const cx = x + i * (chipW + bl.chipGap);
      slide.addShape("roundRect", { x: cx, y: chipBY, w: chipW, h: bl.chipH, rectRadius: bl.chipRadius, fill: it.color ? { color: ac, transparency: 88 } : { color: pal.brandLight }, line: { color: ac, width: 0.75 } });
      slide.addText(pt, { x: cx + 0.08, y: chipBY, w: chipW - 0.16, h: bl.chipH, fontSize: bl.fontSize, bold: true, color: ac, fontFace: font, align: "center", valign: "middle" });
    });
    return topH + c.gap + bl.chipH + c.gap;
  }
  return topH + c.gap;
}

function renderCompare2Col(slide, item, x, y, w, pal) {
  const c = D.card; const cc = D.compare2col; const font = D.slide.font; const r = D.slide.globalRadius;
  if (item.items.length < 2) return renderCompareGrid(slide, item, x, y, w, pal);
  const colW = (w - cc.colGap) / 2;
  const lh = (c.bodySize / 72) * 1.7;
  const noteH = 0.28;
  // itemH()와 동일한 로직으로 maxH 계산 (c.gap 제거)
  const maxH = itemH(item, w) - c.gap;

  item.items.slice(0, 2).forEach((it, idx) => {
    const cx = x + idx * (colW + cc.colGap); const isLeft = idx === 0;
    const ac = hexClean(it.color) || (isLeft ? pal.brand : pal.text2);
    const cardFill = it.color ? { color: hexClean(it.color), transparency: 95 } : { color: isLeft ? pal.brandLight : D.palette.white };

    slide.addShape("roundRect", { x: cx, y, w: colW, h: maxH, rectRadius: r, fill: cardFill, line: { color: ac, width: (it.color || isLeft) ? 1.5 : 0.75 } });
    slide.addShape("rect", { x: cx, y, w: colW, h: 0.05, fill: { color: ac }, line: { color: ac } });

    let ty = y + c.padY;

    // 타이틀
    slide.addText(it.title, { x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: (c.titleSize / 72) * 1.7 + 0.05, fontSize: c.titleSize + 1, bold: true, color: it.color ? ac : (isLeft ? (pal.brandDeep || pal.brandDark) : pal.text), fontFace: font, valign: "top" });
    ty += (c.titleSize / 72) * 1.7 + c.gap;

    // desc: \n 구분 단락 텍스트 — 세그먼트별 wrap 높이 계산 후 순차 렌더링
    if (it.desc) {
      const descSegs = it.desc.split("\n").filter(Boolean);
      for (const seg of descSegs) {
        const segLines = Math.max(1, estimateLines(seg, colW - c.padX * 2, c.bodySize));
        const segH = lh * segLines + 0.05;
        slide.addText(seg, { x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: segH, fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true });
        ty += segH;
      }
      ty += c.gap;  // desc 블록 아래 여백
    }

    // meta: | 구분 불릿 (ty 누적으로 겹침 방지)
    for (const bullet of splitMeta(it.meta)) {
      slide.addText("• " + bullet, { x: cx + c.padX, y: ty, w: colW - c.padX * 2, h: lh + 0.05, fontSize: c.bodySize, color: it.color ? ac : (isLeft ? (pal.brandDeep || pal.brandDark) : pal.text2), fontFace: font });
      ty += lh + 0.05;
    }

    // note: 카드 하단 고정 배지 (다중 줄이면 · 로 연결)
    if (it.note) {
      const noteText = it.note.split("\n").filter(Boolean).join(" · ");
      const noteY = y + maxH - c.padY - noteH;
      slide.addShape("roundRect", { x: cx + c.padX, y: noteY, w: colW - c.padX * 2, h: noteH, rectRadius: 0.06, fill: { color: (it.color || isLeft) ? ac : pal.brandLight }, line: { color: ac } });
      slide.addText(noteText, { x: cx + c.padX, y: noteY, w: colW - c.padX * 2, h: noteH, fontSize: 8, bold: true, color: (it.color || isLeft) ? D.palette.white : pal.brandDark, fontFace: font, align: "center", valign: "middle" });
    }
  });

  return maxH + c.gap;
}

// ── Phase 4 신규 렌더러 ──────────────────────────────────────────

function renderFlow(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const steps = item.items.filter(it => it.title !== "→" && it.icon !== "→");
  const n = steps.length; if (!n) return 0;
  const arrowW = D.workflow.arrowW;
  const stepW  = (w - (n - 1) * arrowW) / n;
  const stepH  = D.workflow.stepH + 0.3;
  steps.forEach((it, idx) => {
    const cx = x + idx * (stepW + arrowW);
    const isActive = it.tag === "active";
    const bg = isActive
      ? { color: hexClean(pal.brand), transparency: 10 }
      : it.color ? { color: hexClean(it.color), transparency: 90 } : { color: pal.brandLight };
    const border = isActive ? pal.brand : it.color ? hexClean(it.color) : pal.border;
    slide.addShape("roundRect", { x: cx, y, w: stepW, h: stepH, rectRadius: r, fill: bg, line: { color: border, width: isActive ? 1.5 : 0.75 } });
    if (it.icon && it.icon !== "•") slide.addText(it.icon, { x: cx, y: y + 0.08, w: stepW, h: 0.3, fontSize: 16, align: "center" });
    slide.addText(it.title, { x: cx + 0.06, y: y + 0.42, w: stepW - 0.12, h: 0.26, fontSize: c.bodySize, bold: true, color: isActive ? pal.white : pal.text, fontFace: font, align: "center" });
    if (it.desc) slide.addText(it.desc, { x: cx + 0.06, y: y + 0.7, w: stepW - 0.12, h: 0.22, fontSize: c.bodySize - 2, color: isActive ? pal.mutedLight : pal.text2, fontFace: font, align: "center", wrap: true });
    if (idx < steps.length - 1) slide.addText("→", { x: cx + stepW, y: y + (stepH - 0.22) / 2, w: arrowW, h: 0.22, fontSize: 14, color: D.palette.workflowArrow, align: "center", valign: "middle" });
  });
  return stepH + c.gap;
}

function renderTakeaway(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  let cy = y;
  for (const it of item.items) {
    const lines  = estimateLines(it.desc || "", w - c.padX * 2 - 0.5, c.bodySize + 1);
    const titleH = it.title ? (c.titleSize / 72) * 1.7 + c.gap * 0.5 : 0;
    const descH  = (c.bodySize + 1) / 72 * 1.7 * Math.max(1, lines);
    const boxH   = c.padY * 2 + titleH + descH;
    slide.addShape("roundRect", { x, y: cy, w, h: boxH, rectRadius: r, fill: { color: hexClean(pal.brand), transparency: 12 }, line: { color: hexClean(pal.brand), width: 1.5 } });
    let tx = x + c.padX; let tw = w - c.padX * 2; let ty = cy + c.padY;
    if (it.icon) { slide.addText(it.icon, { x: tx, y: ty, w: 0.4, h: boxH - c.padY * 2, fontSize: 20, valign: "middle" }); tx += 0.48; tw -= 0.48; }
    if (it.title) { slide.addText(it.title, { x: tx, y: ty, w: tw, h: titleH, fontSize: c.titleSize + 1, bold: true, color: pal.brandDark || pal.brand, fontFace: font, valign: "top" }); ty += titleH; }
    if (it.desc)  slide.addText(it.desc, { x: tx, y: ty, w: tw, h: descH + 0.05, fontSize: c.bodySize + 1, color: pal.text, fontFace: font, valign: "top", wrap: true });
    cy += boxH + c.gap;
  }
  return cy - y;
}

function renderCompareBeforeAfter(slide, item, x, y, w, pal) {
  // Before(좌) = 붉은 계열, After(우) = 초록 계열 — 색이 없으면 기본값 주입
  const modItem = {
    ...item,
    items: item.items.slice(0, 2).map((it, idx) => ({
      ...it,
      color: it.color || (idx === 0 ? "#EF4444" : "#10B981"),
    })),
  };
  return renderCompare2Col(slide, modItem, x, y, w, pal);
}

const ALERT_COLORS = {
  tip:     { bg: "F0FDF4", bar: "22C55E", title: "15803D", text: "166534" },
  warn:    { bg: "FFFBEB", bar: "F59E0B", title: "B45309", text: "92400E" },
  success: { bg: "F0FDF4", bar: "10B981", title: "065F46", text: "064E3B" },
  danger:  { bg: "FFF1F2", bar: "EF4444", title: "B91C1C", text: "991B1B" },
};

function renderAlertBox(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  let cy = y;
  for (const it of item.items) {
    const t = String(item.args || it.type || "tip").trim().toLowerCase();
    const ac = ALERT_COLORS[t] || ALERT_COLORS.tip;
    
    // Adjust width for icon if present
    const hasIcon = !!it.icon;
    const barW = 0.08;
    let tx = x + barW + 0.1;
    let tw = w - barW - 0.14;
    
    const lines = estimateLines(it.desc || "", hasIcon ? tw - 0.38 : tw, c.bodySize);
    const titleH = it.title ? (c.titleSize / 72) * 1.7 + c.gap * 0.5 : 0;
    const descH  = (c.bodySize / 72) * 1.7 * Math.max(1, lines);
    const boxH   = c.padY * 2 + titleH + descH;
    
    slide.addShape("roundRect", { x, y: cy, w, h: boxH, rectRadius: r, fill: { color: ac.bg }, line: { color: ac.bar, width: 1.5 } });
    slide.addShape("rect",      { x, y: cy, w: barW, h: boxH, fill: { color: ac.bar }, line: { color: ac.bar } });
    
    let ty = cy + c.padY;
    if (hasIcon) {
      slide.addText(it.icon, { x: tx, y: ty, w: 0.35, h: 0.35, fontSize: 14, valign: "middle" });
      tx += 0.38;
      tw -= 0.38;
    }
    
    if (it.title) {
      slide.addText(it.title, { x: tx, y: ty, w: tw, h: titleH, fontSize: c.titleSize, bold: true, color: ac.title, fontFace: font, valign: "top" });
      ty += titleH;
    }
    if (it.desc) {
      slide.addText(it.desc, { x: tx, y: ty, w: tw, h: descH + 0.05, fontSize: c.bodySize, color: ac.text, fontFace: font, valign: "top", wrap: true });
    }
    cy += boxH + c.gap;
  }
  return cy - y;
}

function renderFaqAccordion(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  let cy = y;
  item.items.forEach((it, idx) => {
    const ac = hexClean(it.color) || pal.brand;
    const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize);
    const qH  = (c.titleSize / 72) * 1.7 + 0.1;
    const aH  = (c.bodySize / 72) * 1.7 * Math.max(1, lines);
    const rowH = qH + aH + c.gap * 0.5;
    const isEven = idx % 2 === 0;
    const rowFill = it.color ? { color: hexClean(it.color), transparency: 90 } : { color: isEven ? pal.brandLight : D.palette.white };
    slide.addShape("roundRect", { x, y: cy, w, h: rowH, rectRadius: r, fill: rowFill, line: { color: it.color ? ac : pal.border, width: 0.75 } });
    slide.addShape("rect", { x, y: cy, w: 0.06, h: rowH, fill: { color: ac }, line: { color: ac } });
    slide.addText("Q  " + (it.title || ""), { x: x + 0.12, y: cy + 0.06, w: w - 0.16, h: qH, fontSize: c.titleSize, bold: true, color: it.color ? ac : pal.brandDark, fontFace: font, valign: "top" });
    if (it.desc) slide.addText("A  " + it.desc, { x: x + 0.12, y: cy + 0.06 + qH, w: w - 0.16, h: aH + 0.05, fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true });
    cy += rowH + c.gap * 0.5;
  });
  return cy - y;
}

function renderPromptExample(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const mono = D.slide.fontMono; const r = D.slide.globalRadius;
  let cy = y;
  for (const it of item.items) {
    const ac = hexClean(it.color) || pal.brand;
    const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize - 1);
    const titleH = (c.titleSize / 72) * 1.7;
    const descH  = (c.bodySize - 1) / 72 * 1.7 * Math.max(1, lines);
    const boxH   = c.padY + titleH + c.gap * 0.5 + descH + c.padY;
    slide.addShape("roundRect", { x, y: cy, w, h: boxH, rectRadius: r, fill: { color: D.palette.codeBg || "0D1117" }, line: { color: ac, width: 1 } });
    slide.addShape("rect", { x, y: cy, w, h: 0.04, fill: { color: ac }, line: { color: ac } });
    let ty = cy + c.padY;
    if (it.title) {
      slide.addText("▶ " + it.title, { x: x + c.padX, y: ty, w: w - c.padX * 2, h: titleH + 0.05, fontSize: c.titleSize, bold: true, color: D.palette.codeText || "A8B2D8", fontFace: font, valign: "top" });
      ty += titleH + c.gap * 0.5;
    }
    if (it.desc) slide.addText(it.desc, { x: x + c.padX, y: ty, w: w - c.padX * 2, h: descH + 0.05, fontSize: c.bodySize - 1, color: "CDD6F4", fontFace: mono || font, valign: "top", wrap: true });
    cy += boxH + c.gap;
  }
  return cy - y;
}

function renderCommandBlock(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const mono = D.slide.fontMono; const r = D.slide.globalRadius;
  let cy = y;
  for (const it of item.items) {
    const label = it.title || it.tag || "Terminal";
    const lang = it.meta || "bash";
    const codeLines = (it.desc || "").split("\n");
    const codeH = Math.max(0.4, (c.codeSize / 72) * 1.7 * codeLines.length + 0.2);
    const totalH = codeH + 0.38;
    
    slide.addShape("roundRect", { x, y: cy, w, h: totalH, rectRadius: r, fill: { color: "0F172A" }, line: { color: pal.border, width: 0.75 } });
    slide.addShape("rect", { x, y: cy, w, h: 0.35, fill: { color: "1E293B" }, line: { color: "1E293B" } });
    slide.addText(label, { x: x + 0.12, y: cy, w: w * 0.7, h: 0.35, fontSize: 9, bold: true, color: pal.muted || "8892B0", fontFace: mono || font, valign: "middle" });
    slide.addText(lang, { x: x + w - 1.2, y: cy, w: 1.0, h: 0.35, fontSize: 9, color: pal.brand, fontFace: mono || font, align: "right", valign: "middle" });
    
    slide.addText(it.desc || "", { x: x + 0.12, y: cy + 0.38, w: w - 0.24, h: codeH - 0.05, fontSize: c.codeSize, color: pal.codeText || "CDD5E1", fontFace: mono || font, valign: "top", wrap: true });
    cy += totalH + c.gap;
  }
  return cy - y;
}

function renderTabs(slide, item, x, y, w, pal) {
  const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  let cy = y;
  item.items.forEach((it, idx) => {
    const tabTitle = it.title || it.tag || `Tab ${idx + 1}`;
    const lines = estimateLines(it.desc || "", w - c.padX * 2, c.bodySize);
    const descH = (c.bodySize / 72) * 1.7 * lines;
    const totalH = 0.35 + descH + 0.2;
    
    slide.addShape("roundRect", { x, y: cy, w, h: totalH, rectRadius: r, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
    slide.addShape("rect", { x, y: cy, w, h: 0.35, fill: { color: pal.brandLight }, line: { color: pal.brandLight } });
    slide.addShape("rect", { x, y: cy + 0.31, w, h: 0.04, fill: { color: pal.brand }, line: { color: pal.brand } });
    slide.addText(tabTitle, { x: x + 0.15, y: cy, w: w - 0.3, h: 0.31, fontSize: 10, bold: true, color: pal.brandDark, fontFace: font, valign: "middle" });
    
    slide.addText(it.desc || "", { x: x + c.padX, y: cy + 0.45, w: w - c.padX * 2, h: descH, fontSize: c.bodySize, color: pal.text2, fontFace: font, valign: "top", wrap: true });
    cy += totalH + c.gap;
  });
  return cy - y;
}

function renderStatHighlight(slide, item, x, y, w, pal) {
  const g = D.grid; const c = D.card; const font = D.slide.font; const r = D.slide.globalRadius;
  const cols = Math.max(1, Math.min(item.items.length, 4));
  const cardW = (w - (cols - 1) * g.gap) / cols;
  const cardH2 = 1.2;
  item.items.forEach((it, idx) => {
    const col = idx % cols; const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap); const cy = y + row * (cardH2 + g.gap);
    const ac = it.color ? hexClean(it.color) : pal.brand;
    slide.addShape("roundRect", { x: cx, y: cy, w: cardW, h: cardH2, rectRadius: r, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
    slide.addShape("rect", { x: cx, y: cy, w: cardW, h: 0.04, fill: { color: ac }, line: { color: ac } });
    
    const val = it.icon || it.title;
    slide.addText(val, { x: cx + 0.1, y: cy + 0.1, w: cardW - 0.2, h: 0.45, fontSize: 22, bold: true, color: ac, fontFace: font, align: "center", valign: "middle" });
    if (it.icon) {
      slide.addText(it.title, { x: cx + 0.1, y: cy + 0.6, w: cardW - 0.2, h: 0.24, fontSize: 9, bold: true, color: pal.text, fontFace: font, align: "center" });
    }
    if (it.desc) {
      slide.addText(it.desc, { x: cx + 0.1, y: cy + 0.88, w: cardW - 0.2, h: cardH2 - 0.94, fontSize: 8, color: pal.muted || "8892B0", fontFace: font, align: "center" });
    }
  });
  return Math.ceil(item.items.length / cols) * (cardH2 + g.gap);
}

function renderColumns(slide, item, x, y, w, pal) {
  const g = D.grid; const font = D.slide.font; const r = D.slide.globalRadius || 0.08;
  const cols = Math.max(1, Math.floor(w / 2.4));
  const cardW = (w - g.gap * (cols - 1)) / cols;
  const cardH2 = 1.4;
  
  item.items.forEach((it, idx) => {
    const col = idx % cols; const row = Math.floor(idx / cols);
    const cx = x + col * (cardW + g.gap); const cy = y + row * (cardH2 + g.gap);
    const ac = it.color ? hexClean(it.color) : pal.brand;
    
    // 카드 외곽선 그리기
    slide.addShape("roundRect", { x: cx, y: cy, w: cardW, h: cardH2, rectRadius: r, fill: { color: pal.white }, line: { color: pal.border, width: 0.75 } });
    // 카드 상단 바 그리기
    slide.addShape("rect", { x: cx, y: cy, w: cardW, h: 0.04, fill: { color: ac }, line: { color: ac } });
    
    // 타이틀(문법) - 연한 브랜드 배경에 monospaced 느낌으로
    slide.addShape("roundRect", { x: cx + 0.12, y: cy + 0.12, w: cardW - 0.24, h: 0.32, rectRadius: 0.06, fill: { color: ac, transparency: 93 } });
    slide.addText(it.title || "", { x: cx + 0.12, y: cy + 0.12, w: cardW - 0.24, h: 0.32, fontSize: 10, bold: true, color: ac, fontFace: "Courier New", align: "center", valign: "middle" });
    
    // 설명 (desc)
    if (it.desc) {
      slide.addText(it.desc, { x: cx + 0.12, y: cy + 0.52, w: cardW - 0.24, h: 0.35, fontSize: 8.5, color: pal.text, fontFace: font, align: "center", valign: "top" });
    }
    // 예시 (meta/note)
    const example = it.meta || it.note;
    if (example) {
      slide.addShape("roundRect", { x: cx + 0.12, y: cy + 0.94, w: cardW - 0.24, h: 0.34, rectRadius: 0.04, fill: { color: ac, transparency: 96 } });
      slide.addText(example, { x: cx + 0.16, y: cy + 0.94, w: cardW - 0.32, h: 0.34, fontSize: 7.5, color: pal.muted || "8892B0", fontFace: "Courier New", align: "center", valign: "middle" });
    }
  });
  return Math.ceil(item.items.length / cols) * (cardH2 + g.gap);
}

function renderItem(slide, item, x, y, w, pal) {
  if (item.type === "card")                                                      return renderCard(slide, item, x, y, w, pal);
  if (item.type === "icon-grid")                                                 return renderIconGrid(slide, item, x, y, w, pal);
  if (item.type === "feature-grid")                                              return renderFeatureGrid(slide, item, x, y, w, pal);
  if (item.type === "step-list" || item.type === "steps")                        return renderSteps(slide, item, x, y, w, pal);
  if (item.type === "compare-grid")                                              return renderCompareGrid(slide, item, x, y, w, pal);
  if (item.type === "columns-grid" || item.type === "columns")                   return renderColumns(slide, item, x, y, w, pal);
  if (item.type === "workflow-strip" || item.type === "workflow")                return renderWorkflow(slide, item, x, y, w, pal);
  if (item.type === "tool-box" || item.type === "tool-card")                     return renderToolCard(slide, item, x, y, w, pal);
  if (item.type === "plan-grid")                                                 return renderPlanGrid(slide, item, x, y, w, pal);
  if (item.type === "bottom-list")                                               return renderBottomList(slide, item, x, y, w, pal);
  if (item.type === "compare-split" || item.type === "compare-2col")             return renderCompare2Col(slide, item, x, y, w, pal);
  if (item.type === "alert-box")                                                 return renderAlertBox(slide, item, x, y, w, pal);
  if (item.type === "faq-list" || item.type === "faq-accordion")                 return renderFaqAccordion(slide, item, x, y, w, pal);
  if (item.type === "console-box" || item.type === "prompt-example")             return renderPromptExample(slide, item, x, y, w, pal);
  if (item.type === "cmd-box" || item.type === "command-block")                  return renderCommandBlock(slide, item, x, y, w, pal);
  if (item.type === "os-tabs" || item.type === "tabs")                           return renderTabs(slide, item, x, y, w, pal);
  if (item.type === "stat-grid" || item.type === "stat-highlight")               return renderStatHighlight(slide, item, x, y, w, pal);
  
  // 특화 숏코드 우회 매핑
  if (item.type === "git-flow-strip")                                            return renderWorkflow(slide, item, x, y, w, pal);
  if (item.type === "editor-box")                                                return renderCommandBlock(slide, item, x, y, w, pal);
  if (item.type === "network-box")                                               return renderCompareGrid(slide, item, x, y, w, pal);
  // Phase 4 신규 구현
  if (item.type === "flow")                                                      return renderFlow(slide, item, x, y, w, pal);
  if (item.type === "takeaway")                                                  return renderTakeaway(slide, item, x, y, w, pal);
  if (item.type === "compare-before-after")                                      return renderCompareBeforeAfter(slide, item, x, y, w, pal);
  // Phase 3: 미구현 숏코드 경고
  console.warn(`  ⚠️  PPTX 미구현 숏코드: "${item.type}" — 슬라이드에서 제외됨`);
  return 0;
}

// ════════════════════════════════════════════════════════════════
//  10. 슬라이드 렌더러
// ════════════════════════════════════════════════════════════════

function renderCover(prs, fm, pal) {
  const slide = prs.addSlide();
  const dc = D.cover; const sw = D.slide.widthIn; const font = D.slide.font;
  slide.background = { color: pal.bgDark };
  slide.addShape("rect", { x: dc.accentBarX, y: dc.accentBarY, w: dc.accentBarW, h: dc.accentBarH, fill: { color: pal.brand }, line: { color: pal.brand } });
  let ty = dc.titleY;
  if (fm.logo) slide.addText(fm.logo, { x: dc.titleX, y: ty - 0.85, w: 0.85, h: 0.75, fontSize: dc.logoFontSize, align: "left", valign: "middle" });
  slide.addText(fm.title || "", { x: dc.titleX, y: ty, w: sw - dc.titleX - 0.5, h: 1.2, fontSize: dc.titleFontSize, bold: true, color: pal.white, fontFace: font, valign: "top" });
  ty += 1.2;
  if (fm.subtitle) {
    slide.addText(fm.subtitle, { x: dc.titleX, y: ty, w: sw - dc.titleX - 0.5, h: 0.4, fontSize: dc.subtitleFontSize, color: pal.muted, fontFace: font });
    ty += 0.5;
  }
  if (fm.stats?.length) {
    const statW = 1.4;
    fm.stats.forEach((stat, i) => {
      const sx = dc.titleX + i * (statW + 0.2);
      slide.addText(stat.value || "", { x: sx, y: ty, w: statW, h: 0.38, fontSize: 18, bold: true, color: pal.brand, fontFace: font });
      slide.addText(stat.label || "", { x: sx, y: ty + 0.36, w: statW, h: 0.24, fontSize: 10, color: pal.muted, fontFace: font });
    });
  }
}

function renderSectionSlide(prs, section, pal, verbose) {
  const slide = prs.addSlide();
  const dh = D.header; const sw = D.slide.widthIn; const mx = D.slide.marginX; const font = D.slide.font;
  const bodyW = sw - mx * 2;
  slide.background = { color: D.palette.white };
  slide.addShape("rect", { x: 0, y: dh.y, w: sw, h: dh.h, fill: { color: pal.bgDark }, line: { color: pal.bgDark } });
  const nbs = dh.numBoxSize; const nby = dh.y + (dh.h - nbs) / 2;
  slide.addShape("roundRect", { x: dh.paddingX, y: nby, w: nbs, h: nbs, rectRadius: 0.1, fill: { color: pal.brand }, line: { color: pal.brand } });
  slide.addText(String(section.num), { x: dh.paddingX, y: nby, w: nbs, h: nbs, fontSize: dh.numFontSize, bold: true, color: pal.white, fontFace: font, align: "center", valign: "middle" });
  slide.addText(section.title, { x: dh.paddingX + nbs + 0.15, y: dh.y, w: sw - dh.paddingX - nbs - 0.25, h: dh.h, fontSize: dh.titleFontSize, bold: true, color: pal.white, fontFace: font, valign: "middle" });
  let curY = D.slide.bodyTopY;
  for (const item of section.items) {
    if (curY + itemH(item, bodyW) > D.slide.bodyBottomY + 0.1 && verbose) console.warn(`  ⚠️  "${section.title}": 높이 초과 (type=${item.type})`);
    curY += renderItem(slide, item, mx, curY, bodyW, pal) + D.card.gap;
  }
}

function renderDoneSlide(prs, fm, pal) {
  if (!fm.done?.title) return;
  const slide = prs.addSlide();
  const sw = D.slide.widthIn; const font = D.slide.font;
  slide.background = { color: pal.brandDeep || pal.brandDark };
  slide.addText(fm.done.title, { x: 1, y: 2.5, w: sw - 2, h: 0.8, fontSize: 36, bold: true, color: D.palette.white, fontFace: font, align: "center" });
  if (fm.done.subtitle) slide.addText(fm.done.subtitle, { x: 1.5, y: 3.5, w: sw - 3, h: 0.6, fontSize: 16, color: pal.mutedLight, fontFace: font, align: "center", wrap: true });
  if (fm.done.ctaLabel) slide.addText(fm.done.ctaLabel + " →", { x: (sw - 3) / 2, y: 4.3, w: 3, h: 0.5, fontSize: 14, bold: true, color: pal.brand, fontFace: font, align: "center" });
}

// ════════════════════════════════════════════════════════════════
//  11. 메인 변환 함수
// ════════════════════════════════════════════════════════════════

export async function convertMdToPptx(mdPath, opts = {}) {
  const { out, styleOverride, noCover, verbose } = opts;
  const { fm, sections, styleKey, style } = buildSlideData(mdPath, styleOverride);
  const pal = makePalette(style);
  if (verbose) {
    console.log(`  📄 ${basename(mdPath)}  style: ${styleKey}`);
    sections.forEach(s => console.log(`     [${s.num}] "${s.title}"  items: ${s.items.map(i => i.type).join(", ")}`));
  }
  const prs = new pptxgen();
  prs.layout = D.slide.layout;
  if (!noCover) renderCover(prs, fm, pal);
  for (const section of sections) renderSectionSlide(prs, section, pal, verbose);
  renderDoneSlide(prs, fm, pal);
  const name = basename(mdPath, extname(mdPath));
  const outPath = out || join(D.output.dir, `${name}${D.output.suffix || ""}.pptx`);
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  await prs.writeFile({ fileName: outPath });
  console.log(`✅ ${basename(mdPath)} → ${outPath}  (섹션 ${sections.length}개)`);
  return outPath;
}

// ════════════════════════════════════════════════════════════════
//  12. CLI 진입점
// ════════════════════════════════════════════════════════════════

const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
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

  const convOpts = { out: args.out || null, styleOverride: args.style || null, noCover: !!args.noCover, verbose: !!args.verbose };

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
}
