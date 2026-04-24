import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";

export type Section = {
  num: string;        // "1", "2", ... or "" for intro
  title: string;      // h2 text
  bullets: string[];  // top-level points / paragraphs
};

export type ParsedGuide = {
  docTitle: string;   // h1
  subtitle: string;
  sections: Section[];
};

const cleanText = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();

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