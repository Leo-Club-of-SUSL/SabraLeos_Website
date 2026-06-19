import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { usePdfPageRenderer } from '../../hooks/usePdfPageRenderer';
import { fetchMagazinePdfUrl, incrementViewCount } from '../../services/magazineService';
import type { Magazine } from '../../types/magazine';

interface MagazineViewerProps {
  magazine: Magazine | null;
  onClose: () => void;
}

const FlipPage = React.forwardRef<HTMLDivElement, { number: number; dataUrl: string | null }>(
  ({ number, dataUrl }, ref) => (
    <div ref={ref} className="relative bg-white overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Page ${number + 1}`}
          className="w-full h-full object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading page {number + 1}...</span>
        </div>
      )}
    </div>
  )
);
FlipPage.displayName = 'FlipPage';

const MagazineViewer = ({ magazine, onClose }: MagazineViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for react-pageflip
  const [isFullscreen, setIsFullscreen] = useState(false);
  const bookRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 480, height: 640 });

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const renderScale = isMobile ? 1.2 : 1.5;

  const pdfUrl = magazine ? fetchMagazinePdfUrl(magazine.id) : null;
  const { pages, totalPages, renderedCount, isLoadingInitial, error } = usePdfPageRenderer(pdfUrl, renderScale);

  // Fire view count once per open
  useEffect(() => {
    if (magazine) {
      incrementViewCount(magazine.id); 
      // eslint-disable-next-line
      setCurrentPage(0);
    }
  }, [magazine]);

  // Flipbook dynamic resizing
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const pageWidth = Math.min(Math.floor((vw * 0.9) / 2), 480);
      const pageHeight = Math.min(Math.floor(pageWidth * (4 / 3)), vh * 0.85);
      
      setDimensions({ width: pageWidth, height: pageHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!magazine) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (!isMobile) {
          bookRef.current?.pageFlip()?.flipNext();
        } else {
          setCurrentPage(p => Math.min(p + 1, totalPages - 1));
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (!isMobile) {
          bookRef.current?.pageFlip()?.flipPrev();
        } else {
          setCurrentPage(p => Math.max(p - 1, 0));
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [magazine, onClose, isMobile, totalPages]);

  // Handle Fullscreen events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const downloadUrl = magazine ? `${fetchMagazinePdfUrl(magazine.id)}?download=true` : '#';

  // Mobile Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const dist = touchStart - touchEnd;
    if (dist > 50) setCurrentPage(p => Math.min(p + 1, totalPages - 1));
    if (dist < -50) setCurrentPage(p => Math.max(p - 1, 0));
    setTouchStart(null);
  };

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
          {/* Top absolute close button - outside controls bar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
            aria-label="Close PDF viewer"
          >
            <X size={24} />
          </button>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4 relative">
            {isLoadingInitial && !error && (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-[var(--color-leo-gold)]" />
                <p className="text-white text-sm">Loading magazine...</p>
                <p className="text-white/60 text-xs font-medium">Rendering pages... {renderedCount} / {totalPages}</p>
              </div>
            )}
            
            {error && (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-4">
                <AlertTriangle size={40} className="text-red-400" />
                <p className="text-white font-semibold">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[var(--color-leo-maroon)] text-white rounded-lg text-sm font-medium hover:bg-[#600000] transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {!isLoadingInitial && !error && pages.length >= (isMobile ? 1 : 2) && (
              <div className="w-full h-full flex items-center justify-center">
                {isMobile ? (
                  <div 
                    className="w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden touch-pan-y pt-4 pb-20"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                  >
                    <div className="w-full max-w-[95vw] mt-auto mb-auto relative bg-white/5 shadow-2xl overflow-hidden rounded">
                      {pages[currentPage] ? (
                        <img 
                          src={pages[currentPage] as string} 
                          alt={`Page ${currentPage + 1}`} 
                          className="w-full h-auto object-contain"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] animate-pulse bg-gray-200 flex items-center justify-center">
                           <span className="text-gray-400 text-sm">Loading page {currentPage + 1}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <HTMLFlipBook
                    ref={bookRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    size="fixed"
                    drawShadow={true}
                    flippingTime={700}
                    usePortrait={false}
                    showCover={true}
                    mobileScrollSupport={false}
                    onFlip={(e) => setCurrentPage(e.data)}
                    className="flipbook"
                    style={{ margin: '0 auto' }}
                  >
                    {pages.map((pageDataUrl, index) => (
                      <FlipPage key={index} number={index} dataUrl={pageDataUrl} />
                    ))}
                  </HTMLFlipBook>
                )}
              </div>
            )}
          </div>

          {/* Controls bar */}
          {!isLoadingInitial && !error && pages.length > 0 && (
            <div className="shrink-0 bg-slate-900/95 border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2 z-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!isMobile) bookRef.current?.pageFlip()?.flipPrev();
                    else setCurrentPage(p => Math.max(p - 1, 0));
                  }}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-white/80 text-sm font-medium min-w-[80px] text-center">
                  {!isMobile && currentPage > 0 && currentPage < totalPages - 1
                    ? `${currentPage + 1}–${currentPage + 2} of ${totalPages}`
                    : `Page ${currentPage + 1} of ${totalPages}`}
                </span>
                <button
                  onClick={() => {
                    if (!isMobile) bookRef.current?.pageFlip()?.flipNext();
                    else setCurrentPage(p => Math.min(p + 1, totalPages - 1));
                  }}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {renderedCount < totalPages && (
                  <span className="hidden sm:inline-block px-2 py-1 bg-white/10 text-white/50 text-[10px] rounded uppercase font-semibold tracking-wider">
                    Rendering {renderedCount}/{totalPages}
                  </span>
                )}
                
                {magazine.is_downloadable && (
                  <a
                    href={downloadUrl}
                    download={`${magazine.slug || magazine.id}.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-leo-gold)] text-[#600000] text-xs font-bold rounded-lg hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    aria-label="Download PDF"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MagazineViewer;
