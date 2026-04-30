// Centralized pdf.js loader with worker setup
import * as pdfjsLib from "pdfjs-dist";
// Vite worker import (?url returns a string)
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
