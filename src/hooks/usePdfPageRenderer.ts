import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface PdfRenderState {
  pages: (string | null)[];           // Array of PNG data URLs, index = page number - 1
  totalPages: number;
  renderedCount: number;     // How many pages have been rendered so far
  isLoadingInitial: boolean; // True until first 2 pages are ready
  error: string | null;
}

export function usePdfPageRenderer(pdfUrl: string | null, scale: number = 1.5) {
  const [state, setState] = useState<PdfRenderState>({
    pages: [],
    totalPages: 0,
    renderedCount: 0,
    isLoadingInitial: true,
    error: null,
  });

  const abortRef = useRef(false);

  useEffect(() => {
    if (!pdfUrl) return;

    abortRef.current = false;
    setState({ pages: [], totalPages: 0, renderedCount: 0, isLoadingInitial: true, error: null });

    const run = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
        });

        const pdf = await loadingTask.promise;
        const total = pdf.numPages;

        setState(prev => ({ ...prev, totalPages: total, pages: new Array(total).fill(null) }));

        // Render pages one by one, starting from page 1
        // After page 2 is done, mark isLoadingInitial = false so the viewer can open
        for (let pageNum = 1; pageNum <= total; pageNum++) {
          if (abortRef.current) break;

          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport, canvas: canvas }).promise;
          const dataUrl = canvas.toDataURL('image/png');

          // Clean up canvas immediately after extracting data URL
          canvas.width = 0;
          canvas.height = 0;

          if (abortRef.current) break;

          setState(prev => {
            const newPages = [...prev.pages];
            newPages[pageNum - 1] = dataUrl;
            const newRenderedCount = prev.renderedCount + 1;
            return {
              ...prev,
              pages: newPages,
              renderedCount: newRenderedCount,
              // Mark initial loading done after first 2 pages are rendered (or if total < 2)
              isLoadingInitial: newRenderedCount < Math.min(2, total),
            };
          });
        }
      } catch (err) {
        if (!abortRef.current) {
          console.error("PDF Render Error:", err);
          setState(prev => ({ ...prev, isLoadingInitial: false, error: 'Failed to load magazine. Please try again.' }));
        }
      }
    };

    run();

    return () => {
      abortRef.current = true;
    };
  }, [pdfUrl, scale]);

  return state;
}
