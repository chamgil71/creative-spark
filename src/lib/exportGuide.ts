import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";

/* =========================================================
 *  PDF — 브라우저 인쇄 사용 (원본 디자인 100% 유지, 텍스트 검색 가능)
 * ========================================================= */

export function printGuideIframe(iframe: HTMLIFrameElement, docTitle: string) {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) throw new Error("가이드 문서를 불러오지 못했습니다.");

  const STYLE_ID = "__guide-print-style__";
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media print {
        @page { size: A4; margin: 12mm; }
        html, body {
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section, .card, .model-card, .feature-card, .tool-card,
        .tip-card, .step, table, pre, blockquote, figure {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
      }
    `;
    doc.head.appendChild(style);
  }

  const prevTitle = doc.title;
  doc.title = `${docTitle} 가이드`;
  try {
    win.focus();
    win.print();
  } finally {
    setTimeout(() => { doc.title = prevTitle; }, 1000);
  }
}

/* =========================================================
 *  PPTX — 가이드 전체를 캡처해 16:9 슬라이드로 분할
 * ========================================================= */

const SLIDE_W_IN = 13.333;
const SLIDE_H_IN = 7.5;
const DPI = 96;

export async function exportIframeToPptx(
  iframe: HTMLIFrameElement,
  docTitle: string,
  fileName: string,
) {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("가이드 문서를 불러오지 못했습니다.");

  const target = (doc.body || doc.documentElement) as HTMLElement;
  const captureWidth = Math.round(SLIDE_W_IN * DPI); // 1280
  const slicePxH = Math.round(SLIDE_H_IN * DPI);     // 720

  const prevWidth = target.style.width;
  const prevMaxWidth = target.style.maxWidth;
  target.style.width = `${captureWidth}px`;
  target.style.maxWidth = `${captureWidth}px`;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      windowWidth: captureWidth,
      width: captureWidth,
      scale: 1.5,
      useCORS: true,
      logging: false,
    });
  } finally {
    target.style.width = prevWidth;
    target.style.maxWidth = prevMaxWidth;
  }

  const scale = canvas.width / captureWidth;
  const sliceH = Math.round(slicePxH * scale);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  // 표지
  const cover = pres.addSlide();
  cover.background = { color: "0F172A" };
  cover.addShape("rect", {
    x: 0.5, y: 3.0, w: 0.18, h: 1.5,
    fill: { color: "6366F1" }, line: { color: "6366F1" },
  });
  cover.addText(docTitle, {
    x: 0.9, y: 3.0, w: 11.5, h: 1.0,
    fontSize: 48, bold: true, color: "FFFFFF", fontFace: "Arial",
  });
  cover.addText("AI 가이드 허브", {
    x: 0.9, y: 4.1, w: 11.5, h: 0.5,
    fontSize: 16, color: "94A3B8", fontFace: "Arial",
  });

  const totalSlices = Math.max(1, Math.ceil(canvas.height / sliceH));

  for (let i = 0; i < totalSlices; i++) {
    const sy = i * sliceH;
    const sh = Math.min(sliceH, canvas.height - sy);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

    const dataUrl = sliceCanvas.toDataURL("image/jpeg", 0.9);
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data: dataUrl,
      x: 0, y: 0, w: SLIDE_W_IN, h: SLIDE_H_IN,
    });
    slide.addText(`${i + 1} / ${totalSlices}`, {
      x: SLIDE_W_IN - 1.2, y: SLIDE_H_IN - 0.35, w: 1.0, h: 0.25,
      fontSize: 9, color: "94A3B8", align: "right", fontFace: "Arial",
    });
  }

  await pres.writeFile({ fileName });
}

/* ========== 레거시 호환 (다른 곳에서 import해도 빌드되도록) ========== */

export type Section = { num: string; title: string; bullets: string[] };
export type ParsedGuide = { docTitle: string; subtitle: string; sections: Section[] };

const cleanText = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();

export function parseGuideHtml(html: string): ParsedGuide {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    docTitle: cleanText(doc.querySelector("h1")?.textContent || "가이드"),
    subtitle: cleanText(doc.querySelector(".subtitle, .lead, header p")?.textContent || ""),
    sections: [],
  };
}
