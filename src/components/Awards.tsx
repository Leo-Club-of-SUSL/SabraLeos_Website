import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Trophy, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const Awards = () => {
  const { awards, loading } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAward, setSelectedAward] = useState<any>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedAward) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedAward]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    // Each item is w-64 (256px) + gap-8 (32px) = 288px per snap point
    const newIndex = Math.round(scrollLeft / 288);
    setActiveIndex(newIndex < awards.length ? newIndex : awards.length - 1);

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const timer = setTimeout(handleScroll, 100);
    return () => clearTimeout(timer);
  }, [awards]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const { clientWidth } = containerRef.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left'
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;

      containerRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };



  const dotsRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const updateScrollFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!dotsRef.current || !containerRef.current) return;
    
    const rect = dotsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    const scrollMax = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    containerRef.current.scrollLeft = percentage * scrollMax;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsInteracting(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateScrollFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isInteracting) {
      updateScrollFromPointer(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  if (loading && awards.length === 0) {
    return (
      <section id="awards" className="py-20 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="h-10 w-64 bg-gray-200 dark:bg-slate-700 rounded-lg mx-auto mb-4 skeleton"></div>
            <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full"></div>
          </div>
          <div className="flex gap-8 overflow-hidden pb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-none w-64 text-center">
                <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-slate-700 skeleton"></div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-700 rounded mx-auto skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (awards.length === 0 && !loading) {
    return <section id="awards" className="h-0 invisible pointer-events-none" aria-hidden="true" />;
  }

  return (
    <section id="awards" className="py-20 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">Our Awards & Recognition</h2>
          <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Celebrating the milestones and achievements that define our journey of service.
          </p>
        </motion.div>

        <div className="relative group/scroll px-4 md:px-0">
          {/* Navigation Buttons for PC */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-20 p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] hover:scale-110 transition-all flex items-center justify-center border border-gray-100 dark:border-slate-700 active:scale-95 group/btn"
              aria-label="Previous awards"
            >
              <ChevronLeft size={24} className="group-hover/btn:-translate-x-0.5 transition-transform" />
            </button>
          )}

          <motion.div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ 
              scrollSnapType: isInteracting ? 'none' : 'x mandatory',
              scrollBehavior: isInteracting ? 'auto' : 'smooth'
            }}
            className={`flex gap-8 overflow-x-auto pb-8 no-scrollbar px-4 ${awards.length <= 4 ? 'lg:justify-center' : ''}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {awards.map((award, index) => (
              <motion.div
                key={award.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAward(award)}
                className="flex-none w-64 snap-center group cursor-pointer"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group-hover:border-[var(--color-leo-gold)] transition-all duration-500">
                  <img
                    src={award.thumbnail || award.image}
                    alt={award.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Trophy className="text-[var(--color-leo-gold)] w-10 h-10" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-center justify-center mb-1">
                    <h4 className="text-xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] line-clamp-2 px-2">
                      {award.title}
                    </h4>
                  </div>
                  {award.year && (
                    <span className="inline-block px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-gray-500 dark:text-gray-300 shadow-sm">
                      {award.year}
                    </span>
                  )}
                  {award.description && (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 px-4 italic">
                      "{award.description}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-20 p-3 bg-white dark:bg-slate-800 rounded-full shadow-xl text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] hover:scale-110 transition-all flex items-center justify-center border border-gray-100 dark:border-slate-700 active:scale-95 group/btn"
              aria-label="Next awards"
            >
              <ChevronRight size={24} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Custom Scrollbar Hint/Gradient */}
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-gray-50 dark:from-slate-900 pointer-events-none opacity-40"></div>
          <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-gray-50 dark:from-slate-900 pointer-events-none opacity-40"></div>
        </div>

        {awards.length > 3 && (
          <div className="mt-12 flex justify-center py-4 select-none touch-none">
            <div 
              ref={dotsRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="flex items-center gap-2 px-6 py-4 cursor-pointer active:scale-95 transition-transform bg-gray-200/30 dark:bg-gray-700/30 rounded-full backdrop-blur-sm"
            >
              {awards.map((_, i) => (
                <motion.div
                  layout
                  key={i}
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  className={`h-2 rounded-full pointer-events-none ${activeIndex === i ? 'w-10 bg-[var(--color-leo-maroon)] dark:bg-[var(--color-leo-gold)]' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAward(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedAward(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-[45%] h-[400px] md:h-auto overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center p-8">
                <div className="relative group w-full h-full flex items-center justify-center">
                  <div className="absolute -inset-2 bg-[var(--color-leo-gold)]/10 rounded-2xl blur-2xl group-hover:bg-[var(--color-leo-gold)]/20 transition-all duration-500" />
                  <img
                    src={selectedAward.image}
                    alt={selectedAward.title}
                    className="relative w-auto h-auto max-w-full max-h-full object-contain rounded-xl border-4 border-white dark:border-white shadow-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                  />
                  <div className="absolute top-0 right-0 bg-[var(--color-leo-gold)] p-2 rounded-lg shadow-lg">
                    <Trophy className="text-[var(--color-leo-maroon)] w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[55%] p-8 overflow-y-auto flex flex-col justify-center bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[var(--color-leo-gold)]/10 text-[var(--color-leo-gold)] border border-[var(--color-leo-gold)]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Award & Recognition
                  </span>
                  {selectedAward.year && (
                    <span className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      <Calendar size={14} className="mr-1 text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]" />
                      {selectedAward.year}
                    </span>
                  )}
                </div>

                <h3 className="text-3xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-6 leading-tight">
                  {selectedAward.title}
                </h3>

                {selectedAward.description ? (
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[var(--color-leo-gold)]/30 rounded-full" />
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-lg pl-4">
                      "{selectedAward.description}"
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No additional description available for this recognition.
                  </p>
                )}

                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                    Official Recognition • Leo Club of Sabaragamuwa University
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default Awards;
