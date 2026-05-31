#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const GUIDES_DIR = path.join(ROOT, "md_src", "guides");
const VIBE_DIR = path.join(ROOT, "md_src", "vibecoding");
const SHOWCASE_DIR = path.join(ROOT, "md_src", "showcase");

const standalonePath = path.join(PUBLIC, "ai_guide_standalone.html");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeYaml(value) {
  return JSON.stringify(String(value ?? "").replace(/\s+/g, " ").trim());
}

function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function norm(text) {
  return decodeEntities(text).replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanTitle(text) {
  return norm(text).replace(/^\d+\.\s+/, "").trim();
}

function textWithBreaks($, el) {
  if (!el) return "";
  const out = [];
  function walk(node) {
    if (node.type === "text") {
      out.push(node.data);
      return;
    }
    if (node.type !== "tag") return;
    const tag = node.name.toLowerCase();
    if (["script", "style", "svg", "nav"].includes(tag)) return;
    if (tag === "br") {
      out.push("\n");
      return;
    }
    if (tag === "li") out.push("\n- ");
    if (tag === "tr") out.push("\n");
    if (tag === "td" || tag === "th") out.push(" | ");
    $(node).contents().each((_, child) => walk(child));
    if (["p", "div", "section", "h1", "h2", "h3", "h4", "li"].includes(tag)) out.push("\n");
  }
  walk(el);
  return norm(out.join(""));
}

function inlineMd($, el) {
  const parts = [];
  $(el).contents().each((_, node) => {
    if (node.type === "text") {
      parts.push(node.data);
      return;
    }
    if (node.type !== "tag") return;
    const tag = node.name.toLowerCase();
    const $n = $(node);
    const inner = inlineMd($, node);
    if (tag === "br") parts.push(" ");
    else if (tag === "strong" || tag === "b") parts.push(`**${inner}**`);
    else if (tag === "em" || tag === "i") parts.push(`_${inner}_`);
    else if (tag === "code") parts.push(`\`${norm($n.text())}\``);
    else if (tag === "a") parts.push(`[${inner}](${$n.attr("href") || ""})`);
    else parts.push(inner);
  });
  return norm(parts.join(""));
}

function pickText($, $ctx, selectors) {
  for (const sel of selectors) {
    const found = $ctx.find(sel).first();
    if (found.length) return norm(found.text());
  }
  return "";
}

function pickOwnText($, $ctx) {
  const clone = $ctx.clone();
  clone.find("script,style,svg").remove();
  return norm(clone.text());
}

function itemLine(key, value, first = false) {
  const prefix = first ? "- " : "  ";
  const val = String(value ?? "").trim();
  if (!val) return "";
  if (val.includes("\n") || val.length > 110 || /^[-*#>|]/.test(val)) {
    return `${prefix}${key}: |\n${val.split(/\r?\n/).map(line => `    ${line}`).join("\n")}`;
  }
  return `${prefix}${key}: ${escapeYaml(val)}`;
}

function shortcode(type, items, args = "") {
  const cleaned = items.filter(it => Object.values(it).some(v => String(v ?? "").trim()));
  if (!cleaned.length) return "";
  const lines = [`::: ${type}${args ? ` ${args}` : ""}`];
  for (const item of cleaned) {
    let first = true;
    for (const key of ["icon", "title", "tag", "desc", "meta", "color", "featured"]) {
      if (!item[key]) continue;
      const line = itemLine(key, item[key], first);
      if (line) {
        lines.push(line);
        first = false;
      }
    }
  }
  lines.push(":::");
  return lines.join("\n");
}

function metaFromList($, $ctx, selectors) {
  const values = [];
  for (const sel of selectors) {
    $ctx.find(sel).each((_, el) => {
      const t = norm($(el).text());
      if (t) values.push(t);
    });
    if (values.length) break;
  }
  return values.join("|");
}

function cardItems($, $container, itemSelector, fieldMap) {
  const $items = $container.find(itemSelector);
  const result = [];
  $items.each((_, el) => {
    const $it = $(el);
    const title = pickText($, $it, fieldMap.title || ["h3", "h4", ".title", ".name"]);
    const desc = pickText($, $it, fieldMap.desc || ["p", ".desc"]);
    const icon = pickText($, $it, fieldMap.icon || [".icon", ".feat-icon", ".feature-icon", ".card-icon"]);
    const tag = pickText($, $it, fieldMap.tag || [".tag", ".badge", ".feature-tag"]);
    const meta = metaFromList($, $it, fieldMap.meta || ["li"]);
    const fallback = !title && !desc ? pickOwnText($, $it) : "";
    result.push({
      icon,
      title: title || fallback,
      tag,
      desc,
      meta,
      featured: /featured|recommend/i.test($it.attr("class") || "") ? "true" : ""
    });
  });
  return result;
}

function tableToMd($, table) {
  const rows = [];
  $(table).find("tr").each((_, tr) => {
    const cells = [];
    $(tr).children("th,td").each((__, cell) => cells.push(inlineMd($, cell)));
    if (cells.length) rows.push(cells);
  });
  if (!rows.length) return "";
  const width = Math.max(...rows.map(r => r.length));
  const normalized = rows.map(r => [...r, ...Array(width - r.length).fill("")]);
  const head = normalized[0];
  const sep = Array(width).fill("---");
  const body = normalized.slice(1);
  return [head, sep, ...body].map(r => `| ${r.join(" | ")} |`).join("\n");
}

function convertSpecial($, el) {
  const $el = $(el);
  const cls = ($el.attr("class") || "").split(/\s+/);
  const has = (...names) => names.some(name => cls.includes(name));

  if (has("plan-grid")) {
    return shortcode("plan-grid", cardItems($, $el, ".plan-card,.tier-nano,.tier-flash,.tier-pro,.tier-ultra", {
      title: [".plan-name", ".plan-title", ".model-name"],
      tag: [".plan-badge", ".model-tier"],
      desc: [".plan-price", ".model-ctx"],
      meta: [".plan-features li", ".plan-feat li", "li"]
    }), "cols=4");
  }
  if (has("model-timeline")) {
    const items = [];
    $el.find(".mt-item").each((_, item) => {
      const $it = $(item);
      items.push({
        title: pickText($, $it, [".mt-name"]),
        tag: pickText($, $it, [".mt-label"]),
        desc: pickText($, $it, [".mt-desc"]),
        meta: metaFromList($, $it, [".mt-tag"])
      });
    });
    return shortcode("compare-grid", items, "cols=3");
  }
  if (has("grid-2") && $el.find(".tool-card,.tool-block,.service-block,.project-card").length) {
    return "";
  }
  if (has("icon-grid", "use-case-grid", "source-grid", "block-grid", "view-grid", "concept-grid", "plugin-grid", "ext-grid", "feat-grid", "skill-grid", "workspace-grid", "feature-list", "grid-2", "grid-3", "gpt-tool-grid", "memory-items", "mindset-grid")) {
    const items = cardItems($, $el, ".icon-card,.feat-item,.uc-card,.source-card,.block-card,.view-card,.concept-card,.plugin-card,.ext-card,.skill-item,.workspace-item,.feat-card,.gpt-tool,.memory-item,.mindset-item,.feature-item,.uc-item,li,> div", {
      icon: [".icon", ".feat-icon", ".uc-icon", ".concept-icon", ".plugin-icon", ".ext-icon", ".skill-icon", ".feature-icon", ".icon-card-icon", ".gpt-tool-icon", ".mi-icon"],
      title: [".title", ".feat-title", ".uc-title", ".block-text", ".skill-info strong", ".feature-text strong", ".icon-card-title", ".gpt-tool-name", ".mi-title", ".mindset-title", ".fi-title", "h3", "h4", "strong"],
      desc: [".desc", ".feat-desc", ".uc-desc", ".skill-info span", ".feature-text span", ".gpt-tool-desc", ".mi-desc", ".mindset-desc", ".fi-desc", "p"],
      tag: [".tag", ".plugin-badge", ".ext-tag", ".mindset-role", ".case-label", ".fix-label"]
    });
    return shortcode("icon-grid", items, $el.hasClass("grid-2") ? "cols=2" : "");
  }
  if (has("feature-grid", "model-grid", "integration-grid", "adv-grid", "ai-features", "xai-grid", "toc-grid", "prereq-grid", "gem-feature-grid")) {
    return shortcode("feature-grid", cardItems($, $el, ".feature-card,.model-card,.integration-item,.adv-item,.ai-card,.xai-item,.toc-card,.prereq-card,.gem-feature,.ai-feature", {
      icon: [".icon", ".feature-icon", ".int-icon", ".toc-icon", ".card-icon", ".gf-icon"],
      title: [".title", ".model-name", ".int-name", ".card-title", ".feature-card-title", ".gf-title", "h3", "h4"],
      desc: [".desc", ".model-desc", ".gf-desc", "p"],
      tag: [".tag", ".model-badge", ".feature-tag", ".int-type", ".model-tag"],
      meta: [".model-tags .model-tag", "li"]
    }), "cols=3");
  }
  if (has("compare-grid")) {
    return shortcode("compare-grid", cardItems($, $el, ".compare-card,> div", {
      title: [".compare-card-title", ".title", "h3", "h4", "strong"],
      desc: [".compare-card-desc", "p"],
      tag: [".tag", ".label"],
      meta: [".compare-note", "li"]
    }), $el.children().length <= 2 ? "cols=2" : "cols=3");
  }
  if (has("columns-grid", "syntax-grid", "col-grid", "sp-sections")) {
    return shortcode("columns-grid", cardItems($, $el, ".column-card,.syntax-item,.col-item,.sp-section,> div", {
      title: [".col-title", ".syn-query", ".sp-section-title", "h3", "h4", "strong"],
      desc: [".syn-desc", ".sp-section-text", "p"],
      meta: [".syn-ex", ".col-note", "li"]
    }), $el.children().length <= 2 ? "cols=2" : "cols=3");
  }
  if (has("workflow-strip", "agent-flow", "actions-flow", "flow-demo", "flow-container", "workflow", "workflow-diagram")) {
    return shortcode("workflow-strip", cardItems($, $el, ".wf-step,.af-step,.flow-step,.action-step,.wf-node,.branch-row,> div", {
      icon: [".wf-icon", ".af-step-icon", ".as-icon"],
      title: [".wf-name", ".af-step-title", ".action-step span:first-child", "h3", "h4", "strong"],
      desc: [".wf-tool", ".af-step-desc", "p"],
      tag: [".step-badge", ".label"]
    }));
  }
  if (has("step-list", "auth-flow")) {
    return shortcode("step-list", cardItems($, $el, ".step-item,.step-card,.auth-step,> div", {
      title: [".step-title", ".step-header h3", ".auth-step h3", "h3", "h4"],
      desc: [".step-desc", ".step-body p", "p"],
      tag: [".step-badge", ".step-tag"]
    }));
  }
  if (has("tool-card", "service-block", "tool-block", "project-card")) {
    const metaParts = [];
    $el.find(".feat-item,.feature-item,.fi,.uc-item,.tip-item,.pin-item,.audio-feat,.style-pill,.checklist li,li").each((_, child) => {
      const $child = $(child);
      const title = pickText($, $child, [".feat-title", ".fi-title", ".feature-title", ".uc-title", ".tip-title", ".pin-title", "strong", "h3", "h4"]);
      const desc = pickText($, $child, [".feat-desc", ".fi-desc", ".feature-desc", ".uc-desc", ".tip-desc", ".pin-desc", "p"]);
      const text = title && desc ? `${title}: ${desc}` : (title || desc || norm($child.text()));
      if (text) metaParts.push(text);
    });
    const bodyText = textWithBreaks($, $el.find(".tc-body,.tool-body").first()[0] || null);
    return shortcode("tool-box", [{
      icon: pickText($, $el, [".tc-icon", ".tool-icon", ".service-logo", ".project-icon"]),
      title: pickText($, $el, [".tc-name", ".tool-name", ".service-title", ".project-title", "h3", "h4"]),
      tag: pickText($, $el, [".tc-badge", ".tool-badge", ".service-tag"]),
      desc: pickText($, $el, [".tc-sub", ".tool-tagline", ".service-subtitle", ".project-subtitle", "p"]),
      meta: metaParts.length ? metaParts.join("|") : (metaFromList($, $el, [".tc-list li", ".tool-card ul li", ".project-feature", "li"]) || bodyText)
    }]);
  }
  if (has("prompt-box")) {
    return shortcode("console-box", [{
      title: pickText($, $el, [".prompt-label"]) || "예시",
      desc: textWithBreaks($, $el.find(".prompt-content").first()[0] || el)
    }]);
  }
  if (has("cmd-block", "terminal")) {
    return shortcode("cmd-box", [{
      title: pickText($, $el, [".cmd-label", ".term-title"]) || "명령어",
      tag: pickText($, $el, [".cmd-lang"]) || "bash",
      desc: textWithBreaks($, $el.find("code,.cmd,.term-body").first()[0] || el)
    }]);
  }
  if (has("tip-box", "info-box", "info-tip", "info-warn", "info-success", "info-danger", "warn-box")) {
    const type = has("info-warn", "warn-box") ? "warn" : has("info-danger") ? "danger" : has("info-success") ? "success" : "tip";
    const title = pickText($, $el, ["strong", ".box-title", ".tip-title"]);
    const desc = textWithBreaks($, $el.clone().find("strong").remove().end()[0]);
    return shortcode(`alert-box ${type}`, [{ title, desc }]);
  }
  if (has("os-tabs")) {
    const items = [];
    const tabs = $el.find(".os-tab").toArray();
    const contents = $el.find(".os-content").toArray();
    const max = Math.max(tabs.length, contents.length);
    for (let i = 0; i < max; i++) {
      items.push({ title: tabs[i] ? norm($(tabs[i]).text()) : `탭 ${i + 1}`, desc: contents[i] ? convertChildren($, $(contents[i])).trim() : "" });
    }
    return shortcode("os-tabs", items);
  }
  if (has("faq-accordion", "faq-grid", "trouble-list")) {
    return shortcode("faq-list", cardItems($, $el, ".faq-item,.faq-card,.trouble-item,> div", {
      title: [".faq-q", ".q", ".trouble-q .q-text", "h3", "h4", "strong"],
      desc: [".faq-a", ".a", ".trouble-a p", "p"]
    }));
  }
  if (has("editor-sim")) {
    return shortcode("editor-box", [{
      title: pickText($, $el, [".editor-filename", ".editor-tab"]) || "code",
      tag: pickText($, $el, [".editor-tab"]) || "code",
      desc: textWithBreaks($, $el.find(".code-area,pre,code").first()[0] || el)
    }]);
  }
  if (has("graph-visual")) {
    const items = [];
    const main = pickText($, $el, [".node-main"]);
    if (main) items.push({ title: main });
    $el.find(".node").each((_, node) => {
      const title = norm($(node).text());
      if (title && title !== main) items.push({ title });
    });
    return shortcode("network-box", items);
  }
  if (has("flow-branches")) {
    return shortcode("git-flow-strip", cardItems($, $el, ".branch-row,> div", {
      title: [".branch-label", "h3", "h4", "strong"],
      tag: [".commit-label", ".tag"],
      meta: [".commit-line li", "li"]
    }));
  }
  if (has("stat-grid")) {
    return shortcode("stat-grid", cardItems($, $el, ".stat-box,.stat-item,.hero-stat,> div", {
      icon: [".stat-value", "strong"],
      title: [".stat-label", ".stat-name", "span"],
      desc: [".stat-sub", "p"]
    }), "cols=4");
  }
  return "";
}

function convertNode($, el) {
  if (!el || el.type === "comment") return "";
  if (el.type === "text") return norm(el.data);
  if (el.type !== "tag") return "";

  const tag = el.name.toLowerCase();
  const $el = $(el);
  if (["script", "style", "svg", "nav", "footer"].includes(tag)) return "";
  if ($el.hasClass("nav") || $el.hasClass("back-top") || $el.attr("id") === "backTop") return "";
  if ($el.hasClass("hero")) return "";

  const special = convertSpecial($, el);
  if (special) return special;

  if ($el.hasClass("section")) {
    const h = $el.find(".section-header h2,.section-title,> h2").first();
    const title = h.length ? cleanTitle(h.text()) : "";
    const $contentRoot = $el.children(".section-inner").first().length ? $el.children(".section-inner").first() : $el;
    const pieces = [];
    if (title) pieces.push(`# ${title}`);
    const sub = $contentRoot.children(".section-sub").first();
    if (sub.length) pieces.push(inlineMd($, sub[0]));
    $contentRoot.children().each((_, child) => {
      const $child = $(child);
      if ($child.hasClass("section-header") || $child.hasClass("section-num") || $child.hasClass("section-title") || $child.hasClass("section-sub")) return;
      if (/^h[1-6]$/i.test(child.name || "") && cleanTitle($(child).text()) === title) return;
      const part = convertNode($, child);
      if (part) pieces.push(part);
    });
    return pieces.join("\n\n");
  }
  if (tag === "main" || tag === "section" || tag === "article") return convertChildren($, $el);
  if (/^h[1-6]$/.test(tag)) {
    const level = Math.min(Number(tag[1]), 4);
    return `${"#".repeat(level)} ${cleanTitle(inlineMd($, el))}`;
  }
  if (tag === "p") return inlineMd($, el);
  if (tag === "ul" || tag === "ol") {
    const ordered = tag === "ol";
    const lines = [];
    $el.children("li").each((idx, li) => {
      const body = convertChildren($, $(li)).trim() || inlineMd($, li);
      lines.push(`${ordered ? `${idx + 1}.` : "-"} ${body.replace(/\n/g, "\n  ")}`);
    });
    return lines.join("\n");
  }
  if (tag === "table") return tableToMd($, el);
  if (tag === "pre") return `\`\`\`\n${norm($el.text())}\n\`\`\``;
  if (tag === "blockquote") return textWithBreaks($, el).split(/\r?\n/).map(line => `> ${line}`).join("\n");
  if (tag === "br") return "\n";

  return convertChildren($, $el);
}

function convertChildren($, $ctx) {
  const pieces = [];
  $ctx.contents().each((_, child) => {
    const part = convertNode($, child);
    if (part) pieces.push(part);
  });
  return pieces.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function frontmatter(meta) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        if (typeof item === "string") lines.push(`  - ${escapeYaml(item)}`);
        else {
          lines.push(`  - value: ${escapeYaml(item.value)}`);
          lines.push(`    label: ${escapeYaml(item.label)}`);
        }
      }
    } else {
      lines.push(`${key}: ${escapeYaml(value)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function convertFragmentToMd(fragment, meta) {
  const $ = load(`<div id="root">${fragment}</div>`, { decodeEntities: false });
  const root = $("#root");
  const h1 = cleanTitle(root.find("h1").first().text());
  const heroBadge = cleanTitle(root.find(".hero-badge").first().text());
  const heroStats = [];
  root.find(".hero-stat").each((_, el) => {
    const value = cleanTitle($(el).find("strong").first().text());
    const label = cleanTitle($(el).find("span").first().text());
    if (value || label) heroStats.push({ value, label });
  });
  const fm = {
    title: meta.title || h1,
    subtitle: meta.subtitle,
    badge: meta.badge || heroBadge,
    style: meta.style,
    stats: meta.stats || heroStats
  };
  const body = convertChildren($, root);
  return `${frontmatter(fm)}\n\n${body}\n`;
}

function extractBody(html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

function loadStandaloneData() {
  const html = fs.readFileSync(standalonePath, "utf8");
  const match = html.match(/<script id="appdata" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("appdata JSON not found in standalone file");
  return JSON.parse(match[1]);
}

function existingMdName(htmlFile) {
  const desired = htmlFile.replace(/\.html$/i, ".md");
  const lower = desired.toLowerCase();
  const existing = fs.existsSync(GUIDES_DIR)
    ? fs.readdirSync(GUIDES_DIR).find(name => name.toLowerCase() === lower)
    : null;
  return existing || desired;
}

function writeGuideMdFromStandalone(data) {
  const sourceFiles = new Set();
  for (const category of data.categories || []) {
    for (const guide of category.guides || []) {
      const content = data.guideContents?.[guide.slug];
      if (!content?.body) continue;
      sourceFiles.add(guide.file.toLowerCase());
      const outName = existingMdName(guide.file);
      const outPath = path.join(GUIDES_DIR, outName);
      const md = convertFragmentToMd(content.body, {
        title: cleanTitle(load(content.body).root().find("h1").first().text()) || guide.title,
        subtitle: guide.subtitle,
        style: category.id
      });
      fs.writeFileSync(outPath, md, "utf8");
      console.log(`restored guide: ${outName}`);
    }
  }
  return sourceFiles;
}

function writeExtraGuideMd(sourceFiles) {
  const guideHtmlDir = path.join(PUBLIC, "guides");
  for (const file of fs.readdirSync(guideHtmlDir).filter(f => f.endsWith(".html"))) {
    if (sourceFiles.has(file.toLowerCase())) continue;
    const html = fs.readFileSync(path.join(guideHtmlDir, file), "utf8");
    const body = extractBody(html);
    const $ = load(body, { decodeEntities: false });
    const title = cleanTitle($("h1").first().text()) || file.replace(/\.html$/i, "");
    const subtitle = cleanTitle($(".hero p").first().text());
    const outName = existingMdName(file);
    const md = convertFragmentToMd(body, { title, subtitle, style: "ai-dev" });
    fs.writeFileSync(path.join(GUIDES_DIR, outName), md, "utf8");
    console.log(`created extra guide: ${outName}`);
  }
}

function writeFolderMd(folderName, outDir) {
  const dir = path.join(PUBLIC, folderName);
  if (!fs.existsSync(dir)) return;
  ensureDir(outDir);
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const body = extractBody(html);
    const $ = load(body, { decodeEntities: false });
    const title = cleanTitle($("h1").first().text()) || file.replace(/\.html$/i, "");
    const subtitle = cleanTitle($(".hero p,.lead,.subtitle").first().text());
    const md = convertFragmentToMd(body, { title, subtitle, style: folderName === "vibecoding" ? "ai-dev" : "ai-chat" });
    const outName = file.replace(/\.html$/i, ".md");
    fs.writeFileSync(path.join(outDir, outName), md, "utf8");
    console.log(`created ${folderName}: ${outName}`);
  }
}

ensureDir(GUIDES_DIR);
const data = loadStandaloneData();
const sourceFiles = writeGuideMdFromStandalone(data);
writeExtraGuideMd(sourceFiles);
writeFolderMd("vibecoding", VIBE_DIR);
