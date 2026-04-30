import { useCallback, useState } from "react";
import { Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfPage } from "@/components/PdfPage";
import { loadPdfPages } from "@/lib/loadPdf";
import { buildEditedPdf } from "@/lib/buildPdf";
import type { PageInfo } from "@/lib/pdfTypes";
import { toast } from "sonner";

const Index = () => {
  const [pages, setPages] = useState<PageInfo[] | null>(null);
  const [originalBytes, setOriginalBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("document.pdf");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      // Keep one copy for pdf-lib; loadPdfPages clones internally for pdf.js
      setOriginalBytes(buf.slice(0));
      setFileName(file.name);
      const loaded = await loadPdfPages(buf, 2);
      setPages(loaded);
    } catch (err) {
      console.error(err);
      toast.error("Could not open this PDF");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = (pageIdx: number, itemId: string, text: string) => {
    setPages((prev) => {
      if (!prev) return prev;
      return prev.map((p) =>
        p.pageIndex !== pageIdx
          ? p
          : { ...p, items: p.items.map((it) => (it.id === itemId ? { ...it, text } : it)) },
      );
    });
  };

  const handleDownload = async () => {
    if (!originalBytes || !pages) return;
    setDownloading(true);
    try {
      const bytes = await buildEditedPdf(originalBytes.slice(0), pages);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.pdf$/i, "") + "-edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Edited PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      setDownloading(false);
    }
  };

  const reset = () => {
    setPages(null);
    setOriginalBytes(null);
  };

  const editedCount =
    pages?.reduce((n, p) => n + p.items.filter((i) => i.text !== i.originalText).length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PDF Editor</span>
          </div>
          {pages && (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {editedCount} edit{editedCount === 1 ? "" : "s"}
              </span>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" /> New file
              </Button>
              <Button size="sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-10">
        {!pages && !loading && (
          <section className="flex flex-col items-center text-center">
            <h1 className="max-w-3xl bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
              style={{ backgroundImage: "var(--gradient-hero)" }}>
              Edit any PDF, right in your browser
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Click any line of text to edit it in place. No upload, no signup —
              your files stay 100% on your device.
            </p>
            <div className="mt-10 w-full flex justify-center">
              <PdfDropzone onFile={handleFile} />
            </div>
            <ul className="mt-10 grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="rounded-lg border border-border bg-card p-4">
                <strong className="text-foreground">Click to edit</strong>
                <p className="mt-1">Tap any text block, type your change, hit enter.</p>
              </li>
              <li className="rounded-lg border border-border bg-card p-4">
                <strong className="text-foreground">Position preserved</strong>
                <p className="mt-1">New text lands exactly where the original was.</p>
              </li>
              <li className="rounded-lg border border-border bg-card p-4">
                <strong className="text-foreground">Private by default</strong>
                <p className="mt-1">Everything runs locally — no server uploads.</p>
              </li>
            </ul>
          </section>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Opening your PDF…</p>
          </div>
        )}

        {pages && (
          <div className="flex flex-col gap-8">
            <p className="text-center text-sm text-muted-foreground">
              Click any text to edit it directly — same size, font, and color as the original. Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd> when done.
            </p>
            {pages.map((p) => (
              <PdfPage
                key={p.pageIndex}
                page={p}
                onChangeItem={(id, text) => updateItem(p.pageIndex, id, text)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
