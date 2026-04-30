export type TextItem = {
  id: string;
  pageIndex: number;
  // PDF coordinates (origin bottom-left, in PDF points)
  pdfX: number;
  pdfY: number; // baseline y in PDF points
  pdfWidth: number;
  pdfHeight: number; // font height in PDF points
  fontSize: number; // PDF points
  fontName: string;
  originalText: string;
  text: string; // current (possibly edited) text
};

export type PageInfo = {
  pageIndex: number;
  widthPt: number; // PDF points
  heightPt: number;
  viewportWidth: number; // CSS pixels at render scale
  viewportHeight: number;
  scale: number;
  canvas: HTMLCanvasElement;
  items: TextItem[];
};
