import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Loader2, Trophy } from 'lucide-react';

const Awards = () => {
  const { awards, loading } = useData();

  if (loading && awards.length === 0) {
    return (
      <section id="awards" className="py-20 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-12 h-12 text-[var(--color-leo-maroon)] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading awards...</p>
          </div>
        </div>
      </section>
    );
  }

  if (awards.length === 0) return null;

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

        <div className="relative">
          <motion.div 
            className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar"
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
                className="flex-none w-64 snap-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group-hover:border-[var(--color-leo-gold)] transition-all duration-500">
                  <img
                    src={award.image}
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
                  <h4 className="text-xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-1 line-clamp-2 px-2 h-14 flex items-center justify-center">
                    {award.title}
                  </h4>
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
          
          {/* Custom Scrollbar Hint/Gradient */}
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-gray-50 dark:from-slate-900 pointer-events-none opacity-50"></div>
          <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-gray-50 dark:from-slate-900 pointer-events-none opacity-50"></div>
        </div>

        <div className="mt-12 flex justify-center gap-2">
            <div className="h-1.5 w-8 bg-[var(--color-leo-maroon)] rounded-full"></div>
            <div className="h-1.5 w-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="h-1.5 w-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>

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
