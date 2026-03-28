import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';



interface GalleryProps {
  limit?: number;
  showButton?: boolean;
  enableLightbox?: boolean;
}

const Gallery = ({ limit, showButton = false, enableLightbox = false }: GalleryProps) => {
  const { gallery, loading } = useData();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Optimizing Cloudinary URLs for faster grid loading
  const getOptimizedUrl = (url: string, params: string) => {
    if (url && url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/${params}/${parts[1]}`;
      }
    }
    return url;
  };

  // If limit is provided, we are on the Home Feed. Use sortOrder.
  // Otherwise, use id descending for the full Library view.
  const sortedGallery = limit
    ? [...gallery].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return b.id - a.id;
    })
    : [...gallery].sort((a, b) => b.id - a.id);

  const homeGallery = limit ? sortedGallery.filter(img => img.showOnHome) : sortedGallery;
  
  // If limit is provided, we use that. 
  // If not, we show everything (all images at once) as per user request.
  const displayedGallery = limit
    ? homeGallery.slice(0, limit)
    : homeGallery;
  
  

  if (loading && gallery.length === 0) {
    return (
      <section id="gallery" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-4 skeleton"></div>
            <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`rounded-xl bg-gray-200 dark:bg-slate-800 skeleton ${i === 1 || i === 4 ? 'md:col-span-2 md:row-span-2' : ''}`}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">Gallery</h2>
          <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Capturing moments of service, friendship, and impact.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
          {displayedGallery.length > 0 ? (
            displayedGallery.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => enableLightbox && setSelectedImage(img.src)}
                className={`relative overflow-hidden rounded-xl group ${index === 0 || index === 3 ? 'md:col-span-2 md:row-span-2' : ''} ${enableLightbox ? 'cursor-pointer' : ''}`}
              >
                <img
                  src={getOptimizedUrl(img.src, (index === 0 || index === 3) ? 'w_1200,c_fill,f_auto,q_auto' : 'w_600,c_fill,f_auto,q_auto')}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white font-bold text-lg">{img.alt}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <X className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No images found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs">We haven't shared any moments in this category yet. Stay tuned!</p>
            </div>
          )}
        </div>

        {showButton && homeGallery.length > 0 && (
          <div className="flex justify-center mt-16">
            <Link to="/gallery" className="group relative" aria-label="Explore all gallery moments">
               {/* Background Layer with animated border */}
               <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-leo-maroon)] to-[var(--color-leo-gold)] rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" aria-hidden="true"></div>
               
               <div className="relative flex items-center gap-3 px-10 py-4 bg-white dark:bg-slate-900 ring-1 ring-gray-200 dark:ring-slate-800 rounded-full leading-none transition-all duration-300 group-hover:scale-105" aria-hidden="true">
                 <span className="text-gray-800 dark:text-gray-100 font-bold group-hover:text-[var(--color-leo-maroon)] dark:group-hover:text-[var(--color-leo-gold)] transition-colors">EXPLORE ALL MOMENTS</span>
                 <motion.div
                   animate={{ x: [0, 5, 0] }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                 >
                   <ArrowRight size={20} className="text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]" />
                 </motion.div>
               </div>
            </Link>
          </div>
        )}

        {/* Load more button removed as per request for all-at-once loading */}

      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <button 
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <X size={28} />
            </button>
            <motion.img
              key={selectedImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={getOptimizedUrl(selectedImage, 'f_auto,q_auto:best')}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
              alt="Enlarged gallery view"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const ArrowRight = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default Gallery;

