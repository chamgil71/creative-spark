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
 *   node templates/html-to-md.mjs public/guides/github.html templates/Github.md
 *
 * 변환 규칙:
 *   <h1>          → # 1. 제목 (섹션 자동 번호)  *hero h1 은 frontmatter title 로*
 *   <h2>          → ## 제목
 *   <h3>          → ### 제목
 *   <p>           → 문단
 *   <ul><li>      → - 항목
 *   <ol><li>      → 1. 항목
 *   <table>       → 마크다운 표
 *   <pre><code>   → ``` 코드 블록 ```
 *   <code>        → `inline`
 *   <strong>/<b>  → **굵게**
 *   <em>/<i>      → *기울임*
 *   <a href>      → [text](url)
 *   <blockquote>  → > 인용
 *   <br>          → 줄바꿈
 *   .terminal     → ```bash 코드 블록
 *   .feature-card → ## 카드제목 + 본문 + (태그)
 *   .tip 박스     → > 이모지 **제목** \n > 본문
 *
 * 변환 후 반드시 사람이 검토/정리해야 합니다 (스타일 키, 통계, hero CTA 등).
 */

import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

// ---------- 유틸 ----------
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

function inlineToMd($, el) {
  // 자식 노드를 순회하며 인라인 마크다운으로 변환
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
        case "b": out += `**${inner.trim()}**`; break;
        case "em":
        case "i": out += `*${inner.trim()}*`; break;
        case "code": out += `\`${$n.text()}\``; break;
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
  const body = rows.slice(1);
  const sep = header.map(() => "---");
  const fmt = (r) => `| ${r.join(" | ")} |`;
  return [fmt(header), fmt(sep), ...body.map(fmt)].join("\n");
}

function codeBlockFromTerminal($, term) {
  // .terminal 안의 .terminal-body 텍스트를 코드로 추출
  const title = $(term).find(".terminal-title").first().text().trim();
  const lang = /\.ya?ml/.test(title) ? "yaml"
             : /\.json/.test(title) ? "json"
             : /\.(js|ts)/.test(title) ? "js"
             : "bash";
  const body = $(term).find(".terminal-body").first();
  const text = body.text().replace(/\u00A0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
  return `\`\`\`${lang}\n${title ? `# ${title}\n` : ""}${text}\n\`\`\``;
}

// ---------- 메인 ----------
const [, , inFile, outFileArg] = process.argv;
if (!inFile) {
  console.error("사용법: node templates/html-to-md.mjs <input.html> [output.md]");
  process.exit(1);
}

const html = fs.readFileSync(inFile, "utf8");
const $ = load(html);

// 메타데이터 추출
const title = norm($("title").text()) || norm($(".hero h1").text());
const subtitle = norm($(".hero p").first().text());
const badge = norm($(".hero-badge").first().text());
const stats = [];
$(".hero-stat, .hero-stats > div").each((_, el) => {
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
    title: norm(sec.find("h2").text()),
    subtitle: norm(sec.find("p").first().text()),
    ctaLabel: norm(a.text()),
    ctaUrl: a.attr("href") || "",
  };
})();

const footerLines = [];
$("footer p").each((_, p) => footerLines.push(norm(inlineToMd($, p))));

// 스타일 키 추정 (색상 기반)
const css = $("style").text();
let style = "ai-dev";
if (/--gh-dark|#3FB950/i.test(css)) style = "ai-dev";
else if (/#10A37F/i.test(css)) style = "ai-chat";
else if (/#6366F1/i.test(css)) style = "knowledge";
else if (/#1565C0/i.test(css)) style = "productivity";
else if (/#9B59B6/i.test(css)) style = "creative";

// frontmatter 작성
const yaml = (obj, indent = 0) => {
  const pad = "  ".repeat(indent);
  return Object.entries(obj).map(([k, v]) => {
    if (v == null || v === "") return null;
    if (Array.isArray(v)) {
      const lines = v.map((item) => {
        if (typeof item === "object") {
          const sub = Object.entries(item).map(([kk, vv]) => `${pad}    ${kk}: ${JSON.stringify(vv)}`).join("\n");
          return `${pad}  -\n${sub}`;
        }
        return `${pad}  - ${JSON.stringify(item)}`;
      }).join("\n");
      return `${pad}${k}:\n${lines}`;
    }
    if (typeof v === "object") {
      const sub = Object.entries(v).map(([kk, vv]) => `${pad}  ${kk}: ${JSON.stringify(vv)}`).join("\n");
      return `${pad}${k}:\n${sub}`;
    }
    return `${pad}${k}: ${JSON.stringify(v)}`;
  }).filter(Boolean).join("\n");
};

const frontmatter = yaml({
  title,
  subtitle,
  style,
  badge,
  logo: "🐙",
  heroCta,
  stats,
  done,
  footer: footerLines,
});

// 본문(섹션) 변환
let bodyMd = "";
let sectionNum = 0;
$("section.section, section[id]").each((_, sec) => {
  const $sec = $(sec);
  const h2 = $sec.find(".section-title, h2").first();
  if (!h2.length) return;
  sectionNum += 1;
  bodyMd += `\n# ${sectionNum}. ${norm(h2.text())}\n\n`;

  const sub = $sec.find(".section-sub, .section > p").first();
  if (sub.length) bodyMd += `${norm(inlineToMd($, sub))}\n\n`;

  // 섹션 내부 요소 순서대로 처리
  $sec.find(".section-inner > *, .section > *").each((__, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();

    if ($el.hasClass("section-num") || $el.hasClass("section-title") || $el.hasClass("section-sub")) return;

    if ($el.hasClass("terminal")) {
      bodyMd += codeBlockFromTerminal($, el) + "\n\n";
      return;
    }

    if ($el.hasClass("feature-grid") || $el.hasClass("feature-cards")) {
      $el.find(".feature-card, .card").each((___, card) => {
        const $c = $(card);
        const t = norm($c.find("h3,h4").first().text());
        const p = norm(inlineToMd($, $c.find("p").first()));
        const tag = norm($c.find(".feature-tag,.tag,.badge").first().text());
        const icon = norm($c.find(".fi,.icon").first().text());
        bodyMd += `## ${t}\n\n${icon ? icon + " " : ""}${p}${tag ? ` **(${tag})**` : ""}\n\n`;
      });
      return;
    }

    if (tag === "table" || $el.find("> table").length) {
      const t = tag === "table" ? el : $el.find("> table")[0];
      bodyMd += tableToMd($, t) + "\n\n";
      return;
    }

    if (tag === "h3") { bodyMd += `## ${norm($el.text())}\n\n`; return; }
    if (tag === "h4") { bodyMd += `### ${norm($el.text())}\n\n`; return; }
    if (tag === "p")  { bodyMd += `${norm(inlineToMd($, el))}\n\n`; return; }
    if (tag === "ul") {
      $el.find("> li").each((___, li) => {
        bodyMd += `- ${norm(inlineToMd($, li))}\n`;
      });
      bodyMd += "\n";
      return;
    }
    if (tag === "ol") {
      $el.find("> li").each((i, li) => {
        bodyMd += `${i + 1}. ${norm(inlineToMd($, li))}\n`;
      });
      bodyMd += "\n";
      return;
    }

    // border-left 가 있는 박스 = 팁 박스
    const style = $el.attr("style") || "";
    if (/border-left/.test(style)) {
      const t = norm($el.find("strong").first().text());
      const p = norm(inlineToMd($, $el.find("p").first()));
      bodyMd += `> ${t ? `**${t}**\n> ` : ""}${p}\n\n`;
      return;
    }

    // 그 외 div: 안의 텍스트만
    const txt = norm(inlineToMd($, el));
    if (txt) bodyMd += `${txt}\n\n`;
  });
});

const out = `---\n${frontmatter}\n---\n${bodyMd}`;

const outFile = outFileArg
  || path.join("templates", path.basename(inFile).replace(/\.html?$/i, ".md"));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out, "utf8");
console.log(`✅ ${inFile}\n   → ${outFile}`);
console.log(`   섹션 ${sectionNum}개, 통계 ${stats.length}개, 추정 스타일: ${style}`);
console.log(`\n⚠️  변환된 .md 는 그대로 쓰지 말고 한 번 검토/정리한 뒤 build-guide.mjs 로 다시 빌드하세요.`);
