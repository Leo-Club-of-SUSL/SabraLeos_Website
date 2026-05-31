// src/components/magazine/MagazineViewer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { fetchMagazinePdfUrl, incrementViewCount } from '../../services/magazineService';
import type { Magazine } from '../../types/magazine';

interface MagazineViewerProps {
  magazine: Magazine | null;
  onClose: () => void;
}

type PDFLib = typeof import('pdfjs-dist');
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;

const MagazineViewer = ({ magazine, onClose }: MagazineViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState('');
  const renderTaskRef = useRef<any>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // ── Load PDF via dynamic import (lazy) ──
  useEffect(() => {
    if (!magazine) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setCurrentPage(1);

    // Fire-and-forget view count
    incrementViewCount(magazine.id);

    const pdfUrl = fetchMagazinePdfUrl(magazine.id);

    import('pdfjs-dist').then((pdfjsLib: PDFLib) => {
      if (cancelled) return;

      // Set worker source to CDN URL matching installed version
      const version = (pdfjsLib as any).version as string;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

      pdfjsLib
        .getDocument({ url: pdfUrl })
        .promise.then((doc) => {
          if (cancelled) return;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setLoading(false);
        })
        .catch((err: Error) => {
          if (cancelled) return;
          console.error('PDF load error:', err);
          setError('Failed to load the PDF. Please try again.');
          setLoading(false);
        });
    }).catch((err) => {
      if (cancelled) return;
      console.error('PDF.js dynamic import error:', err);
      setError('PDF viewer could not be initialized.');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [magazine]);

  // ── Render page to canvas ──
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      // Cancel any in-progress render
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* noop */ }
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = { canvasContext: ctx, viewport, canvas: canvasRef.current };
      renderTaskRef.current = page.render(renderContext);

      try {
        await renderTaskRef.current.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Render error:', err);
        }
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage, scale, renderPage]);

  // ── Keyboard navigation ──
  useEffect(() => {
    if (!magazine) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentPage((p) => Math.min(p + 1, totalPages));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentPage((p) => Math.max(p - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [magazine, totalPages, onClose]);

  // ── Cleanup on close ──
  useEffect(() => {
    if (!magazine) {
      setPdfDoc(null);
      setTotalPages(0);
      setCurrentPage(1);
    }
  }, [magazine]);

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      setCurrentPage(n);
      setJumpInput('');
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

  const downloadUrl = magazine
    ? `${fetchMagazinePdfUrl(magazine.id)}?download=true`
    : '#';

  return (
    <AnimatePresence>
      {magazine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-label={`Reading: ${magazine.title}`}
        >
          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={16} className="text-[var(--color-leo-gold)] shrink-0" />
              <span className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-none">
                {magazine.title}
              </span>
              {magazine.volume_number && (
                <span className="hidden sm:inline text-xs text-white/50">
                  Vol. {magazine.volume_number}
                  {magazine.issue_number ? `, Issue ${magazine.issue_number}` : ''}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
              aria-label="Close PDF viewer"
              id="magazine-viewer-close"
            >
              <X size={20} />
            </button>
          </div>

          {/* PDF canvas area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto flex items-start justify-center p-4"
          >
            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={40} className="animate-spin text-[var(--color-leo-gold)]" />
                <p className="text-white/60 text-sm">Loading PDF…</p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <AlertTriangle size={40} className="text-red-400" />
                <p className="text-white font-semibold">{error}</p>
                <button
                  onClick={() => { setPdfDoc(null); setLoading(true); setError(null); }}
                  className="px-4 py-2 bg-[var(--color-leo-maroon)] text-white rounded-lg text-sm font-medium hover:bg-[#600000] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && (
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-2xl max-w-full"
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`Page ${currentPage} of ${magazine.title}`}
              />
            )}
          </div>

          {/* Controls bar */}
          {!loading && !error && totalPages > 0 && (
            <div className="shrink-0 bg-slate-900/95 border-t border-white/10 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Previous page"
                  id="magazine-viewer-prev"
                >
                  <ChevronLeft size={18} />
                </button>

                <form onSubmit={handlePageJump} className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpInput || currentPage}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onFocus={() => setJumpInput(String(currentPage))}
                    onBlur={() => setJumpInput('')}
                    className="w-12 text-center bg-white/10 text-white text-sm rounded-lg border border-white/20 py-1 focus:outline-none focus:border-[var(--color-leo-gold)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Current page"
                    id="magazine-viewer-page-input"
                  />
                  <span className="text-white/50 text-xs">/ {totalPages}</span>
                </form>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Next page"
                  id="magazine-viewer-next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Zoom out"
                  id="magazine-viewer-zoom-out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-white/50 text-xs w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Zoom in"
                  id="magazine-viewer-zoom-in"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {/* Download button — only if allowed */}
              {magazine.is_downloadable && (
                <a
                  href={downloadUrl}
                  download={`${magazine.slug || magazine.id}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-leo-gold)] text-[#600000] text-xs font-bold rounded-lg hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  aria-label="Download PDF"
                  id="magazine-viewer-download"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Download</span>
                </a>
              )}
            </div>
          )}

          {/* Mobile: vertical scroll hint (≤768px) */}
          {isMobile && !loading && !error && totalPages > 1 && (
            <p className="text-center text-white/40 text-[10px] pb-1">
              Use ← → keys or buttons to navigate pages
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MagazineViewer;
