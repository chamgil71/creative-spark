#!/usr/bin/env node
/**
 * html-to-pptx.mjs
 * HTML → PPTX 파이프라인 (HTML → MD → PPTX 체인)
 *
 * 사용법:
 *   node scripts/html-to-pptx.mjs public/guides/Supabase.html
 *   node scripts/html-to-pptx.mjs public/guides/Supabase.html --out dist-pptx/Supabase.pptx
 *   node scripts/html-to-pptx.mjs public/guides/Supabase.html --style ai-dev --verbose
 *   node scripts/html-to-pptx.mjs --all "public/guides/*.html"
 *
 * 옵션:
 *   --out <path>     출력 .pptx 경로 (기본: dist-pptx/<이름>.pptx)
 *   --style <key>    styles.json 색상 프리셋 강제 지정
 *   --no-cover       표지 슬라이드 생성 안 함
 *   --verbose        상세 로그 출력
 *   --all            위치 인수를 glob 패턴으로 처리
 */
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";

import { htmlToMdString } from "../templates/html-to-md.mjs";
import { convertMdToPptx } from "./md-to-pptx.mjs";

// ════════════════════════════════════════════════════════════════
//  메인 변환 함수 (export)
// ════════════════════════════════════════════════════════════════

export async function convertHtmlToPptx(htmlPath, opts = {}) {
  const absHtml = resolve(htmlPath);
  const name = basename(absHtml, extname(absHtml));

  // 1. HTML → MD (임시 파일)
  const md = htmlToMdString(absHtml);
  const tempPath = join(tmpdir(), `_html2pptx_${name}_${Date.now()}.md`);
  writeFileSync(tempPath, md, "utf8");

  // 2. MD → PPTX
  const outPath = opts.out || join("dist-pptx", `${name}.pptx`);
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  try {
    await convertMdToPptx(tempPath, { ...opts, out: outPath });
  } finally {
    unlinkSync(tempPath);
  }
  return outPath;
}

// ════════════════════════════════════════════════════════════════
//  CLI 진입점
// ════════════════════════════════════════════════════════════════

function parseCLI(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all")      { flags.all = true; }
    else if (a === "--no-cover") { flags.noCover = true; }
    else if (a === "--verbose")  { flags.verbose = true; }
    else if (a === "--out")  { flags.out = argv[++i]; }
    else if (a === "--style") { flags.style = argv[++i]; }
    else if (!a.startsWith("--")) positional.push(a);
  }
  return { positional, ...flags };
}

const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const args = parseCLI(process.argv.slice(2));

  if (!args.positional.length) {
    console.error([
      "사용법:",
      "  node scripts/html-to-pptx.mjs <input.html> [--out path.pptx] [--style key] [--no-cover] [--verbose]",
      "  node scripts/html-to-pptx.mjs --all \"public/guides/*.html\"",
    ].join("\n"));
    process.exit(1);
  }

  const convOpts = { out: args.out || null, styleOverride: args.style || null, noCover: !!args.noCover, verbose: !!args.verbose };

  if (args.all) {
    for (const pattern of args.positional) {
      const files = [];
      for await (const f of glob(pattern)) files.push(f);
      if (!files.length) { console.warn(`매칭 파일 없음: ${pattern}`); continue; }
      for (const f of files) await convertHtmlToPptx(resolve(f), { ...convOpts, out: null });
    }
  } else {
    for (const htmlPath of args.positional) {
      await convertHtmlToPptx(resolve(htmlPath), convOpts);
    }
  }
}
