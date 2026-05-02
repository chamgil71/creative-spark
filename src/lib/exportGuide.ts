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

type Block = { top: number; height: number };

/** 섹션을 자식 블록 단위로 그리디 패킹하여 슬라이드 높이(720px) 안에 들어가도록 묶음 */
function packSection(section: HTMLElement, maxH: number): Block[] {
  const sectionTop = section.offsetTop;
  const sectionH = section.offsetHeight;

  if (sectionH <= maxH) {
    return [{ top: sectionTop, height: sectionH }];
  }

  // 분할 단위: .section-inner 의 직계 자식, 없으면 섹션의 직계 자식
  const inner = section.querySelector(".section-inner") as HTMLElement | null;
  const host = inner ?? section;
  const children = Array.from(host.children) as HTMLElement[];
  if (children.length === 0) {
    return [{ top: sectionTop, height: sectionH }];
  }

  // 각 자식의 절대 top/height (offsetParent 체인 무시하고 section 기준으로 계산)
  const items = children
    .filter((c) => c.offsetHeight > 0)
    .map((c) => {
      const top = c.getBoundingClientRect().top
        - section.getBoundingClientRect().top
        + sectionTop;
      return { el: c, top, height: c.offsetHeight };
    });

  if (items.length === 0) {
    return [{ top: sectionTop, height: sectionH }];
  }

  const slides: Block[] = [];
  let groupStart = items[0].top;
  let groupEnd = items[0].top + items[0].height;

  // 섹션 헤더 영역(첫 자식 위쪽 여백 포함)도 첫 슬라이드에 포함
  groupStart = sectionTop;

  for (let i = 1; i < items.length; i++) {
    const it = items[i];
    const candidateEnd = it.top + it.height;
    if (candidateEnd - groupStart <= maxH) {
      groupEnd = candidateEnd;
    } else {
      slides.push({ top: groupStart, height: groupEnd - groupStart });
      groupStart = it.top;
      groupEnd = candidateEnd;
    }
  }
  slides.push({ top: groupStart, height: groupEnd - groupStart });
  return slides;
}

export async function exportIframeToPptx(
  iframe: HTMLIFrameElement,
  docTitle: string,
  fileName: string,
) {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("가이드 문서를 불러오지 못했습니다.");

  const target = (doc.body || doc.documentElement) as HTMLElement;
  const captureWidth = SLIDE_PX_W;
  const slicePxH = SLIDE_PX_H;

  const prevWidth = target.style.width;
  const prevMaxWidth = target.style.maxWidth;
  target.style.width = `${captureWidth}px`;
  target.style.maxWidth = `${captureWidth}px`;

  let canvas: HTMLCanvasElement;
  let blocks: Block[];
  try {
    canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      windowWidth: captureWidth,
      width: captureWidth,
      scale: 1.5,
      useCORS: true,
      logging: false,
    });

    // 섹션 단위 분할 계산 (캡처 직후, 폭 강제 상태에서 측정)
    const sectionEls = Array.from(
      doc.querySelectorAll<HTMLElement>(
        "section.hero, section.section, section.done-section",
      ),
    );

    if (sectionEls.length === 0) {
      // 폴백: 기존 방식대로 720px씩 균등 분할
      blocks = [];
      const total = Math.max(1, Math.ceil(target.offsetHeight / slicePxH));
      for (let i = 0; i < total; i++) {
        blocks.push({ top: i * slicePxH, height: slicePxH });
      }
    } else {
      blocks = sectionEls.flatMap((s) => packSection(s, slicePxH));
    }
  } finally {
    target.style.width = prevWidth;
    target.style.maxWidth = prevMaxWidth;
  }

  const scale = canvas.width / captureWidth;

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

  const totalSlides = blocks.length;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const sy = Math.max(0, Math.round(block.top * scale));
    const sh = Math.min(
      Math.round(block.height * scale),
      canvas.height - sy,
    );
    if (sh <= 0) continue;

    // 슬라이드 캔버스: 항상 1280×720 비율, 흰 배경
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.round(slicePxH * scale);
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    // 블록이 슬라이드보다 큰 단일 요소인 경우 → 비례 축소
    if (sh > sliceCanvas.height) {
      const ratio = sliceCanvas.height / sh;
      const drawW = canvas.width * ratio;
      const dx = (sliceCanvas.width - drawW) / 2;
      ctx.drawImage(
        canvas,
        0, sy, canvas.width, sh,
        dx, 0, drawW, sliceCanvas.height,
      );
    } else {
      // 정상: 상단 정렬, 아래 흰 여백
      ctx.drawImage(
        canvas,
        0, sy, canvas.width, sh,
        0, 0, canvas.width, sh,
      );
    }

    const dataUrl = sliceCanvas.toDataURL("image/jpeg", 0.9);
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data: dataUrl,
      x: 0, y: 0, w: SLIDE_W_IN, h: SLIDE_H_IN,
    });
    slide.addText(`${i + 1} / ${totalSlides}`, {
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
