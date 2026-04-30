import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
}

export const PdfDropzone = ({ onFile }: Props) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return;
      onFile(file);
    },
    [onFile],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex h-80 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-12 text-center transition-all",
        "border-border hover:border-primary hover:bg-accent/40",
        dragOver && "border-primary bg-accent/60 scale-[1.01]",
      )}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Upload className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Drop your PDF here</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        or click to browse — your file never leaves your browser
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
};
