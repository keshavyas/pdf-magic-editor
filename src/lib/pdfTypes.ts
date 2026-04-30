export type TextItem = {
  id: string;
  pageIndex: number;
  // PDF coordinates (origin bottom-left, in PDF points)
  pdfX: number;
  pdfY: number; // baseline y in PDF points
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number; // PDF points
  fontName: string;
  fontFamily: string; // CSS font-family
  bold: boolean;
  italic: boolean;
  color: string; // CSS color
  originalText: string;
  text: string; // current (possibly edited) text
};

export type PageInfo = {
  pageIndex: number;
  widthPt: number;
  heightPt: number;
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  canvas: HTMLCanvasElement;
  items: TextItem[];
};
