import { pdfjsLib } from "@/lib/pdfjs";
import type { PageInfo, TextItem } from "@/lib/pdfTypes";

export async function loadPdfPages(
  data: ArrayBuffer,
  renderScale = 1.5,
): Promise<PageInfo[]> {
  // Clone the buffer because pdf.js will detach it
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
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const textContent = await page.getTextContent();
    const items: TextItem[] = [];
    textContent.items.forEach((raw: any, idx: number) => {
      if (!("str" in raw) || !raw.str || !raw.str.trim()) return;
      // transform = [a, b, c, d, e, f]; e,f are origin in PDF user space
      const [a, b, , d, e, f] = raw.transform as number[];
      const fontSize = Math.hypot(a, b) || Math.abs(d) || 10;
      items.push({
        id: `p${i - 1}-i${idx}`,
        pageIndex: i - 1,
        pdfX: e,
        pdfY: f,
        pdfWidth: raw.width,
        pdfHeight: raw.height || fontSize,
        fontSize,
        fontName: raw.fontName || "",
        originalText: raw.str,
        text: raw.str,
      });
    });

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
