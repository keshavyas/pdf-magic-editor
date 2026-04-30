import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PageInfo, TextItem } from "@/lib/pdfTypes";

interface Props {
  page: PageInfo;
  onChangeItem: (itemId: string, newText: string) => void;
}

export const PdfPage = ({ page, onChangeItem }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  // Effective scale: CSS pixels per PDF point
  const [pxPerPt, setPxPerPt] = useState(1);

  // Mount the canvas (background with original text erased)
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    host.innerHTML = "";
    page.canvas.style.display = "block";
    page.canvas.style.width = "100%";
    page.canvas.style.height = "auto";
    page.canvas.style.userSelect = "none";
    page.canvas.style.pointerEvents = "none";
    host.appendChild(page.canvas);
  }, [page]);

  // Track effective scale to size text correctly at any viewport
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPxPerPt(w / page.widthPt);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.widthPt]);

  const renderItem = (item: TextItem) => {
    // Convert PDF coords (origin bottom-left, points) -> CSS px from top-left of page
    const leftPx = item.pdfX * pxPerPt;
    const topPx = (page.heightPt - item.pdfY - item.fontSize) * pxPerPt;
    const fontSizePx = item.fontSize * pxPerPt;
    const widthPx = item.pdfWidth * pxPerPt;
    const isEdited = item.text !== item.originalText;

    return (
      <span
        key={item.id}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => {
          const v = (e.currentTarget.textContent || "").replace(/\u00A0/g, " ");
          if (v !== item.text) onChangeItem(item.id, v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        title={item.originalText}
        className="pdf-text-item"
        style={{
          position: "absolute",
          left: `${leftPx}px`,
          top: `${topPx}px`,
          minWidth: `${Math.max(widthPx, fontSizePx * 0.5)}px`,
          height: `${fontSizePx * 1.25}px`,
          lineHeight: `${fontSizePx * 1.25}px`,
          fontSize: `${fontSizePx}px`,
          fontFamily: item.fontFamily,
          fontWeight: item.bold ? 700 : 400,
          fontStyle: item.italic ? "italic" : "normal",
          color: item.color,
          whiteSpace: "pre",
          cursor: "text",
          padding: "0 1px",
          borderRadius: 2,
          outline: "none",
          background: isEdited ? "hsl(var(--primary) / 0.08)" : "transparent",
          boxShadow: isEdited ? "inset 0 0 0 1px hsl(var(--primary) / 0.5)" : undefined,
          transition: "background 120ms",
        }}
      >
        {item.text}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-lg bg-white"
      style={{
        boxShadow: "var(--shadow-elegant)",
        aspectRatio: `${page.widthPt} / ${page.heightPt}`,
      }}
    >
      <div ref={canvasHostRef} className="absolute inset-0" />
      <div className="absolute inset-0">{page.items.map(renderItem)}</div>
    </div>
  );
};
