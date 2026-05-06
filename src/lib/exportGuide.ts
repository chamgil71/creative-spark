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
const SLIDE_PX_W = Math.round(SLIDE_W_IN * DPI); // 1280
const SLIDE_PX_H = Math.round(SLIDE_H_IN * DPI); // 720

/** 섹션 한 개를 16:9 슬라이드 한 장에 맞춰 그린다(가로 폭 채움, 세로는 비율 유지). */
function fitToSlide(srcCanvas: HTMLCanvasElement): string {
  const out = document.createElement("canvas");
  out.width = SLIDE_PX_W;
  out.height = SLIDE_PX_H;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  // 가로 폭에 맞춰 비례 스케일
  const ratio = out.width / srcCanvas.width;
  const drawH = srcCanvas.height * ratio;

  if (drawH <= out.height) {
    // 세로가 슬라이드보다 짧음 → 상단 정렬, 아래 흰 여백
    ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height,
                  0, 0, out.width, drawH);
  } else {
    // 세로가 더 김 → 슬라이드 높이에 맞춰 추가 축소(비례 유지, 가운데 정렬)
    const ratio2 = out.height / srcCanvas.height;
    const drawW2 = srcCanvas.width * ratio2;
    const dx = (out.width - drawW2) / 2;
    ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height,
                  dx, 0, drawW2, out.height);
  }
  return out.toDataURL("image/jpeg", 0.9);
}

export async function exportIframeToPptx(
  iframe: HTMLIFrameElement,
  docTitle: string,
  fileName: string,
) {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) throw new Error("가이드 문서를 불러오지 못했습니다.");

  // 가이드 본문 폭을 1280px로 강제 (캡처 동안만)
  const body = doc.body as HTMLElement;
  const prevWidth = body.style.width;
  const prevMaxWidth = body.style.maxWidth;
  body.style.width = `${SLIDE_PX_W}px`;
  body.style.maxWidth = `${SLIDE_PX_W}px`;

  // 분할 단위: hero / section / done-section. 없으면 body 전체.
  let sections = Array.from(
    doc.querySelectorAll<HTMLElement>(
      "section.hero, section.section, section.done-section",
    ),
  );
  if (sections.length === 0) sections = [body];

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

  try {
    const total = sections.length;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      // 섹션을 1280px 폭으로 캡처
      const canvas = await html2canvas(section, {
        backgroundColor: "#ffffff",
        windowWidth: SLIDE_PX_W,
        width: SLIDE_PX_W,
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      const dataUrl = fitToSlide(canvas);
      const slide = pres.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addImage({
        data: dataUrl,
        x: 0, y: 0, w: SLIDE_W_IN, h: SLIDE_H_IN,
      });
      slide.addText(`${i + 1} / ${total}`, {
        x: SLIDE_W_IN - 1.2, y: SLIDE_H_IN - 0.35, w: 1.0, h: 0.25,
        fontSize: 9, color: "94A3B8", align: "right", fontFace: "Arial",
      });
    }
  } finally {
    body.style.width = prevWidth;
    body.style.maxWidth = prevMaxWidth;
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
