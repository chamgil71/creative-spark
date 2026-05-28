#!/usr/bin/env node

/**
 * HTML → PPTX 변환기 (Playwright ONLY - 완성형)
 * 디자인 유지율 90% 목표
 */

import { chromium } from "playwright";
import PptxGenJS from "pptxgenjs";
import path from "path";

/* =========================
   설정
========================= */

const PX_TO_IN = 1 / 96;
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const MARGIN_X = 0.5;
const TITLE_Y = 0.3;
const BODY_TOP = 1.0;
const BODY_BOTTOM = 7.0;

/* =========================
   유틸
========================= */

function pxToIn(px) {
  return px * PX_TO_IN;
}

function rgbToHex(rgb) {
  if (!rgb) return "FFFFFF";
  const m = rgb.match(/\d+/g);
  if (!m) return "FFFFFF";
  return m
    .slice(0, 3)
    .map(v => (+v).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/* =========================
   핵심: 렌더링 추출
========================= */

async function extractLayout(filePath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 성능 최적화
  await page.route("**/*", route => {
    const type = route.request().resourceType();
    if (["image", "font", "media"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto("file://" + path.resolve(filePath), {
    waitUntil: "networkidle"
  });

  const data = await page.evaluate(() => {

    function isVisible(el) {
      const r = el.getBoundingClientRect();
      return r.width > 30 && r.height > 20;
    }

    function extractBlocks(section) {

        const BLOCK_SELECTORS = [
            ".card",
            ".plan-card",
            ".gpt-tool",
            ".mt-item",
            ".feature-item",
            ".block-card"
        ];

        let elements = Array.from(
            section.querySelectorAll(BLOCK_SELECTORS.join(","))
        );

        // fallback: 카드 없으면 텍스트 그룹
        if (elements.length === 0) {
            elements = Array.from(section.querySelectorAll("p, li, h3"));
        }

        return elements.map(el => {
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);

            return {
            text: el.innerText, // 👉 핵심: 내부 전체 텍스트
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
            bg: s.backgroundColor,
            color: s.color,
            border: s.borderColor,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight
            };
        })
        .sort((a, b) => a.y - b.y || a.x - b.x);
        }

    return Array.from(document.querySelectorAll(".section")).map(sec => {
      const rect = sec.getBoundingClientRect();

      return {
        title:
          sec.querySelector("h2")?.innerText ||
          sec.querySelector("h1")?.innerText ||
          "",
        baseX: rect.x,
        baseY: rect.y,
        blocks: extractBlocks(sec)
      };
    });
  });

  await browser.close();
  return data;
}

/* =========================
   PPT 렌더링
========================= */

function renderPPT(sections, output) {
  const pptx = new PptxGenJS();

  pptx.defineLayout({
    name: "CUSTOM",
    width: SLIDE_W,
    height: SLIDE_H
  });
  pptx.layout = "CUSTOM";

  sections.forEach(section => {
    let slide = pptx.addSlide();

    // 제목
    slide.addText(section.title, {
      x: MARGIN_X,
      y: TITLE_Y,
      w: SLIDE_W - MARGIN_X * 2,
      h: 0.5,
      fontSize: 24,
      bold: true
    });

    let currentY = BODY_TOP;

    section.blocks.forEach(b => {
      const h = pxToIn(b.h);

      // 슬라이드 분할
      if (currentY + h > BODY_BOTTOM) {
        slide = pptx.addSlide();
        currentY = BODY_TOP;
      }

      const x = pxToIn(b.x - section.baseX) + MARGIN_X;
      const y = currentY;
      const w = pxToIn(b.w);

      // 박스
      if (b.bg && b.bg !== "rgba(0, 0, 0, 0)") {
        slide.addShape(pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          fill: { color: rgbToHex(b.bg) },
          line: { color: rgbToHex(b.border) }
        });
      }

      // 텍스트
      if (b.text) {
        slide.addText(b.text, {
          x: x + 0.05,
          y: y + 0.05,
          w: w - 0.1,
          h: h - 0.1,
          fontSize: parseInt(b.fontSize) || 12,
          color: rgbToHex(b.color),
          bold: b.fontWeight > 500,
          valign: "top"
        });
      }

      currentY += h + 0.1;
    });
  });

  return pptx.writeFile({ fileName: output });
}

/* =========================
   실행
========================= */

async function main() {
  const input = process.argv[2];
  const output =
    process.argv[3] ||
    input.replace(".html", "") + "-final.pptx";

  if (!input) {
    console.error("Usage: node html-to-pptx-playwright.mjs input.html");
    process.exit(1);
  }

  console.log("🔍 Extracting layout...");
  const sections = await extractLayout(input);

  console.log("📊 Rendering PPT...");
  await renderPPT(sections, output);

  console.log("✅ Done:", output);
}

main();