import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Loader2 } from 'lucide-react';

const Leadership = () => {
  const { leadership, loading, error } = useData();

  if (loading) {
    return (
      <section id="leadership" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-[var(--color-leo-maroon)] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading leadership...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="leadership" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              aria-label="Retry loading leadership"
              className="px-6 py-2 bg-[var(--color-leo-maroon)] text-white rounded-lg hover:bg-red-900 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="leadership" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">Our Leadership</h2>
          <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Meet the dedicated team leading our club towards excellence and service.
          </p>
        </motion.div>
 
        {/* Club Advisor */}
        {leadership.advisor && (
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-10 text-center border-b pb-4 max-w-xs mx-auto border-gray-200 dark:border-gray-700">Club Advisor</h3>
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="group relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 max-w-2xl w-full flex flex-col md:flex-row"
              >
                <div className="w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                  <img
                    src={leadership.advisor.image}
                    alt={leadership.advisor.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                  />
                </div>
                <div className="p-8 md:w-3/5 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--color-leo-maroon)] text-white text-[10px] uppercase font-bold tracking-widest">Advisory Board</span>
                  </div>
                  <h4 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-1">{leadership.advisor.name}</h4>
                  <p className="text-lg font-medium text-[var(--color-leo-gold)] dark:text-[var(--color-leo-gold)] mb-4">{leadership.advisor.position}</p>
                  <div className="w-12 h-1 bg-[var(--color-leo-gold)] rounded-full mb-4 opacity-30"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic leading-relaxed">
                    Provided guidance and academic mentorship as a lecturer, steering our club toward sustainable service and innovation.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Executive Committee */}
        {leadership.executive.length > 0 && (
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-10 text-center border-b pb-4 max-w-xs mx-auto border-gray-200 dark:border-gray-700">Executive Committee</h3>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
              {[...leadership.executive].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group w-full sm:w-60"
                >
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-lg group-hover:border-[var(--color-leo-gold)] transition-colors duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                    />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]">{member.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{member.position}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Chief Directors */}
        {leadership.chief && leadership.chief.length > 0 && (
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-10 text-center border-b pb-4 max-w-xs mx-auto border-gray-200 dark:border-gray-700">Chief Directors</h3>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12 max-w-4xl mx-auto">
              {[...(leadership.chief || [])].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group w-full sm:w-60"
                >
                  <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-lg group-hover:border-[var(--color-leo-gold)] transition-colors duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                    />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]">{member.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{member.position}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Board of Directors */}
        {leadership.board.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-10 text-center border-b pb-4 max-w-xs mx-auto border-gray-200 dark:border-gray-700">Board of Directors</h3>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-10 max-w-3xl mx-auto">
              {[...leadership.board].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group w-full sm:w-48"
                >
                  <div className="relative w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-md group-hover:border-[var(--color-leo-maroon)] dark:group-hover:border-[var(--color-leo-gold)] transition-colors duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                    />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">{member.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{member.position}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Past Presidents */}
        {leadership.pastPresidents && leadership.pastPresidents.length > 0 && (
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-10 text-center border-b pb-4 max-w-xs mx-auto border-gray-200 dark:border-gray-700">Past Presidents</h3>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
              {[...leadership.pastPresidents].sort((a,b) => (b.serviceYear || '').localeCompare(a.serviceYear || '')).map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group w-full sm:w-56"
                >
                  <div className="relative w-40 h-40 mx-auto mb-5 rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-md group-hover:border-[var(--color-leo-gold)] transition-all duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest">{member.serviceYear}</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-[var(--color-leo-maroon)] dark:group-hover:text-[var(--color-leo-gold)] transition-colors">{member.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-tighter mt-1">{member.serviceYear}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Leadership;
