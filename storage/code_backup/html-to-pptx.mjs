#!/usr/bin/env node
/**
 * html-to-pptx.mjs
 * HTML 가이드 파일을 PowerPoint(.pptx)로 변환하는 CLI 스크립트
 *
 * 사용법:
 *   node scripts/html-to-pptx.mjs public/guides/Claude.html
 *   node scripts/html-to-pptx.mjs public/guides/Claude.html --out dist/Claude.pptx
 *   node scripts/html-to-pptx.mjs public/guides/notion.html --style knowledge
 *   node scripts/html-to-pptx.mjs --all "public/guides/*.html"
 *   node scripts/html-to-pptx.mjs public/guides/Claude.html --verbose
 *
 * 옵션:
 *   --out <path>      출력 .pptx 경로 (기본: dist-pptx/<이름>.pptx)
 *   --style <key>     styles.json 색상 프리셋 (ai-chat | ai-dev | knowledge | productivity | creative)
 *   --config <path>   커스텀 설정 파일 경로 (기본: scripts/pptx.config.json)
 *   --all             위치 인수를 glob 패턴으로 처리해 다중 파일 변환
 *   --no-cover        표지 슬라이드 생성 안 함
 *   --verbose         상세 로그 출력
 */

import { load }           from "cheerio";
import pptxgen            from "pptxgenjs";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath }  from "node:url";
import { glob }           from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STYLES_PATH = resolve(__dirname, "../templates/styles.json");
const DEFAULT_CONFIG_PATH = resolve(__dirname, "pptx.config.json");

// ═══════════════════════════════════════════════════════════════
//  유틸리티
// ═══════════════════════════════════════════════════════════════

function stripComments(str) {
  return str
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof result[k] === "object") {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

function normalize(str) {
  return (str || "").replace(/\s+/g, " ").replace(/ /g, " ").trim();
}

function hexClean(hex) {
  if (!hex) return null;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return hex.length >= 6 ? hex.slice(0, 6).toUpperCase() : null;
}

// ═══════════════════════════════════════════════════════════════
//  설정 로더
// ═══════════════════════════════════════════════════════════════

function loadConfig(configPath) {
  const base = JSON.parse(stripComments(readFileSync(DEFAULT_CONFIG_PATH, "utf8")));
  if (configPath && configPath !== DEFAULT_CONFIG_PATH) {
    const override = JSON.parse(stripComments(readFileSync(resolve(configPath), "utf8")));
    return deepMerge(base, override);
  }
  return base;
}

// ═══════════════════════════════════════════════════════════════
//  CLI 파서
// ═══════════════════════════════════════════════════════════════

const USAGE = `
사용법:
  node scripts/html-to-pptx.mjs <input.html> [옵션]
  node scripts/html-to-pptx.mjs --all <glob-pattern> [옵션]

옵션:
  --out <path>     출력 .pptx 파일 경로 (기본: dist-pptx/<이름>.pptx)
  --style <key>    styles.json 색상 프리셋 키
                   가능한 값: ai-chat | ai-dev | knowledge | productivity | creative
  --config <path>  pptx.config.json 경로 (기본: scripts/pptx.config.json)
  --all            glob 패턴으로 다중 파일 변환
  --no-cover       표지 슬라이드 생성 안 함
  --verbose        상세 로그 출력
`.trim();

function parseCLI(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-cover")  { flags.noCover = true; continue; }
    if (a === "--all")       { flags.all = true; continue; }
    if (a === "--verbose")   { flags.verbose = true; continue; }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      flags[key] = (!next || next.startsWith("--")) ? true : argv[++i];
    } else {
      positional.push(a);
    }
  }
  return { positional, ...flags };
}

// ═══════════════════════════════════════════════════════════════
//  CSS 변수 추출 → 색상 팔레트 빌드
// ═══════════════════════════════════════════════════════════════

function resolveColor(value, varMap, depth = 0) {
  if (depth > 5) return null;
  const trimmed = (value || "").trim();
  const refMatch = trimmed.match(/^var\((--[a-z0-9-]+)\)/i);
  if (refMatch) return resolveColor(varMap[refMatch[1]] || "", varMap, depth + 1);
  const hexMatch = trimmed.match(/#([0-9a-fA-F]{3,8})/);
  return hexMatch ? hexClean(hexMatch[1]) : null;
}

function extractCssVars(html, cssVarMapping) {
  const cssText = (() => {
    const $ = load(html);
    return $("style").map((_, el) => $(el).text()).get().join("\n");
  })();

  const rootMatch = cssText.match(/:root\s*\{([^}]+)\}/s);
  const rootBlock = rootMatch ? rootMatch[1] : cssText;

  const varMap = {};
  for (const m of rootBlock.matchAll(/(--([\w-]+))\s*:\s*([^;]+);/g)) {
    varMap[m[1]] = m[3].trim();
  }

  const palette = {};
  for (const [role, candidates] of Object.entries(cssVarMapping)) {
    for (const varName of candidates) {
      const hex = resolveColor(varMap[varName] || "", varMap);
      if (hex) { palette[role] = hex; break; }
    }
  }

  // hero 첫 번째 색상 → bgDark 용
  const heroMatch = cssText.match(/\.hero\s*\{[^}]*background[^}]*/s);
  if (heroMatch) {
    const stopMatch = heroMatch[0].match(/#([0-9a-fA-F]{6})\s+0%/);
    if (stopMatch) palette.bgDark = stopMatch[1].toUpperCase();
  }

  return palette;
}

function buildColorPalette(cssColors, defaults) {
  const brand      = cssColors.brand      || defaults.accent;
  const brandLight = cssColors.brandLight || defaults.accentLight;
  const brandDark  = cssColors.brandDark  || defaults.accentDark;
  const bgDark     = cssColors.bgDark     || defaults.bgDark;
  return {
    bgDark,
    accent:      brand,
    accentDark:  brandDark,
    accentLight: brandLight,
    title:       cssColors.text       || defaults.title,
    body:        cssColors.textMuted  || defaults.body,
    muted:       defaults.muted,
    cardBg:      brandLight           || defaults.cardBg,
    cardBorder:  cssColors.border     || defaults.cardBorder,
    codeBg:      defaults.codeBg,
    codeText:    defaults.codeText,
    white:       defaults.white,
    slideBg:     cssColors.bg         || defaults.slideBg,
  };
}

function applyStylePreset(config, preset) {
  // styles.json 프리셋의 색상을 defaultColors에 주입
  const map = {
    brand:      preset.brand,
    brandDark:  preset.brandDark,
    brandDeep:  preset.brandDeep,
    brandLight: preset.brandLight,
    brandMid:   preset.brandMid,
    bg:         preset.bg,
    border:     preset.border,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v) config.defaultColors[k] = hexClean(v) || config.defaultColors[k];
  }
  config.defaultColors.accent      = hexClean(preset.brand)      || config.defaultColors.accent;
  config.defaultColors.accentLight = hexClean(preset.brandLight) || config.defaultColors.accentLight;
  config.defaultColors.accentDark  = hexClean(preset.brandDark)  || config.defaultColors.accentDark;
  config.defaultColors.slideBg     = hexClean(preset.bg)         || config.defaultColors.slideBg;
  config.colorSource = "styles-json";
}

// ═══════════════════════════════════════════════════════════════
//  HTML 파싱 — 섹션 / 블록
// ═══════════════════════════════════════════════════════════════

function isCardEl(el, cardClasses) {
  const cls = (el.attribs?.class || "").split(/\s+/);
  return cls.some(c => cardClasses.includes(c));
}

function isGridEl(el, gridClasses) {
  const cls = (el.attribs?.class || "").split(/\s+/);
  return cls.some(c => gridClasses.includes(c));
}

const SKIP_CLASSES = new Set([
  "section-num", "section-title", "section-header", "section-sub",
  "hero-badge", "hero-stats", "nav", "nav-inner", "nav-links",
  "back-top", "model-badge", "plan-badge", "plugin-badge",
]);

function shouldSkip(el) {
  const cls = (el.attribs?.class || "").split(/\s+/);
  return cls.some(c => SKIP_CLASSES.has(c));
}

function extractGridItem($, el) {
  const $el = $(el);
  // 이모지: 첫 번째 이모지 전용 요소 탐색
  const emojiEl = $el.find(".block-emoji, .int-icon, .skill-icon .icon, .mi-icon, .fi, .icon").first();
  const emoji = emojiEl.length ? normalize(emojiEl.text()) : "";
  // 제목: h3, h4, strong, .card-title, .model-name, .mt-name, .int-name 등
  const titleEl = $el.find("h3, h4, strong, .card-title, .model-name, .mt-name, .int-name, .mi-title, .skill-info strong").first();
  const title = normalize(titleEl.text());
  // 본문: 제목을 제외한 텍스트
  const fullText = normalize($el.text());
  const body = title ? normalize(fullText.replace(title, "").replace(emoji, "")) : normalize(fullText);
  return { emoji, title, body };
}

function extractCardText($, el) {
  const $el = $(el);
  const titleEl = $el.find("h3, h4, strong, .card-title, .model-name, .prompt-label, .sp-header .title").first();
  const title = normalize(titleEl.text());
  const fullText = normalize($el.text());
  const body = title ? normalize(fullText.replace(title, "")) : fullText;
  return { title: title || undefined, body };
}

function parseTable($, el) {
  const rows = [];
  let hasHeader = false;
  const $el = $(el);
  const thead = $el.find("thead").first();
  if (thead.length) {
    hasHeader = true;
    const r = thead.find("th, td").map((_, c) => normalize($(c).text())).get();
    if (r.length) rows.push(r);
  }
  $el.find("tbody tr, tr").each((_, tr) => {
    if (thead.length && thead.find(tr).length) return;
    const r = $(tr).find("th, td").map((_, c) => normalize($(c).text())).get();
    if (r.length) rows.push(r);
  });
  return { kind: "table", rows, hasHeader };
}

function walkEl($, root, config, seen = new Set()) {
  const blocks = [];

  for (const child of $(root).children().toArray()) {
    if (seen.has(child)) continue;
    const tag = (child.tagName || child.name || "").toLowerCase();
    if (!tag || tag === "script" || tag === "style") continue;

    // 무시할 요소
    if (shouldSkip(child)) continue;

    // ── 그리드 컨테이너 ──
    if (isGridEl(child, config.gridClasses)) {
      const items = [];
      for (const cardEl of $(child).children().toArray()) {
        if (isCardEl(cardEl, config.cardClasses)) {
          items.push(extractGridItem($, cardEl));
        }
      }
      if (items.length > 0) {
        blocks.push({ kind: "grid", items });
      } else {
        // 그리드이지만 카드 없음 → 재귀
        blocks.push(...walkEl($, child, config, seen));
      }
      continue;
    }

    // ── 단독 카드 ──
    if (isCardEl(child, config.cardClasses)) {
      const { title, body } = extractCardText($, child);
      if (body || title) blocks.push({ kind: "card", title, body: body || "" });
      continue;
    }

    // ── 일반 태그 ──
    switch (tag) {
      case "h1":
      case "h2":
        // 섹션 제목은 이미 처리됨, 본문에서 제외
        break;
      case "h3":
      case "h4": {
        const t = normalize($(child).text());
        if (t) blocks.push({ kind: "h3", text: t });
        break;
      }
      case "p": {
        const t = normalize($(child).text());
        if (t) blocks.push({ kind: "p", text: t });
        break;
      }
      case "ul":
      case "ol": {
        const items = $(child).find("> li")
          .map((_, li) => normalize($(li).text()))
          .get()
          .filter(Boolean);
        if (items.length) blocks.push({ kind: "list", items, ordered: tag === "ol" });
        break;
      }
      case "table": {
        const t = parseTable($, child);
        if (t.rows.length) blocks.push(t);
        break;
      }
      case "pre": {
        const t = ($(child).text() || "").replace(/[ \t]+$/gm, "").trimEnd();
        if (t.trim()) blocks.push({ kind: "code", text: t });
        break;
      }
      case "blockquote": {
        const t = normalize($(child).text());
        if (t) blocks.push({ kind: "quote", text: t });
        break;
      }
      default: {
        // 컨테이너성 요소 → 재귀
        if ($(child).children().length > 0) {
          blocks.push(...walkEl($, child, config, seen));
        } else {
          const t = normalize($(child).text());
          if (t) blocks.push({ kind: "p", text: t });
        }
      }
    }
  }
  return blocks;
}

function parseSection($, el, config) {
  const $el = $(el);

  // 제목 추출
  let title = "";
  for (const sel of config.titleSelectors) {
    const found = $el.find(sel).first().text();
    if (found.trim()) { title = normalize(found); break; }
  }

  // 내부 래퍼 탐색
  let inner = el;
  for (const sel of config.innerSelectors) {
    const wrap = $el.find(sel).first();
    if (wrap.length) { inner = wrap[0]; break; }
  }

  const seen = new Set();
  // 제목 요소를 seen에 추가해 본문 파싱에서 제외
  for (const sel of config.titleSelectors) {
    const found = $el.find(sel).first();
    if (found.length) seen.add(found[0]);
  }
  $el.find(".section-num, .section-header, .section-sub").each((_, e) => seen.add(e));

  const blocks = walkEl($, inner, config, seen);
  return { title, blocks };
}

function parseSections($, config) {
  // ignore 요소 사전 제거
  if (config.ignoreSelector) $(config.ignoreSelector).remove();

  const selector = config.sectionSelectors.join(", ");
  const sections = [];
  $(selector).each((_, el) => {
    const s = parseSection($, el, config);
    sections.push(s);
  });
  return sections;
}

// ═══════════════════════════════════════════════════════════════
//  높이 추정 (인치)
// ═══════════════════════════════════════════════════════════════

function blockHeight(block, cfg) {
  const e = cfg.blocks;
  const g = cfg.grid;
  switch (block.kind) {
    case "h3": return 0.45;
    case "p": {
      const lines = Math.max(1, Math.ceil(block.text.length / 90));
      return e.pFontSize / 72 * 1.6 * lines + 0.12;
    }
    case "list": {
      const lines = block.items.reduce(
        (acc, t) => acc + Math.max(1, Math.ceil(t.length / 80)), 0
      );
      return e.listFontSize / 72 * 1.6 * lines + 0.2;
    }
    case "card": {
      const tLines = block.title ? 1 : 0;
      const bLines = Math.max(1, Math.ceil((block.body || "").length / 80));
      return 0.35 + 0.3 * tLines + 0.28 * bLines + 0.2;
    }
    case "grid": {
      const cols = Math.min(block.items.length, g.cardMaxCols);
      const rows = Math.ceil(block.items.length / cols);
      return rows * g.cardH + (rows - 1) * g.gapY + 0.1;
    }
    case "table": {
      return 0.45 * Math.max(1, block.rows.length) + 0.25;
    }
    case "code": {
      const lines = block.text.split("\n").length;
      return e.codeTextSize / 72 * 1.6 * lines + 0.35;
    }
    case "quote": {
      const lines = Math.max(1, Math.ceil(block.text.length / 80));
      return 0.3 * lines + 0.3;
    }
    default: return 0.3;
  }
}

// ═══════════════════════════════════════════════════════════════
//  PPT 렌더러
// ═══════════════════════════════════════════════════════════════

function drawCoverSlide(pres, docTitle, subtitle, colors, cfg) {
  const cv = cfg.cover;
  const slide = pres.addSlide();
  slide.background = { color: colors.bgDark };

  // 좌측 강조 바
  slide.addShape("rect", {
    x: cv.accentBarX, y: cv.accentBarY, w: cv.accentBarW, h: cv.accentBarH,
    fill: { color: colors.accent }, line: { color: colors.accent },
  });

  // 제목
  slide.addText(docTitle, {
    x: cv.accentBarX + cv.accentBarW + 0.2,
    y: cv.accentBarY,
    w: cfg.slide.widthIn - cv.accentBarX - cv.accentBarW - 0.4,
    h: 1.0,
    fontSize: cv.titleFontSize, bold: true,
    color: colors.white, fontFace: cfg.slide.font,
    valign: "middle",
  });

  // 서브타이틀
  const sub = subtitle || cv.subtitleText;
  if (sub) {
    slide.addText(sub, {
      x: cv.accentBarX + cv.accentBarW + 0.2,
      y: cv.accentBarY + 1.1,
      w: cfg.slide.widthIn - cv.accentBarX - cv.accentBarW - 0.4,
      h: 0.5,
      fontSize: cv.subtitleFontSize,
      color: cv.subtitleColor, fontFace: cfg.slide.font,
    });
  }
}

function drawSlideHeader(slide, title, suffix, colors, cfg) {
  const h = cfg.header;
  const mx = cfg.slide.marginX;

  // 좌측 강조 바
  slide.addShape("rect", {
    x: mx, y: h.y + 0.05, w: h.barW, h: h.h - 0.1,
    fill: { color: colors.accent }, line: { color: colors.accent },
  });

  // 제목 텍스트
  const text = title + (suffix ? `  ${suffix}` : "");
  slide.addText(text, {
    x: mx + h.barW + 0.1,
    y: h.y,
    w: cfg.slide.widthIn - mx * 2 - h.barW - 0.1,
    h: h.h,
    fontSize: h.titleFontSize, bold: true,
    color: colors.title, fontFace: cfg.slide.font,
    valign: "middle",
  });
}

function drawPageNumber(slide, current, total, colors, cfg) {
  slide.addText(`${current} / ${total}`, {
    x: cfg.slide.widthIn - 1.3,
    y: cfg.slide.heightIn - 0.38,
    w: 1.1, h: 0.28,
    fontSize: 9, color: colors.muted,
    align: "right", fontFace: cfg.slide.font,
  });
}

function drawCardItem(slide, item, x, y, w, h, colors, cfg) {
  const e = cfg.blocks;
  const rr = e.cardRadius;

  slide.addShape("roundRect", {
    x, y, w, h: h - 0.04,
    fill: { color: colors.cardBg },
    line: { color: colors.cardBorder, width: 1 },
    rectRadius: rr,
  });

  let iy = y + e.cardPadY;
  const ix = x + e.cardPadX;
  const iw = w - e.cardPadX * 2;

  if (item.emoji) {
    slide.addText(item.emoji, {
      x: ix, y: iy, w: 0.4, h: 0.35, fontSize: 16,
    });
    iy += 0.37;
  }
  if (item.title) {
    slide.addText(item.title, {
      x: ix, y: iy, w: iw, h: 0.32,
      fontSize: e.cardTitleSize, bold: true,
      color: colors.title, fontFace: cfg.slide.font,
      valign: "middle",
    });
    iy += 0.34;
  }
  if (item.body) {
    const remH = h - (iy - y) - e.cardPadY;
    if (remH > 0.15) {
      slide.addText(item.body, {
        x: ix, y: iy, w: iw, h: remH,
        fontSize: e.cardBodySize, color: colors.body,
        fontFace: cfg.slide.font, valign: "top",
      });
    }
  }
}

function drawGridBlock(slide, block, startX, startY, totalW, colors, cfg) {
  const g = cfg.grid;
  const items = block.items;
  if (!items || items.length === 0) return 0;

  const cols = Math.min(items.length, g.cardMaxCols);
  const rows = Math.ceil(items.length / cols);

  // overflowBehavior: "allow"/"warn" → cardMinW 고정 (슬라이드 폭 초과 허용)
  const cardW = g.cardMinW;
  const totalUsedW = cols * cardW + (cols - 1) * g.gapX;

  if (g.overflowBehavior === "warn" && totalUsedW > totalW + 0.01) {
    console.warn(`  ⚠️  그리드 폭 초과: 필요 ${totalUsedW.toFixed(2)}" > 가용 ${totalW.toFixed(2)}" (PPT에서 직접 조정 필요)`);
  }

  for (let idx = 0; idx < items.length; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = startX + col * (cardW + g.gapX);
    const y = startY + row * (g.cardH + g.gapY);
    drawCardItem(slide, items[idx], x, y, cardW, g.cardH, colors, cfg);
  }

  return rows * g.cardH + (rows - 1) * g.gapY;
}

function drawBlock(slide, block, x, y, w, colors, cfg) {
  const e = cfg.blocks;
  const fnt = cfg.slide.font;
  const fntMono = cfg.slide.fontMono;
  const h = blockHeight(block, cfg);

  switch (block.kind) {
    case "h3":
      slide.addText(block.text, {
        x, y, w, h,
        fontSize: e.h3FontSize, bold: true,
        color: colors.title, fontFace: fnt,
      });
      break;

    case "p":
      slide.addText(block.text, {
        x, y, w, h,
        fontSize: e.pFontSize, color: colors.body,
        fontFace: fnt, valign: "top",
      });
      break;

    case "list":
      slide.addText(
        block.items.map(t => ({
          text: t,
          options: { bullet: block.ordered ? { type: "number" } : true },
        })),
        {
          x, y, w, h,
          fontSize: e.listFontSize, color: colors.body,
          fontFace: fnt, paraSpaceAfter: 4, valign: "top",
        }
      );
      break;

    case "card": {
      slide.addShape("roundRect", {
        x, y, w, h: h - 0.04,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
        rectRadius: e.cardRadius,
      });
      let iy = y + e.cardPadY;
      if (block.title) {
        slide.addText(block.title, {
          x: x + e.cardPadX, y: iy,
          w: w - e.cardPadX * 2, h: 0.32,
          fontSize: e.cardTitleSize, bold: true,
          color: colors.title, fontFace: fnt,
        });
        iy += 0.34;
      }
      if (block.body) {
        const remH = h - (iy - y) - e.cardPadY;
        if (remH > 0.1) {
          slide.addText(block.body, {
            x: x + e.cardPadX, y: iy,
            w: w - e.cardPadX * 2, h: remH,
            fontSize: e.cardBodySize, color: colors.body,
            fontFace: fnt, valign: "top",
          });
        }
      }
      break;
    }

    case "table": {
      if (!block.rows.length) break;
      const colW = w / block.rows[0].length;
      const tableRows = block.rows.map((row, ri) =>
        row.map(cell => ({
          text: cell,
          options: {
            bold: block.hasHeader && ri === 0,
            color: block.hasHeader && ri === 0 ? colors.white : colors.body,
            fill: { color: block.hasHeader && ri === 0 ? colors.accent : colors.white },
            fontFace: fnt, fontSize: 11, valign: "middle",
          },
        }))
      );
      slide.addTable(tableRows, {
        x, y, w,
        colW: Array(block.rows[0].length).fill(colW),
        border: { type: "solid", pt: 0.5, color: colors.cardBorder },
      });
      break;
    }

    case "code": {
      slide.addShape("roundRect", {
        x, y, w, h: h - 0.04,
        fill: { color: colors.codeBg },
        line: { color: colors.codeBg, width: 0 },
        rectRadius: 0.05,
      });
      slide.addText(block.text, {
        x: x + 0.2, y: y + 0.1,
        w: w - 0.4, h: h - 0.25,
        fontSize: e.codeTextSize, color: colors.codeText,
        fontFace: fntMono, valign: "top",
      });
      break;
    }

    case "quote": {
      slide.addShape("rect", {
        x, y, w: e.quoteBarW, h: h - 0.04,
        fill: { color: colors.accent }, line: { color: colors.accent },
      });
      slide.addText(block.text, {
        x: x + e.quoteBarW + 0.12, y,
        w: w - e.quoteBarW - 0.15, h,
        fontSize: e.quoteTextSize, italic: true,
        color: colors.body, fontFace: fnt, valign: "top",
      });
      break;
    }

    case "grid":
      // grid는 drawGridBlock으로 별도 처리 (이 경로는 fallback)
      return drawGridBlock(slide, block, x, y, w, colors, cfg);
  }

  return h + e.gap;
}

// ═══════════════════════════════════════════════════════════════
//  PPTX 빌드
// ═══════════════════════════════════════════════════════════════

function buildPptx(sections, docTitle, heroSubtitle, colors, cfg, args) {
  const pres = new pptxgen();
  pres.layout = cfg.slideLayout;

  // 표지 슬라이드
  if (!args.noCover && cfg.cover.enabled) {
    drawCoverSlide(pres, docTitle, heroSubtitle, colors, cfg);
  }

  const slidesMeta = [];

  for (const section of sections) {
    const { title, blocks } = section;
    const slideTitle = title || docTitle;
    const mx = cfg.slide.marginX;
    const contentW = cfg.slide.widthIn - mx * 2;

    if (blocks.length === 0) {
      const slide = pres.addSlide();
      slide.background = { color: colors.slideBg };
      drawSlideHeader(slide, slideTitle, "", colors, cfg);
      slidesMeta.push(slide);
      continue;
    }

    let slide = pres.addSlide();
    slide.background = { color: colors.slideBg };
    drawSlideHeader(slide, slideTitle, "", colors, cfg);
    slidesMeta.push(slide);
    let y = cfg.slide.bodyTopY;
    let partIndex = 1;
    const bodyMax = cfg.slide.bodyBottomY - cfg.slide.bodyTopY;

    for (const block of blocks) {
      const h = blockHeight(block, cfg);

      // overflowBehavior: "allow" — 높이 초과 시 경고만 (페이지 분할 없음)
      if (y + h > cfg.slide.bodyTopY + bodyMax + 0.01 && args.verbose) {
        const overflow = (y + h - (cfg.slide.bodyTopY + bodyMax)).toFixed(2);
        console.warn(`  ⚠️  슬라이드 높이 초과 +${overflow}" — "${slideTitle}" (블록: ${block.kind})`);
      }

      if (block.kind === "grid") {
        const used = drawGridBlock(slide, block, mx, y, contentW, colors, cfg);
        y += used + cfg.blocks.gap;
      } else {
        const used = drawBlock(slide, block, mx, y, contentW, colors, cfg);
        y += used;
      }
    }
  }

  // 페이지 번호 (표지 제외)
  const total = slidesMeta.length;
  slidesMeta.forEach((slide, i) => drawPageNumber(slide, i + 1, total, colors, cfg));

  return pres;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = parseCLI(process.argv.slice(2));

  if (!args.positional?.length && !args.all) {
    console.error(USAGE);
    process.exit(1);
  }

  // 설정 로드
  const cfg = loadConfig(args.config);

  // styles.json 프리셋 적용
  const styles = JSON.parse(readFileSync(STYLES_PATH, "utf8"));
  if (args.style) {
    const preset = styles[args.style];
    if (!preset) {
      console.error(`알 수 없는 스타일 키: "${args.style}". 사용 가능: ${Object.keys(styles).filter(k => !k.startsWith("$")).join(", ")}`);
      process.exit(1);
    }
    applyStylePreset(cfg, preset);
    if (args.verbose) console.log(`  스타일 프리셋 적용: ${args.style} (${preset.label})`);
  }

  // 입력 파일 목록 결정
  let inputs = [];
  if (args.all) {
    // glob 처리 (Node.js 22+의 glob, 또는 직접 파싱)
    const pattern = args.positional[0];
    if (!pattern) { console.error("--all 옵션에는 glob 패턴이 필요합니다."); process.exit(1); }
    try {
      const entries = [];
      for await (const f of glob(pattern)) entries.push(f);
      inputs = entries;
    } catch {
      // glob API 미지원 환경 → 단순 파일로 처리
      inputs = args.positional;
    }
  } else {
    inputs = args.positional;
  }

  if (!inputs.length) {
    console.error("변환할 HTML 파일이 없습니다.");
    process.exit(1);
  }

  let successCount = 0;

  for (const inputPath of inputs) {
    const absInput = resolve(inputPath);
    if (args.verbose) console.log(`\n처리 중: ${absInput}`);

    let html;
    try {
      html = readFileSync(absInput, "utf8");
    } catch (e) {
      console.error(`파일 읽기 실패: ${absInput} — ${e.message}`);
      continue;
    }

    const $ = load(html);

    // 문서 제목 추출
    const docTitle = normalize($("title").text() || $(".hero h1, section.hero h1").text() || basename(absInput, ".html"));

    // hero 서브타이틀
    const heroSubtitle = normalize($(".hero p, section.hero p").first().text()) || cfg.cover.subtitleText;

    // 색상 팔레트 결정
    let colors;
    if (cfg.colorSource === "html") {
      const cssColors = extractCssVars(html, cfg.cssVarMapping);
      colors = buildColorPalette(cssColors, cfg.defaultColors);
      if (args.verbose) {
        console.log(`  CSS 색상 추출: brand=${cssColors.brand || "없음"}, bg=${cssColors.bg || "없음"}`);
      }
    } else {
      colors = buildColorPalette({}, cfg.defaultColors);
    }

    // 섹션 파싱
    const sections = parseSections($, cfg);
    if (args.verbose) {
      console.log(`  섹션 ${sections.length}개 파싱`);
      sections.forEach((s, i) => {
        const blockSummary = s.blocks.map(b => b.kind).join(", ");
        console.log(`    [${i + 1}] "${s.title || "(제목 없음)"}" → ${s.blocks.length}개 블록: ${blockSummary}`);
      });
    }

    if (sections.length === 0) {
      console.warn(`  ⚠️  섹션이 감지되지 않았습니다: ${absInput}`);
      console.warn(`     sectionSelectors를 확인하거나 --verbose 옵션으로 확인하세요.`);
    }

    // PPT 생성
    const pres = buildPptx(sections, docTitle, heroSubtitle, colors, cfg, args);

    // 출력 경로 결정
    const outPath = args.out
      ? resolve(args.out)
      : resolve(cfg.output.dir, basename(absInput, ".html") + cfg.output.suffix + ".pptx");

    try {
      mkdirSync(dirname(outPath), { recursive: true });
      await pres.writeFile({ fileName: outPath });
      console.log(`✅ 완료: ${outPath}  (섹션 ${sections.length}개, 색상 소스: ${cfg.colorSource})`);
      successCount++;
    } catch (e) {
      console.error(`  ❌ 저장 실패: ${outPath} — ${e.message}`);
    }
  }

  console.log(`\n총 ${successCount}/${inputs.length}개 파일 변환 완료.`);
  if (successCount < inputs.length) process.exit(1);
}

main().catch(e => {
  console.error("오류:", e.message);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
