// Centralized pdf.js loader with worker setup
import * as pdfjsLib from "pdfjs-dist";
// Vite worker import
// @ts-expect-error - Vite ?url import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
