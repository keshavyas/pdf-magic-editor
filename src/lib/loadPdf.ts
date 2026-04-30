import { pdfjsLib } from "@/lib/pdfjs";
import type { PageInfo, TextItem } from "@/lib/pdfTypes";

// Map common embedded PDF font names to web-safe CSS font families.
function mapFontFamily(fontName: string): string {
  const n = (fontName || "").toLowerCase();
  if (n.includes("times") || n.includes("serif") || n.includes("roman")) {
    return '"Times New Roman", Times, serif';
  }
  if (n.includes("courier") || n.includes("mono")) {
    return '"Courier New", Courier, monospace';
  }
  // Default to Helvetica/Arial family
  return "Helvetica, Arial, sans-serif";
}

function detectStyle(fontName: string) {
  const n = (fontName || "").toLowerCase();
  return {
    bold: n.includes("bold") || n.includes("black") || n.includes("heavy"),
    italic: n.includes("italic") || n.includes("oblique"),
  };
}

// Sample the rendered canvas at the text's bounding box to estimate the text color.
// Returns CSS rgb() string. Falls back to black.
function sampleTextColor(
  canvas: HTMLCanvasElement,
  xPx: number,
  yPx: number,
  wPx: number,
  hPx: number,
): string {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "rgb(0,0,0)";
    const x = Math.max(0, Math.floor(xPx));
    const y = Math.max(0, Math.floor(yPx));
    const w = Math.max(1, Math.min(canvas.width - x, Math.floor(wPx)));
    const h = Math.max(1, Math.min(canvas.height - y, Math.floor(hPx)));
    const data = ctx.getImageData(x, y, w, h).data;
    // Find the darkest non-white-ish pixel; that is most likely the glyph color.
    let bestR = 0, bestG = 0, bestB = 0, bestScore = Infinity;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 230) continue; // skip background
      // Prefer darker pixels (ink)
      if (lum < bestScore) {
        bestScore = lum;
        bestR = r; bestG = g; bestB = b;
      }
    }
    if (bestScore === Infinity) return "rgb(0,0,0)";
    return `rgb(${bestR},${bestG},${bestB})`;
  } catch {
    return "rgb(0,0,0)";
  }
}

export async function loadPdfPages(
  data: ArrayBuffer,
  renderScale = 2,
): Promise<PageInfo[]> {
  const clone = data.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: clone });
  const pdf = await loadingTask.promise;
  const pages: PageInfo[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: renderScale });
    const widthPt = viewport.viewBox[2];
    const heightPt = viewport.viewBox[3];

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const textContent = await page.getTextContent();
    const items: TextItem[] = [];

    textContent.items.forEach((raw: any, idx: number) => {
      if (!("str" in raw) || !raw.str || !raw.str.trim()) return;
      const [a, b, , d, e, f] = raw.transform as number[];
      const fontSize = Math.hypot(a, b) || Math.abs(d) || 10;
      const styles = (textContent as any).styles || {};
      const styleEntry = styles[raw.fontName] || {};
      const fontFamily = mapFontFamily(styleEntry.fontFamily || raw.fontName || "");
      const { bold, italic } = detectStyle(styleEntry.fontFamily || raw.fontName || "");

      // Compute pixel bbox on the rendered canvas to sample color.
      // PDF coords -> canvas pixels (renderScale, top-left origin).
      const pxX = e * renderScale;
      const pxYBaseline = (heightPt - f) * renderScale;
      const pxH = fontSize * renderScale;
      const pxTop = pxYBaseline - pxH;
      const pxW = (raw.width || fontSize) * renderScale;
      const color = sampleTextColor(canvas, pxX, pxTop, pxW, pxH * 1.1);

      items.push({
        id: `p${i - 1}-i${idx}`,
        pageIndex: i - 1,
        pdfX: e,
        pdfY: f,
        pdfWidth: raw.width || fontSize * raw.str.length * 0.5,
        pdfHeight: raw.height || fontSize,
        fontSize,
        fontName: styleEntry.fontFamily || raw.fontName || "",
        fontFamily,
        bold,
        italic,
        color,
        originalText: raw.str,
        text: raw.str,
      });
    });

    // Erase original text from the canvas by painting white rectangles over each item's bbox.
    // This way the editable DOM layer above looks identical and edits are visible immediately.
    ctx.save();
    ctx.fillStyle = "#ffffff";
    for (const item of items) {
      const pxX = item.pdfX * renderScale;
      const pxYBaseline = (heightPt - item.pdfY) * renderScale;
      const pxH = item.fontSize * renderScale;
      const pxTop = pxYBaseline - pxH;
      const pxW = item.pdfWidth * renderScale;
      // small padding to fully cover anti-aliased edges and descenders
      ctx.fillRect(pxX - 1, pxTop - 1, pxW + 2, pxH * 1.3 + 2);
    }
    ctx.restore();

    pages.push({
      pageIndex: i - 1,
      widthPt,
      heightPt,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      scale: renderScale,
      canvas,
      items,
    });
  }

  return pages;
}
