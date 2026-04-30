import { useEffect, useRef, useState } from "react";
import type { PageInfo, TextItem } from "@/lib/pdfTypes";

interface Props {
  page: PageInfo;
  onChangeItem: (itemId: string, newText: string) => void;
}

export const PdfPage = ({ page, onChangeItem }: Props) => {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mount the offscreen canvas into the DOM
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    host.innerHTML = "";
    page.canvas.style.display = "block";
    page.canvas.style.width = "100%";
    page.canvas.style.height = "auto";
    host.appendChild(page.canvas);
  }, [page]);

  // Convert PDF coords (origin bottom-left, points) -> overlay coords (origin top-left, % of page)
  const toOverlay = (item: TextItem) => {
    const { pdfX, pdfY, pdfWidth, fontSize } = item;
    const leftPct = (pdfX / page.widthPt) * 100;
    // pdf baseline -> top of text box
    const topPdf = pdfY + fontSize; // approx top in PDF coords
    const topFromTopPt = page.heightPt - topPdf;
    const topPct = (topFromTopPt / page.heightPt) * 100;
    const widthPct = (pdfWidth / page.widthPt) * 100;
    const heightPct = (fontSize * 1.25 / page.heightPt) * 100;
    return { leftPct, topPct, widthPct, heightPct };
  };

  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-lg bg-white"
      style={{ boxShadow: "var(--shadow-elegant)", aspectRatio: `${page.widthPt} / ${page.heightPt}` }}
    >
      <div ref={canvasHostRef} className="absolute inset-0" />
      <div className="absolute inset-0">
        {page.items.map((item) => {
          const { leftPct, topPct, widthPct, heightPct } = toOverlay(item);
          const isEditing = editingId === item.id;
          const isEdited = item.text !== item.originalText;
          return (
            <div
              key={item.id}
              className="group/item absolute"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${Math.max(widthPct, 2)}%`,
                height: `${Math.max(heightPct, 1.5)}%`,
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  defaultValue={item.text}
                  onBlur={(e) => {
                    onChangeItem(item.id, e.target.value);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChangeItem(item.id, (e.target as HTMLInputElement).value);
                      setEditingId(null);
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  className="absolute inset-0 w-full rounded-sm border-2 border-primary bg-white px-1 text-foreground outline-none"
                  style={{
                    fontSize: `calc(${heightPct}cqh / 1.25)`,
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingId(item.id)}
                  title={item.text}
                  className={[
                    "absolute inset-0 w-full cursor-text rounded-sm transition-colors",
                    isEdited
                      ? "bg-primary/15 ring-1 ring-primary"
                      : "hover:bg-primary/10 hover:ring-1 hover:ring-primary/50",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
