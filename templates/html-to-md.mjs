#!/usr/bin/env node
/**
 * HTML → Markdown 역변환 스크립트
 *
 * 용도: public/guides/*.html 파일을 build-guide.mjs가 다시 처리할 수 있는
 *       템플릿 형태의 .md 로 변환합니다. 100% 완벽한 복원이 아니라
 *       "수작업 편집의 출발점"을 만들어주는 도구입니다.
 *
 * 사용법:
 *   node templates/html-to-md.mjs <input.html> [output.md]
 * 예:
 *   node templates/html-to-md.mjs public/guides/Supabase.html templates/Supabase.md
 *
 * 변환 규칙:
 *   .hero                → frontmatter (title, subtitle, badge, logo, stats, heroCta)
 *   .done-section        → frontmatter done 블록
 *   footer > div         → frontmatter footer 배열
 *   CSS --brand 변수      → styles.json 키로 스타일 자동 감지
 *   section.section      → # N. 제목  (section-header > h2 기반)
 *   .card                → ## 카드제목 + 내부 요소 재귀 순회
 *   .icon-grid           → ::: icon-grid shortcode 복원
 *   .feature-grid        → ::: feature-grid shortcode 복원
 *   .step-list           → ::: steps shortcode 복원
 *   .compare-grid        → ::: compare-grid shortcode 복원
 *   <p>                  → 문단
 *   <ul>/<ol>            → 목록 (체크박스 포함)
 *   <blockquote>         → > 인용
 *   <pre><code>          → ``` 코드 블록
 *   <table>              → 마크다운 표
 *   .terminal            → ```bash 코드 블록
 *
 * 변환 후 반드시 사람이 검토/정리해야 합니다 (일부 필드 누락 가능).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { glob } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = JSON.parse(fs.readFileSync(path.join(__dirname, "styles.json"), "utf8"));

// ---------- 유틸 ----------
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

function inlineToMd($, el) {
  let out = "";
  $(el).contents().each((_, n) => {
    if (n.type === "text") {
      out += n.data.replace(/\s+/g, " ");
    } else if (n.type === "tag") {
      const tag = n.name.toLowerCase();
      const $n = $(n);
      const inner = inlineToMd($, n);
      switch (tag) {
        case "br": out += "\n"; break;
        case "strong":
        case "b":   out += `**${inner.trim()}**`; break;
        case "em":
        case "i":   out += `*${inner.trim()}*`; break;
        case "code":
        case "kbd": out += `\`${$n.text()}\``; break;
        case "a": {
          const href = $n.attr("href") || "";
          out += href ? `[${inner.trim()}](${href})` : inner;
          break;
        }
        case "span": out += inner; break;
        case "img": {
          const alt = $n.attr("alt") || "";
          const src = $n.attr("src") || "";
          out += `![${alt}](${src})`;
          break;
        }
        default: out += inner;
      }
    }
  });
  return out;
}

function tableToMd($, table) {
  const rows = [];
  $(table).find("tr").each((_, tr) => {
    const cells = [];
    $(tr).find("th,td").each((__, td) => cells.push(norm(inlineToMd($, td))));
    if (cells.length) rows.push(cells);
  });
  if (!rows.length) return "";
  const header = rows[0];
  const sep = header.map(() => "---");
  const fmt = (r) => `| ${r.join(" | ")} |`;
  return [fmt(header), fmt(sep), ...rows.slice(1).map(fmt)].join("\n");
}

function codeBlockFromTerminal($, term) {
  const title = $(term).find(".terminal-title").first().text().trim();
  const lang = /\.ya?ml/.test(title) ? "yaml"
             : /\.json/.test(title) ? "json"
             : /\.(js|ts)/.test(title) ? "js"
             : "bash";
  const body = $(term).find(".terminal-body").first();
  const text = body.text().replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").trim();
  return `\`\`\`${lang}\n${title ? `# ${title}\n` : ""}${text}\n\`\`\``;
}

// ---------- 숏코드 역변환 ----------
function iconGridToMd($, el) {
  const lines = ["::: icon-grid"];
  $(el).find(".icon-card").each((_, card) => {
    const $c = $(card);
    const icon  = norm($c.find(".icon-card-icon").text());
    const title = norm($c.find(".icon-card-title").text());
    const desc  = norm($c.find("p").text());
    lines.push(`- icon: ${icon}`, `  title: ${title}`, `  desc: ${desc}`);
  });
  lines.push(":::");
  return lines.join("\n");
}

function featureGridToMd($, el) {
  const lines = ["::: feature-grid"];
  // standard: .feature-card  |  legacy: .feat-item (디자인/영상), .feature-item (이미지생성ai)
  $(el).find(".feature-card, .feat-item, .feature-item").each((_, card) => {
    const $c = $(card);
    const tagVal   = norm($c.find(".feature-tag").text());
    const titleFull = norm($c.find(".feature-card-title, .feat-title, .fi-title").first().text());
    const desc     = norm($c.find("p, .feat-desc, .fi-desc").first().text());
    // legacy files may have a separate icon element
    const legacyIcon = norm($c.find(".feat-icon, .fi-icon").first().text());

    // feature-card-title = "icon title" — 비 ASCII 문자로 시작하면 icon/title 분리
    const firstCode = titleFull.codePointAt(0) ?? 0;
    let icon = "", title = titleFull;
    if (firstCode > 127) {
      const spaceIdx = titleFull.indexOf(" ");
      if (spaceIdx > -1) {
        icon  = titleFull.slice(0, spaceIdx).trim();
        title = titleFull.slice(spaceIdx + 1).trim();
      }
    }

    // use legacyIcon if title-split didn't yield one
    if (!icon && legacyIcon) icon = legacyIcon;

    let started = false;
    if (tagVal) { lines.push(`- tag: ${tagVal}`); started = true; }
    if (icon)   { lines.push(started ? `  icon: ${icon}` : `- icon: ${icon}`); started = true; }
    lines.push(started ? `  title: ${title}` : `- title: ${title}`);
    lines.push(`  desc: ${desc}`);
  });
  lines.push(":::");
  return lines.join("\n");
}

function stepListToMd($, el) {
  const lines = ["::: steps"];
  $(el).find(".step-item").each((_, item) => {
    const $i  = $(item);
    // standard: .step-title  |  legacy: .step-content strong
    const title = norm($i.find(".step-title, .step-content strong").first().text());
    // standard: p  |  legacy: .step-content span
    const desc  = norm($i.find("p, .step-content span").first().text());
    lines.push(`- title: ${title}`, `  desc: ${desc}`);
  });
  lines.push(":::");
  return lines.join("\n");
}

function toolCardToMd($, el) {
  // supports .tool-card (new), .tool-block, .service-block (legacy)
  const $h = $(el).find(".tc-header, .tool-header, .service-header").first();
  if (!$h.length) return "::: tool-card\n:::";
  const icon    = norm($h.find(".tc-icon, .tool-logo, .service-logo").first().text());
  const name    = norm($h.find(".tc-name, .tool-name, .service-title").first().text());
  const tagline = norm($h.find(".tc-sub, .tool-tagline, .service-subtitle").first().text());
  const badge   = norm($h.find(".tc-badge, .tool-badge").first().text());
  const style   = $h.attr("style") || "";
  const colorMatch = style.match(/#([0-9a-fA-F]{6})/);
  const color   = colorMatch ? `"#${colorMatch[1]}"` : "";
  const lines   = ["::: tool-card"];
  lines.push(`- icon: ${icon}`, `  name: ${name}`);
  if (tagline) lines.push(`  tagline: ${tagline}`);
  if (badge)   lines.push(`  badge: ${badge}`);
  if (color)   lines.push(`  color: ${color}`);
  lines.push(":::");
  return lines.join("\n");
}

function workflowToMd($, el) {
  const lines = ["::: workflow"];
  $(el).find(".wf-step").each((_, step) => {
    const $s  = $(step);
    const icon = norm($s.find(".wf-icon").text());
    const name = norm($s.find(".wf-name").text());
    const tool = norm($s.find(".wf-tool").text());
    lines.push(`- icon: ${icon}`, `  name: ${name}`);
    if (tool) lines.push(`  tool: ${tool}`);
  });
  lines.push(":::");
  return lines.join("\n");
}

function compareGridToMd($, el) {
  const lines = ["::: compare-grid"];
  $(el).find(".compare-card").each((_, card) => {
    const $c   = $(card);
    const title = norm($c.find(".compare-card-title").text());
    const desc  = norm($c.find("p").first().text());
    const note  = norm($c.find(".compare-note").text());
    lines.push(`- title: ${title}`, `  desc: ${desc}`);
    if (note) lines.push(`  note: ${note}`);
  });
  lines.push(":::");
  return lines.join("\n");
}

// ---------- 요소 → MD 변환 (재귀) ----------
function processElement($, el, lines) {
  const $el = $(el);
  const tag = (el.tagName || "").toLowerCase();

  // section-header / 섹션 번호 박스는 이미 # 제목으로 출력했으므로 스킵
  if ($el.hasClass("section-header") || $el.hasClass("section-num")) return;
  // 카드 제목(h3.card-title)은 .card 핸들러에서 ## 로 출력하므로 스킵
  if ($el.hasClass("card-title")) return;

  // ── shortcode 역변환 ──────────────────────────────────────
  if ($el.hasClass("icon-grid"))    { lines.push(iconGridToMd($, el),    ""); return; }
  if ($el.hasClass("feature-grid") || $el.hasClass("feature-cards") || $el.hasClass("feat-grid"))
                                    { lines.push(featureGridToMd($, el), ""); return; }
  if ($el.hasClass("step-list"))    { lines.push(stepListToMd($, el),    ""); return; }
  if ($el.hasClass("compare-grid")) { lines.push(compareGridToMd($, el), ""); return; }
  if ($el.hasClass("tool-card") || $el.hasClass("tool-block") || $el.hasClass("service-block"))
                                    { lines.push(toolCardToMd($, el),    ""); return; }
  if ($el.hasClass("workflow-strip"))  { lines.push(workflowToMd($, el),   ""); return; }

  // ── .card → ## 제목 + 내부 재귀 ──────────────────────────
  if ($el.hasClass("card")) {
    const cardTitle = norm($el.find("h3.card-title").first().text());
    if (cardTitle) lines.push(`## ${cardTitle}`, "");
    $el.children().each((_, child) => processElement($, child, lines));
    return;
  }

  // ── .terminal → 코드 블록 ────────────────────────────────
  if ($el.hasClass("terminal")) { lines.push(codeBlockFromTerminal($, el), ""); return; }

  // ── 표준 태그 ────────────────────────────────────────────
  if (tag === "table") { lines.push(tableToMd($, el), ""); return; }
  if (tag === "h2")    { lines.push(`## ${norm($el.text())}`, ""); return; }
  if (tag === "h3")    { lines.push(`### ${norm($el.text())}`, ""); return; }
  if (tag === "h4")    { lines.push(`#### ${norm($el.text())}`, ""); return; }

  if (tag === "p") {
    const txt = norm(inlineToMd($, el));
    if (txt) lines.push(txt, "");
    return;
  }

  if (tag === "ul") {
    $el.find("> li").each((_, li) => {
      const $li = $(li);
      const checkbox = $li.find('input[type="checkbox"]');
      if (checkbox.length) {
        const checked = checkbox.attr("checked") !== undefined;
        const liText  = norm(inlineToMd($, li)).replace(/^\[.]\s*/, "");
        lines.push(`- [${checked ? "x" : " "}] ${liText}`);
      } else {
        lines.push(`- ${norm(inlineToMd($, li))}`);
      }
    });
    lines.push("");
    return;
  }

  if (tag === "ol") {
    $el.find("> li").each((i, li) => lines.push(`${i + 1}. ${norm(inlineToMd($, li))}`));
    lines.push("");
    return;
  }

  if (tag === "blockquote") {
    $el.find("p").each((_, p) => lines.push(`> ${norm(inlineToMd($, p))}`));
    lines.push("");
    return;
  }

  if (tag === "pre") {
    const codeEl  = $el.find("code").first();
    const langMatch = (codeEl.attr("class") || "").match(/language-(\w+)/);
    const lang    = langMatch?.[1] ?? "";
    lines.push(`\`\`\`${lang}`, codeEl.text().trimEnd(), "```", "");
    return;
  }

  if (tag === "hr") { lines.push("---", ""); return; }

  // border-left inline style → blockquote tip
  if (/border-left/.test($el.attr("style") || "")) {
    const t  = norm($el.find("strong").first().text());
    const pEl = $el.find("p").first();
    const p  = pEl.length ? norm(inlineToMd($, pEl[0])) : norm(inlineToMd($, el));
    lines.push(`> ${t ? `**${t}** ` : ""}${p}`, "");
    return;
  }

  // 일반 div: 자식 재귀
  if (tag === "div") {
    $el.children().each((_, child) => processElement($, child, lines));
    return;
  }

  const txt = norm(inlineToMd($, el));
  if (txt) lines.push(txt, "");
}

// ---------- 변환 함수 ----------
function convertHtmlToMd(inFile, outFileArg) {
  const html = fs.readFileSync(inFile, "utf8");
  const $ = load(html);

// ── 메타데이터 추출 ──────────────────────────────────────────
const title    = norm($("title").text()) || norm($(".hero h1").text());
const subtitle = norm($(".hero p").first().text());
const badge    = norm($(".hero-badge").first().text());
const logo     = norm($(".hero-logo").first().text()) || "🤖";

const stats = [];
$(".hero-stat").each((_, el) => {
  const value = norm($(el).find("strong").text());
  const label = norm($(el).find("span").text());
  if (value || label) stats.push({ value, label });
});

const heroCta = (() => {
  const a = $(".hero-cta").first();
  return a.length ? { label: norm(a.text()), url: a.attr("href") || "" } : null;
})();

const done = (() => {
  const sec = $(".done-section").first();
  if (!sec.length) return null;
  const a = sec.find("a").first();
  return {
    title:    norm(sec.find("h2").text()),
    subtitle: norm(sec.find("p").first().text()),
    ctaLabel: norm(a.text()),
    ctaUrl:   a.attr("href") || "",
  };
})();

// footer: build-guide.mjs는 배열이면 각 줄을 <div>로 렌더링
const footerLines = [];
$("footer > div").each((_, div) => footerLines.push(norm(inlineToMd($, div))));
if (!footerLines.length) {
  // 이전 HTML 형식 (footer p) 폴백
  $("footer p").each((_, p) => footerLines.push(norm(inlineToMd($, p))));
}

// ── 스타일 감지: CSS --brand 변수 → styles.json 키 ───────────
const css = $("style").text();
const brandMatch = css.match(/--brand:\s*(#[0-9A-Fa-f]{6})/);
const brandColor = brandMatch?.[1]?.toLowerCase();
const brandToStyleKey = Object.fromEntries(
  Object.entries(STYLES)
    .filter(([k]) => !k.startsWith("$"))
    .map(([k, v]) => [v.brand.toLowerCase(), k])
);
const style = brandToStyleKey[brandColor] ?? "ai-chat";

// ── frontmatter YAML 직렬화 ──────────────────────────────────
const toYaml = (obj, indent = 0) => {
  const pad = "  ".repeat(indent);
  return Object.entries(obj)
    .map(([k, v]) => {
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return null;
      if (Array.isArray(v)) {
        const items = v.map((item) => {
          if (typeof item === "object") {
            const sub = Object.entries(item)
              .map(([kk, vv]) => `${pad}    ${kk}: ${JSON.stringify(vv)}`)
              .join("\n");
            return `${pad}  -\n${sub}`;
          }
          return `${pad}  - ${JSON.stringify(item)}`;
        }).join("\n");
        return `${pad}${k}:\n${items}`;
      }
      if (typeof v === "object") {
        const sub = Object.entries(v)
          .map(([kk, vv]) => `${pad}  ${kk}: ${JSON.stringify(vv)}`)
          .join("\n");
        return `${pad}${k}:\n${sub}`;
      }
      return `${pad}${k}: ${JSON.stringify(v)}`;
    })
    .filter(Boolean)
    .join("\n");
};

const frontmatter = toYaml({
  title, subtitle, style, badge, logo, heroCta, stats,
  done,
  footer: footerLines.length ? footerLines : null,
});

// ── 본문 변환 ────────────────────────────────────────────────
const bodyLines = [];
let sectionNum = 0;

$("section.section, div.section").each((_, sec) => {
  const $sec    = $(sec);
  const $header = $sec.find(".section-header").first();

  // section-header > h2 우선; 없으면 직접 자식 h2
  const h2 = $header.length
    ? $header.find("h2").first()
    : $sec.children("h2").first();
  if (!h2.length) return;

  sectionNum++;
  const titleText = norm(h2.text());
  // 혹시 h2에 "N. 제목" 형식이 이미 포함된 경우 번호 제거
  const m = titleText.match(/^\d+\.\s*(.+)$/);
  bodyLines.push(`# ${sectionNum}. ${m ? m[1] : titleText}`, "");

  $sec.children().each((__, child) => {
    const $c = $(child);
    // section-header 와 bare h2는 이미 # 제목으로 출력했으므로 스킵
    if ($c.is($header) || $c.is(h2)) return;
    processElement($, child, bodyLines);
  });
});

// 연속 빈 줄 3개 이상 → 2개로 정리
const body = bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();

  const out = `---\n${frontmatter}\n---\n\n${body}\n`;

  const outFile = outFileArg
    || path.join("templates", path.basename(inFile).replace(/\.html?$/i, ".md"));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, out, "utf8");
  console.log(`✅ ${inFile}\n   → ${outFile}`);
  console.log(`   섹션 ${sectionNum}개, 통계 ${stats.length}개, 스타일: ${style} (${STYLES[style]?.label ?? "unknown"})`);
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const flags = { all: false };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--all")      { flags.all = true; continue; }
  if (a.startsWith("--")) {
    const key = a.slice(2);
    flags[key] = (!argv[i + 1] || argv[i + 1].startsWith("--")) ? true : argv[++i];
  } else {
    positional.push(a);
  }
}

if (!positional.length) {
  console.error([
    "사용법:",
    "  node templates/html-to-md.mjs <input.html> [output.md]",
    "  node templates/html-to-md.mjs --all \"public/guides/*.html\"",
    "  node templates/html-to-md.mjs --all \"public/guides/*.html\" --out-dir mddata",
  ].join("\n"));
  process.exit(1);
}

if (flags.all) {
  const outDir = flags["out-dir"] || "mddata";
  const files = [];
  for (const pattern of positional) {
    for await (const f of glob(pattern)) files.push(f);
  }
  if (!files.length) {
    console.warn("매칭 파일 없음:", positional.join(", "));
    process.exit(0);
  }
  for (const f of files) {
    const outFile = path.join(outDir, path.basename(f).replace(/\.html?$/i, ".md"));
    try {
      convertHtmlToMd(f, outFile);
    } catch (e) {
      console.error(`❌ ${f}: ${e.message}`);
    }
  }
  console.log(`\n⚠️  변환된 .md 는 그대로 쓰지 말고 검토/정리한 뒤 build-guide.mjs 로 다시 빌드하세요.`);
} else {
  convertHtmlToMd(positional[0], positional[1] || null);
  console.log(`\n⚠️  변환된 .md 는 그대로 쓰지 말고 한 번 검토/정리한 뒤 build-guide.mjs 로 다시 빌드하세요.`);
}
