import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PageInfo } from "@/lib/pdfTypes";

// Build an edited PDF: cover original text rectangles with white, then redraw the new text.
// We only modify items whose text changed.
export async function buildEditedPdf(
  originalBytes: ArrayBuffer,
  pages: PageInfo[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const docPages = pdfDoc.getPages();

  for (const pageInfo of pages) {
    const page = docPages[pageInfo.pageIndex];
    if (!page) continue;
    const edited = pageInfo.items.filter((it) => it.text !== it.originalText);
    if (edited.length === 0) continue;

    for (const item of edited) {
      const { pdfX, pdfY, pdfWidth, fontSize } = item;
      // Cover the original text with a white rectangle.
      // pdf-lib uses bottom-left origin too. pdfY is the text baseline; descent ~ 0.2 * fontSize.
      const padX = 1;
      const rectY = pdfY - fontSize * 0.25;
      const rectH = fontSize * 1.25;
      page.drawRectangle({
        x: pdfX - padX,
        y: rectY,
        width: Math.max(pdfWidth, helv.widthOfTextAtSize(item.text, fontSize)) + padX * 2,
        height: rectH,
        color: rgb(1, 1, 1),
      });
      // Draw the new text at the original baseline.
      page.drawText(item.text, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        font: helv,
        color: rgb(0, 0, 0),
      });
    }
  }

  return await pdfDoc.save();
}
