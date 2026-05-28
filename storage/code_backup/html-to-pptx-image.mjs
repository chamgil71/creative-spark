#!/usr/bin/env node

import { chromium } from "playwright";
import PptxGenJS from "pptxgenjs";
import path from "path";

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

async function main(input, output) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1600, height: 1200 });

  await page.goto("file://" + path.resolve(input), {
    waitUntil: "networkidle"
  });

  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: "CUSTOM",
    width: SLIDE_W,
    height: SLIDE_H
  });
  pptx.layout = "CUSTOM";

  const sections = await page.$$(".section");

  if (sections.length === 0) {
    console.error("❌ .section 없음 → 전체 페이지 캡처로 fallback");

    const full = await page.screenshot({ fullPage: true });

    const slide = pptx.addSlide();
    slide.addImage({
      data: "data:image/png;base64," + full.toString("base64"),
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H
    });

  } else {

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];

      // 화면 안으로 스크롤
      await sec.scrollIntoViewIfNeeded();

      const box = await sec.boundingBox();

      if (!box || box.width < 10 || box.height < 10) {
        console.warn("⚠️ skip empty section", i);
        continue;
      }

      const imgBuffer = await page.screenshot({
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.max(10, box.width),
          height: Math.max(10, box.height)
        }
      });

      const slide = pptx.addSlide();

      slide.addImage({
        data: "data:image/png;base64," + imgBuffer.toString("base64"),
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H
      });
    }
  }

  await browser.close();
  await pptx.writeFile({ fileName: output });

  console.log("✅ 완료:", output);
}

// 실행
const input = process.argv[2];
const output = process.argv[3] || "output.pptx";

if (!input) {
  console.error("Usage: node html-to-pptx-images.mjs input.html output.pptx");
  process.exit(1);
}

main(input, output);