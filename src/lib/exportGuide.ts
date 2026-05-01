import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";

/* =========================================================
 *  PDF — 브라우저 인쇄 사용 (원본 디자인 100% 유지, 텍스트 검색 가능)
 * ========================================================= */

/**
 * iframe에 로드된 가이드 HTML을 그대로 인쇄 다이얼로그로 띄웁니다.
 * 사용자가 "PDF로 저장"을 선택하면 원본과 동일한 디자인의 PDF가 생성됩니다.
 */
export function printGuideIframe(iframe: HTMLIFrameElement, docTitle: string) {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) throw new Error("가이드 문서를 불러오지 못했습니다.");

  // 인쇄 전용 스타일 1회 주입 (배경/그라디언트 보존, 페이지 여백 등)
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
        /* 카드/섹션이 페이지 중간에 잘리지 않도록 */
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

  // 문서 제목을 PDF 파일명 기본값으로 활용
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

const SLIDE_W_IN = 13.333; // LAYOUT_WIDE
const SLIDE_H_IN = 7.5;
const DPI = 96;            // CSS px per inch (html2canvas 기준)

/**
 * iframe 내부의 가이드 본문을 통째로 캔버스에 캡처한 뒤,
 * 16:9 슬라이드 높이 단위로 잘라 여러 슬라이드에 이미지로 배치합니다.
 * → 원본 색상/카드/표/그라디언트가 그대로 유지됩니다.
 */
export async function exportIframeToPptx(
  iframe: HTMLIFrameElement,
  docTitle: string,
  fileName: string,
) {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("가이드 문서를 불러오지 못했습니다.");

  const target = (doc.body || doc.documentElement) as HTMLElement;
  // 캡처용 가로폭: 슬라이드 비율에 맞춤 (1280px ≈ 13.333in @ 96dpi)
  const captureWidth = Math.round(SLIDE_W_IN * DPI * 1); // 1280
  const slicePxH = Math.round(SLIDE_H_IN * DPI * 1);     // 720

  // 원본 너비 백업 후 캡처용 너비로 임시 고정 (반응형 가이드 대응)
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

  // 캔버스가 scale 적용된 크기이므로 슬라이스 높이도 비례
  const scale = canvas.width / captureWidth;
  const sliceH = Math.round(slicePxH * scale);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  // 표지 슬라이드
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
    sliceCanvas.height = sliceH; // 항상 동일 높이 → 16:9 유지
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
    // 작은 페이지 번호
    slide.addText(`${i + 1} / ${totalSlices}`, {
      x: SLIDE_W_IN - 1.2, y: SLIDE_H_IN - 0.35, w: 1.0, h: 0.25,
      fontSize: 9, color: "94A3B8", align: "right", fontFace: "Arial",
    });
  }

  await pres.writeFile({ fileName });
}

/* =========================================================
 *  레거시 파서 (다른 곳에서 import 시 깨지지 않도록 최소 유지)
 * ========================================================= */

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

/** Pull readable text out of an arbitrary element, preserving paragraph breaks. */
function elementToBullets(el: Element): string[] {
  const out: string[] = [];
  // Prefer structured atoms: list items, cards, table rows, paragraphs.
  const atomSelectors = [
    "li",
    ".model-card",
    ".feature-card",
    ".tool-card",
    ".tip-card",
    ".card",
    ".step",
    ".item",
    "tr",
    "p",
    "blockquote",
  ];
  const atoms = el.querySelectorAll<HTMLElement>(atomSelectors.join(","));

  if (atoms.length > 0) {
    const seen = new Set<string>();
    atoms.forEach((node) => {
      // Skip nested atoms (already covered by parent atom)
      if (node.closest(".model-card, .feature-card, .tool-card, .tip-card, .card, .step, .item") !== node &&
          node.parentElement?.closest(".model-card, .feature-card, .tool-card, .tip-card, .card, .step, .item")) {
        // it's nested inside another atom — skip; parent will capture
        const parentAtom = node.parentElement?.closest(
          ".model-card, .feature-card, .tool-card, .tip-card, .card, .step, .item"
        );
        if (parentAtom && parentAtom !== node) return;
      }
      const t = cleanText(node.textContent || "");
      if (!t || t.length < 2) return;
      if (seen.has(t)) return;
      seen.add(t);
      out.push(t);
    });
  } else {
    const t = cleanText(el.textContent || "");
    if (t) out.push(t);
  }

  // Cap very long bullets
  return out.map((b) => (b.length > 280 ? b.slice(0, 277) + "…" : b)).slice(0, 14);
}

export function parseGuideHtml(html: string): ParsedGuide {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const docTitle = cleanText(doc.querySelector("h1")?.textContent || "가이드");
  const subtitle = cleanText(
    doc.querySelector(".subtitle, .lead, header p")?.textContent || ""
  );

  const sections: Section[] = [];

  // Strategy A: explicit .section blocks (most guides use this)
  const sectionEls = doc.querySelectorAll(".section");
  if (sectionEls.length > 0) {
    sectionEls.forEach((sec) => {
      const numEl = sec.querySelector(".section-num, .num, .step-num");
      const h2 = sec.querySelector("h2, h3");
      const num = cleanText(numEl?.textContent || "");
      const title = cleanText(h2?.textContent || "");
      if (!title) return;
      // Build a clone without the header so bullets don't include the title text
      const clone = sec.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".section-header, .section-num, h2, h3").forEach((n) => n.remove());
      const bullets = elementToBullets(clone);
      sections.push({ num, title, bullets });
    });
  }

  // Strategy B: fallback — group by h2 siblings
  if (sections.length === 0) {
    const h2s = Array.from(doc.querySelectorAll("h2"));
    h2s.forEach((h2, i) => {
      const title = cleanText(h2.textContent || "");
      if (!title) return;
      // Collect siblings until next h2
      const wrap = document.createElement("div");
      let n: Element | null = h2.nextElementSibling;
      while (n && n.tagName !== "H2") {
        wrap.appendChild(n.cloneNode(true));
        n = n.nextElementSibling;
      }
      sections.push({
        num: String(i + 1),
        title,
        bullets: elementToBullets(wrap),
      });
    });
  }

  return { docTitle, subtitle, sections };
}

/* ----------------------- PPTX ----------------------- */

export async function exportToPptx(parsed: ParsedGuide, fileName: string) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in

  const ACCENT = "6366F1";
  const DARK = "0F172A";
  const MUTED = "64748B";
  const BG = "FFFFFF";

  // Cover slide
  const cover = pres.addSlide();
  cover.background = { color: DARK };
  cover.addShape("rect", { x: 0, y: 3.2, w: 0.6, h: 1.1, fill: { color: ACCENT }, line: { color: ACCENT } });
  cover.addText(parsed.docTitle, {
    x: 0.9, y: 3.0, w: 11.5, h: 1.2,
    fontSize: 54, bold: true, color: "FFFFFF", fontFace: "Arial",
  });
  if (parsed.subtitle) {
    cover.addText(parsed.subtitle, {
      x: 0.9, y: 4.3, w: 11.5, h: 0.8,
      fontSize: 20, color: "CBD5E1", fontFace: "Arial",
    });
  }
  cover.addText("AI 가이드 허브", {
    x: 0.9, y: 6.7, w: 11.5, h: 0.4,
    fontSize: 12, color: MUTED, fontFace: "Arial",
  });

  // Section slides
  parsed.sections.forEach((sec, i) => {
    const slide = pres.addSlide();
    slide.background = { color: BG };

    // Number badge
    const numLabel = sec.num || String(i + 1);
    slide.addShape("ellipse", {
      x: 0.5, y: 0.5, w: 0.9, h: 0.9,
      fill: { color: ACCENT }, line: { color: ACCENT },
    });
    slide.addText(numLabel, {
      x: 0.5, y: 0.5, w: 0.9, h: 0.9,
      fontSize: 28, bold: true, color: "FFFFFF",
      align: "center", valign: "middle", fontFace: "Arial",
    });

    // Title
    slide.addText(sec.title, {
      x: 1.6, y: 0.5, w: 11.2, h: 0.9,
      fontSize: 30, bold: true, color: DARK,
      valign: "middle", fontFace: "Arial",
    });

    // Divider
    slide.addShape("line", {
      x: 0.5, y: 1.55, w: 12.3, h: 0,
      line: { color: "E2E8F0", width: 1 },
    });

    // Body bullets
    if (sec.bullets.length > 0) {
      slide.addText(
        sec.bullets.map((b) => ({
          text: b,
          options: { bullet: { code: "25CF" }, breakLine: true },
        })),
        {
          x: 0.7, y: 1.85, w: 12.0, h: 5.2,
          fontSize: 16, color: DARK, fontFace: "Arial",
          paraSpaceAfter: 8, valign: "top",
        },
      );
    } else {
      slide.addText("(내용 없음)", {
        x: 0.7, y: 1.85, w: 12.0, h: 5.2,
        fontSize: 14, color: MUTED, italic: true, fontFace: "Arial",
      });
    }

    // Footer
    slide.addText(`${parsed.docTitle}`, {
      x: 0.5, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Arial",
    });
    slide.addText(`${i + 1} / ${parsed.sections.length}`, {
      x: 11.5, y: 7.05, w: 1.3, h: 0.3, fontSize: 10, color: MUTED,
      align: "right", fontFace: "Arial",
    });
  });

  await pres.writeFile({ fileName });
}

/* ----------------------- PDF ----------------------- */

export function exportToPdf(parsed: ParsedGuide, fileName: string) {
  // Landscape A4-ish, in points: 842 x 595
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;

  // Use built-in helvetica which supports Latin only; for Korean we render via canvas fallback per page.
  // Strategy: render each slide onto an offscreen canvas with proper Korean fonts, then add as image.
  const renderSlideToCanvas = (drawer: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const scale = 2;
    const w = Math.round(pageW * scale);
    const h = Math.round(pageH * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageW, pageH);
    drawer(ctx, pageW, pageH);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const koFont =
    '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] => {
    const lines: string[] = [];
    let line = "";
    for (const ch of text) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // Cover
  const coverImg = renderSlideToCanvas((ctx, w, h) => {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6366F1";
    ctx.fillRect(margin, h / 2 - 40, 8, 80);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold 44px ${koFont}`;
    ctx.textBaseline = "middle";
    ctx.fillText(parsed.docTitle, margin + 24, h / 2 - 10);
    if (parsed.subtitle) {
      ctx.fillStyle = "#CBD5E1";
      ctx.font = `18px ${koFont}`;
      ctx.fillText(parsed.subtitle, margin + 24, h / 2 + 30);
    }
    ctx.fillStyle = "#64748B";
    ctx.font = `12px ${koFont}`;
    ctx.fillText("AI 가이드 허브", margin, h - margin);
  });
  pdf.addImage(coverImg, "JPEG", 0, 0, pageW, pageH);

  parsed.sections.forEach((sec, i) => {
    pdf.addPage();
    const img = renderSlideToCanvas((ctx, w, h) => {
      // Header
      const numLabel = sec.num || String(i + 1);
      ctx.fillStyle = "#6366F1";
      ctx.beginPath();
      ctx.arc(margin + 22, margin + 22, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold 22px ${koFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(numLabel, margin + 22, margin + 24);

      ctx.fillStyle = "#0F172A";
      ctx.font = `bold 26px ${koFont}`;
      ctx.textAlign = "left";
      ctx.fillText(sec.title, margin + 60, margin + 26);

      // Divider
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, margin + 60);
      ctx.lineTo(w - margin, margin + 60);
      ctx.stroke();

      // Bullets
      ctx.fillStyle = "#0F172A";
      ctx.font = `14px ${koFont}`;
      ctx.textBaseline = "top";
      const bodyX = margin + 16;
      const bodyW = w - margin * 2 - 16;
      let y = margin + 80;
      const lineH = 20;
      const maxY = h - margin - 30;
      for (const b of sec.bullets) {
        if (y > maxY) {
          ctx.fillStyle = "#64748B";
          ctx.fillText("…", bodyX, y);
          break;
        }
        // bullet dot
        ctx.fillStyle = "#6366F1";
        ctx.beginPath();
        ctx.arc(margin + 4, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0F172A";
        const lines = wrapText(ctx, b, bodyW);
        for (const ln of lines) {
          if (y > maxY) break;
          ctx.fillText(ln, bodyX, y);
          y += lineH;
        }
        y += 6;
      }

      // Footer
      ctx.fillStyle = "#64748B";
      ctx.font = `10px ${koFont}`;
      ctx.fillText(parsed.docTitle, margin, h - margin + 8);
      ctx.textAlign = "right";
      ctx.fillText(`${i + 1} / ${parsed.sections.length}`, w - margin, h - margin + 8);
    });
    pdf.addImage(img, "JPEG", 0, 0, pageW, pageH);
  });

  pdf.save(fileName);
}