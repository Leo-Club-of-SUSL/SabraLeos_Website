import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Calendar, Users, ArrowRight, Clock, Loader2 } from 'lucide-react';

const Projects = () => {
  const { projects, loading, error } = useData();
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Completed', 'Ongoing', 'Upcoming'];

  const filteredProjects = filter === 'All'
    ? projects
    : projects.filter(p => p.category === filter);

  if (loading) {
    return (
      <section id="projects" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-[var(--color-leo-maroon)] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              aria-label="Retry loading projects"
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
    <section id="projects" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">Our Projects</h2>
          <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full mb-8"></div>

          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${filter === cat
                  ? 'bg-[var(--color-leo-maroon)] text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode='popLayout'>
            {filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col border border-gray-100 dark:border-slate-700"
              >
                <div className="relative h-48 overflow-hidden shrink-0">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] uppercase tracking-wider">
                    {project.category}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">{project.description}</p>

                  <div className="space-y-3 mt-auto">
                    {project.category === 'Completed' && (
                      <>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar size={16} className="mr-2 text-[var(--color-leo-gold)]" />
                          <span>{project.date}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Users size={16} className="mr-2 text-[var(--color-leo-gold)]" />
                          <span>{project.committee?.join(", ")}</span>
                        </div>
                      </>
                    )}

                    {project.category === 'Ongoing' && (
                      <div className="flex items-center text-sm text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] font-medium">
                        <Clock size={16} className="mr-2" />
                        <span>{project.status}</span>
                      </div>
                    )}

                    {project.category === 'Upcoming' && (
                      <a
                        href={project.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] py-2 rounded-lg font-bold hover:bg-[#eec136] transition-colors"
                      >
                        Join Project <ArrowRight size={16} className="ml-2" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
