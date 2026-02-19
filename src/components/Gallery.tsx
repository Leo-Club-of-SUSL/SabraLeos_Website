import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';

interface GalleryProps {
  limit?: number;
  showButton?: boolean;
}

const Gallery = ({ limit, showButton = false }: GalleryProps) => {
  const { gallery } = useData();
  
  const displayedGallery = limit ? gallery.slice(0, limit) : gallery;

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
          {displayedGallery.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl group ${index === 0 || index === 3 ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <p className="text-white font-bold text-lg">{img.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {showButton && gallery.length > (limit || 0) && (
          <div className="flex justify-center mt-12">
            <Link 
              to="/gallery" 
              className="px-8 py-3 bg-[var(--color-leo-maroon)] text-white rounded-full font-semibold hover:bg-red-900 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Show More
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
