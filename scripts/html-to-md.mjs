#!/usr/bin/env node
/**
 * html-to-md.mjs
 * HTML → Markdown 변환 (config/shortcode-map.json 기반 generic 변환 + 역변환 겸용)
 *
 * 사용법:
 *   node scripts/html-to-md.mjs <input.html> [output.md]
 *
 * Export:
 *   htmlToMdString(htmlPath) → string  (html-to-pptx.mjs 파이프라인에서 사용)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(__dirname, "../config");
const STYLES = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, "styles.json"), "utf8"));

// shortcode-map.json 로드 & 역방향 lookup 빌드
const SHORTCODE_MAP = JSON.parse(
  fs.readFileSync(path.join(CONFIG_DIR, "shortcode-map.json"), "utf8")
);
const CLASS_TO_SHORTCODE = {};
for (const [type, rule] of Object.entries(SHORTCODE_MAP)) {
  if (type.startsWith("$")) continue;
  for (const cls of (rule.htmlClasses || [])) {
    if (!CLASS_TO_SHORTCODE[cls]) CLASS_TO_SHORTCODE[cls] = { type, rule };
  }
}

// icon 기본값을 "•"로 채울 shortcode 타입
const ICON_DEFAULT_TYPES = new Set(["icon-grid", "feature-grid", "tool-list"]);

// ════════════════════════════════════════════════════════════════
//  유틸
// ════════════════════════════════════════════════════════════════

const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

function inlineToMd($, el) {
  let out = "";
  $(el).contents().each((_, n) => {
    if (n.type === "text") {
      out += n.data;
    } else if (n.type === "tag") {
      const tag = n.name.toLowerCase();
      const $n = $(n);
      const inner = inlineToMd($, n);
      switch (tag) {
        case "strong":
        case "b":    out += `**${inner.trim()}**`; break;
        case "code": out += `\`${$n.text()}\``; break;
        case "a":    out += `[${inner.trim()}](${$n.attr("href") || ""})`; break;
        default:     out += inner;
      }
    }
  });
  return out.trim();
}

function extractColor($, $el) {
  const HEX_RE = /#(?:[0-9a-fA-F]{3}){1,2}\b/;
  // 1. 본인 style 속성
  const own = ($el.attr("style") || "").match(HEX_RE);
  if (own) return own[0];
  // 2. data-color / data-bg 속성
  for (const attr of ["data-color", "data-bg", "data-accent"]) {
    const val = ($el.attr(attr) || "").trim();
    if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) return val.startsWith("#") ? val : "#" + val;
  }
  // 3. 직접 자식 요소의 style 속성 (icon, badge 등에 색상이 설정된 경우)
  let found = null;
  $el.children().each((_, child) => {
    if (!found) {
      const m = ($(child).attr("style") || "").match(HEX_RE);
      if (m) found = m[0];
    }
  });
  return found;
}

// 쉼표 구분 선택자를 순서대로 시도해 첫 번째 매칭 텍스트 반환
function pickText($, $ctx, selectors) {
  if (!selectors) return "";
  for (const sel of selectors.split(",").map(s => s.trim())) {
    if (!sel) continue;
    const found = $ctx.find(sel).first();
    if (found.length) return norm(found.text());
  }
  return "";
}

// meta 필드: li 아이템 수집 → pipe-separated / 단일 텍스트 반환
function pickMeta($, $ctx, selectors) {
  if (!selectors) return "";
  for (const sel of selectors.split(",").map(s => s.trim())) {
    if (!sel) continue;
    const found = $ctx.find(sel);
    if (!found.length) continue;
    const texts = found.map((_, n) => norm($(n).text())).get().filter(Boolean);
    if (texts.length > 1)  return texts.join("|");
    if (texts.length === 1) return texts[0];
  }
  return "";
}

// ════════════════════════════════════════════════════════════════
//  Generic shortcode 변환 (shortcode-map.json 기반)
// ════════════════════════════════════════════════════════════════

// 타이틀 앞 이모지 감지 정규식 (standardizeItem과 동일 범위)
const EMOJI_TITLE_RE = /^([✀-➿-‑-⛿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF])\s+(.*)/s;

function genericItemsToMd($, el, type, rule) {
  const lines = [`::: ${type}`];
  const { itemSelector, fields = {} } = rule;
  const fieldKeys = Object.keys(fields);
  const useIconDefault = ICON_DEFAULT_TYPES.has(type);

  // 아이템 찾기: 컨테이너 내부 → 없으면 el 자체 (단일 아이템)
  let $items = itemSelector ? $(el).find(itemSelector) : $(el).children();
  if ($items.length === 0) $items = $(el);

  $items.each((_, item) => {
    const $item = $(item);
    const color = extractColor($, $item);

    // 1단계: 모든 필드 값 수집
    const col = {};
    for (const key of fieldKeys) {
      if (key === "featured") continue;
      const sel = fields[key];
      if (key === "meta") {
        col[key] = pickMeta($, $item, sel);
      } else {
        col[key] = pickText($, $item, sel);
        if (key === "icon" && !col[key] && useIconDefault) col[key] = "•";
      }
    }

    // leaf-text fallback (자식 없는 요소, 예: wf-node)
    if (!Object.values(col).some(Boolean) && $item.children().length === 0) {
      const t = norm($item.text());
      if (t) col.title = t;
    }

    // 이모지-타이틀 분리: title이 이모지로 시작하고 icon이 미설정/"•"인 경우
    if (col.title && (!col.icon || col.icon === "•")) {
      const m = col.title.match(EMOJI_TITLE_RE);
      if (m && m[2]) { col.icon = m[1]; col.title = m[2]; }
    }

    // 2단계: lines 출력
    let started = false;
    for (const key of fieldKeys) {
      if (key === "featured") continue;
      const value = col[key];
      if (!value) continue;
      if (!started) { lines.push(`- ${key}: ${value}`); started = true; }
      else          { lines.push(`  ${key}: ${value}`); }
    }

    // featured 감지
    if (fields.featured) {
      const cls = $item.attr("class") || "";
      if (cls.includes("featured") || cls.includes("recommend") || $item.hasClass("plan-featured")) {
        lines.push(`  featured: "true"`);
      }
    }
    if (color) lines.push(`  color: "${color}"`);
  });

  lines.push(":::");
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
//  특수 핸들러
// ════════════════════════════════════════════════════════════════

// alert-box: typeMap으로 타입 결정, 요소 자체가 알림 박스
function alertBoxToMd($, el, rule) {
  const $el = $(el);
  const typeMap = rule.typeMap || {};
  const classes = ($el.attr("class") || "").split(/\s+/);
  let alertType = "tip";
  for (const cls of classes) {
    if (typeMap[cls]) { alertType = typeMap[cls]; break; }
  }

  const { fields = {} } = rule;

  // title: strong 태그 텍스트 (icon 포함) 분리 처리
  let icon = "", title = "", desc = "";

  // icon/title을 strong에서 같이 읽는 경우 처리
  const strongEl = $el.find("strong").first();
  if (strongEl.length) {
    const fullText = norm(strongEl.text());
    // 이모지 앞부분이 아이콘일 수 있음 (선택적)
    icon = "";
    title = fullText;
  } else {
    icon  = pickText($, $el, fields.icon || "");
    title = pickText($, $el, fields.title || "");
  }

  // desc: p 요소들 수집
  const descParts = [];
  $el.find("p").each((_, p) => {
    const t = norm($(p).text());
    if (t) descParts.push(t);
  });
  // p가 없으면 strong 이후 텍스트
  if (!descParts.length) {
    const cloned = $el.clone();
    cloned.find("strong").remove();
    const t = norm(cloned.text());
    if (t) descParts.push(t);
  }
  desc = descParts.join(" ");

  const lines = [`::: alert-box ${alertType}`];
  let started = false;
  if (icon)  { lines.push(`- icon: ${icon}`); started = true; }
  if (title) {
    if (!started) { lines.push(`- title: ${title}`); started = true; }
    else          { lines.push(`  title: ${title}`); }
  }
  if (desc)  {
    if (!started) { lines.push(`- desc: ${desc}`); started = true; }
    else          { lines.push(`  desc: ${desc}`); }
  }
  lines.push(":::");
  return lines.join("\n");
}

// tabs: .os-tab 버튼 + .os-content 패널 쌍
function tabsToMd($, el) {
  const $el = $(el);
  const labels = [];
  const contents = [];
  $el.find(".os-tab").each((_, t) => labels.push(norm($(t).text())));
  $el.find(".os-content").each((_, c) => contents.push(norm($(c).text())));
  const lines = ["::: tabs"];
  const max = Math.max(labels.length, contents.length);
  for (let i = 0; i < max; i++) {
    let started = false;
    if (labels[i]) { lines.push(`- title: ${labels[i]}`); started = true; }
    if (contents[i]) {
      if (!started) { lines.push(`- desc: ${contents[i]}`); started = true; }
      else          { lines.push(`  desc: ${contents[i]}`); }
    }
  }
  lines.push(":::");
  return lines.join("\n");
}

function commandBlockToMd($, el, rule) {
  const $el = $(el);
  let title = norm($el.find(".cmd-label, .term-title, .terminal-title").first().text()) || "Terminal";
  let lang = norm($el.find(".cmd-lang").first().text()) || "bash";
  
  let descParts = [];
  const bodyEl = $el.find(".terminal-body, code, .cmd").first();
  if (bodyEl.length) {
    bodyEl.find("div").each((_, div) => {
      descParts.push($(div).text());
    });
    if (!descParts.length) {
      descParts.push(bodyEl.text());
    }
  } else {
    descParts.push($el.text());
  }
  
  let desc = descParts.map(s => s.trim()).filter(s => s !== null && s !== undefined).join("\n");
  
  const lines = [`::: cmd-box`];
  lines.push(`- title: ${title}`);
  if (lang) lines.push(`  meta: ${lang}`);
  if (desc) {
    lines.push(`  desc: |`);
    desc.split("\n").forEach(line => {
      lines.push(`    ${line}`);
    });
  }
  lines.push(":::");
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
//  shortcode 디스패처
// ════════════════════════════════════════════════════════════════

function dispatchShortcode($, el, lines) {
  const $el = $(el);
  const classes = ($el.attr("class") || "").split(/\s+/).filter(Boolean);

  for (const cls of classes) {
    const match = CLASS_TO_SHORTCODE[cls];
    if (!match) continue;
    const { type, rule } = match;

    switch (type) {
      case "alert-box":
        lines.push(alertBoxToMd($, el, rule), ""); return true;
      case "os-tabs":
        lines.push(tabsToMd($, el), ""); return true;
      case "cmd-box":
        lines.push(commandBlockToMd($, el, rule), ""); return true;
      default:
        lines.push(genericItemsToMd($, el, type, rule), ""); return true;
    }
  }
  return false;
}

// 래퍼 div 패턴 (자식만 재귀 처리)
const WRAPPER_PATTERN = /\b(grid-\d|tool-matrix|card-row|two-col|layout-\w+)\b/;

// 자식 클래스 기반 shortcode 자동 감지 (예: grid-3 > model-card → feature-grid)
function detectShortcodeByChildren($, el) {
  const $children = $(el).children();
  if ($children.length < 2) return null;
  const firstClass = ($(el).children().first().attr("class") || "").split(/\s+/).filter(Boolean);
  for (const [type, rule] of Object.entries(SHORTCODE_MAP)) {
    if (type.startsWith("$") || !rule.itemSelector) continue;
    for (const sel of rule.itemSelector.split(",").map(s => s.trim())) {
      if (!sel.startsWith(".")) continue;
      const cls = sel.slice(1);
      if (firstClass.includes(cls)) {
        const matchCount = $children.filter((_, c) => $(c).hasClass(cls)).length;
        if (matchCount >= 2) return { type, rule };
      }
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
//  일반 HTML 요소 처리
// ════════════════════════════════════════════════════════════════

function processElement($, el, lines) {
  const $el = $(el);
  const tag  = (el.tagName || el.name || "").toLowerCase();

  // 네비게이션/헤더/장식 요소 무시
  if ($el.hasClass("section-header") || $el.hasClass("nav") || $el.hasClass("nav-inner")) return;
  if ($el.hasClass("section-num") || $el.hasClass("toc-section") || $el.hasClass("toc")) return;  // 섹션 번호 뱃지, 목차 차단
  if ($el.hasClass("what-visual") || $el.hasClass("typing-cursor")) return;
  if ($el.hasClass("sp-browser-bar") || $el.hasClass("sp-dots") || $el.hasClass("sp-dot") || $el.hasClass("sp-url") || $el.hasClass("sp-query") || $el.hasClass("sp-title")) return; // Sparkpage 데모 장식 제거
  if (tag === "h2" && $el.hasClass("section-title")) return;  // section-inner 내 중복 h2
  if (tag === "nav" || tag === "footer" || tag === "a" && $el.hasClass("back-top")) return;

  // 1. shortcode-map 기반 dispatch (최우선)
  if (tag === "div" || tag === "section" || tag === "ul" || tag === "ol") {
    if (dispatchShortcode($, el, lines)) return;
  }

  // 2. build-guide 역변환용 카드 박스
  if ($el.hasClass("card")) {
    const rawTitle = norm($el.find(".card-title").first().text());
    if (rawTitle) lines.push(`## ${rawTitle}`, "");
    $el.children().not(".card-title").each((_, child) => processElement($, child, lines));
    return;
  }

  // 3. 래퍼 div → 자식 shortcode 감지 or 재귀
  if (tag === "div" && WRAPPER_PATTERN.test($el.attr("class") || "")) {
    const detected = detectShortcodeByChildren($, el);
    if (detected) {
      lines.push(genericItemsToMd($, el, detected.type, detected.rule), "");
    } else {
      $el.children().each((_, child) => processElement($, child, lines));
    }
    return;
  }

  // 4. 표준 마크다운 요소
  switch (tag) {
    case "p": {
      const text = inlineToMd($, el);
      if (text) lines.push(text, "");
      return;
    }
    case "h2": {
      const t = norm($el.text());
      if (t) lines.push(`## ${t}`, "");
      return;
    }
    case "label": {
      const t = norm($el.text());
      if (t) lines.push(`**${t}**`, "");
      return;
    }
    case "strong":
    case "b": {
      const t = norm($el.text());
      if (t) lines.push(`**${t}**`, "");
      return;
    }
    case "span": {
      const t = norm($el.text());
      if (t) lines.push(t, "");
      return;
    }
    case "h3": lines.push(`### ${norm($el.text())}`, ""); return;
    case "h4": lines.push(`#### ${norm($el.text())}`, ""); return;
    case "ul":
      $el.find("> li").each((_, li) => lines.push(`- ${inlineToMd($, li)}`));
      lines.push("");
      return;
    case "ol":
      $el.find("> li").each((i, li) => lines.push(`${i + 1}. ${inlineToMd($, li)}`));
      lines.push("");
      return;
    case "blockquote":
      lines.push(`> ${norm($el.text())}`, "");
      return;
    case "pre": {
      const code = $el.find("code");
      const lang = (code.attr("class") || "").replace(/language-/, "");
      lines.push(`\`\`\`${lang}`, code.text() || $el.text(), "```", "");
      return;
    }
    case "table": {
      const headers = $el.find("tr").first().find("th, td")
        .map((_, td) => norm($(td).text())).get();
      if (headers.length) {
        lines.push(`| ${headers.join(" | ")} |`);
        lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
        $el.find("tr").slice(1).each((_, tr) => {
          const cells = $(tr).find("td").map((_, td) => norm($(td).text())).get();
          lines.push(`| ${cells.join(" | ")} |`);
        });
        lines.push("");
      }
      return;
    }
    case "div":
    case "section": {
      // 리프 div (직접 텍스트만 있는 경우) → 단락
      const hasChildElements = $el.children().length > 0;
      if (!hasChildElements) {
        const text = norm($el.text());
        if (text) lines.push(text, "");
      } else {
        $el.children().each((_, child) => processElement($, child, lines));
      }
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  메인 변환 함수 (export)
// ════════════════════════════════════════════════════════════════

export function htmlToMdString(inFile) {
  const html = fs.readFileSync(inFile, "utf8");
  const $ = load(html);

  // frontmatter 추출
  const title    = norm($("title").text());
  const subtitle = norm($(".hero p, .hero-desc").first().text());

  // logo: .hero-logo 우선(.hero-logo는 단순 이모지), 없으면 .nav-logo 첫 토큰
  const heroLogoEl = $(".hero-logo").first();
  const navLogoEl  = $(".nav-logo").first();
  const logoRaw    = heroLogoEl.length ? norm(heroLogoEl.text()) : norm(navLogoEl.text());
  const logo       = logoRaw ? logoRaw.split(/\s+/)[0] : "";

  // badge: .hero-badge에서 빈 <span> 제거 후 텍스트
  const badgeEl = $(".hero-badge").first();
  const badge   = badgeEl.length
    ? norm(badgeEl.clone().find("span").remove().end().text())
    : "";

  // heroCta: a.hero-cta
  const ctaEl  = $("a.hero-cta").first();
  const heroCta = ctaEl.length
    ? { label: norm(ctaEl.text()), url: ctaEl.attr("href") || "" }
    : null;

  // CSS :root --brand 색상으로 styles.json 키 자동 감지
  const css = $("style").text();
  const brandMatch = css.match(/--brand:\s*(#[0-9A-Fa-f]{6})/);
  const brandColor = brandMatch ? brandMatch[1].toLowerCase() : "";
  const style = Object.keys(STYLES).find(
    k => k !== "$comment" && STYLES[k].brand?.toLowerCase() === brandColor
  ) || "ai-chat";

  // hero stats 추출
  const stats = [];
  $(".hero-stat").each((_, s) => {
    const value = norm($(s).find("strong").text());
    const label = norm($(s).find("span").text());
    if (value) stats.push({ value, label });
  });

  // done 섹션 추출
  const doneEl = $(".done-section").first();
  let done = null;
  if (doneEl.length) {
    const doneTitle    = norm(doneEl.find("h2").first().text());
    const doneSub      = norm(doneEl.find("p").first().text());
    const doneLinkEl   = doneEl.find("a.done-link, a").first();
    const doneCtaLabel = norm(doneLinkEl.text());
    const doneCtaUrl   = doneLinkEl.attr("href") || "";
    if (doneTitle) done = { title: doneTitle, subtitle: doneSub, ctaLabel: doneCtaLabel, ctaUrl: doneCtaUrl };
  }

  // footer 추출 (a → markdown link 변환)
  const footerItems = [];
  $("footer").first().find("div, p").each((_, node) => {
    let text = "";
    $(node).contents().each((_, n) => {
      if (n.type === "text") text += n.data;
      else if (n.type === "tag" && n.name === "a") {
        const $a = $(n);
        text += `[${$a.text()}](${$a.attr("href") || ""})`;
      }
    });
    const t = norm(text);
    if (t) footerItems.push(t);
  });

  const esc = (s) => (s || "").replace(/"/g, '\\"');
  // 특수문자 포함 시 따옴표 필요
  const ystr = (s) => /[:#\[\]{}&*!]/.test(s) ? `"${esc(s)}"` : s;

  const lines = [
    "---",
    `title: ${ystr(title)}`,
    `subtitle: ${ystr(subtitle)}`,
    ...(logo  ? [`logo: ${ystr(logo)}`]   : []),
    ...(badge ? [`badge: ${ystr(badge)}`] : []),
    `style: ${style}`,
  ];
  if (heroCta) {
    lines.push("heroCta:");
    lines.push(`  label: ${ystr(heroCta.label)}`);
    lines.push(`  url: ${heroCta.url}`);
  }
  if (stats.length) {
    lines.push("stats:");
    stats.forEach(s => {
      lines.push(`  - value: "${esc(s.value)}"`);
      lines.push(`    label: "${esc(s.label)}"`);
    });
  }
  if (done) {
    lines.push("done:");
    lines.push(`  title: ${ystr(done.title)}`);
    if (done.subtitle)  lines.push(`  subtitle: ${ystr(done.subtitle)}`);
    if (done.ctaLabel)  lines.push(`  ctaLabel: ${ystr(done.ctaLabel)}`);
    if (done.ctaUrl)    lines.push(`  ctaUrl: ${done.ctaUrl}`);
  }
  if (footerItems.length) {
    lines.push("footer:");
    footerItems.forEach(fi => lines.push(`  - ${ystr(fi)}`));
  }
  lines.push("---", "");

  // section 처리
  $(".section").each((i, sec) => {
    const $sec    = $(sec);
    const secTitle = norm($sec.find(".section-header h2").first().text())
                   || norm($sec.find("h2.section-title").first().text());
    const secNumEl = $sec.find(".section-num").first();
    const secNum   = norm(secNumEl.find(".num").text())
                   || norm(secNumEl.text()).split(/\s+/)[0]
                   || String(i + 1);
    if (secTitle) lines.push(`# ${secNum}. ${secTitle}`, "");

    $sec.children().not(".section-header").each((_, child) => {
      processElement($, child, lines);
    });
  });

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
//  CLI
// ════════════════════════════════════════════════════════════════

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const inFile  = process.argv[2];
  const outFile = process.argv[3];
  if (!inFile) {
    console.error("사용법: node scripts/html-to-md.mjs <파일.html> [출력.md]");
    process.exit(1);
  }
  const md = htmlToMdString(path.resolve(inFile));
  const dest = outFile
    ? path.resolve(outFile)
    : path.resolve(inFile).replace(/\.html?$/, ".md");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, md, "utf8");
  console.log(`✅ 변환 완료: ${dest}`);
}
