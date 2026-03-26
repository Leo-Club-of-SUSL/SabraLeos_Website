import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Calendar, Users, ArrowRight, Clock, X } from 'lucide-react';

const Projects = () => {
  const { projects, loading, error } = useData();
  const [filter, setFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const categories = ['All', 'Completed', 'Ongoing', 'Upcoming'];

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProject]);

  const filteredProjects = filter === 'All'
    ? projects
    : projects.filter(p => p.category === filter);

  if (loading) {
    return (
      <section id="projects" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg mx-auto mb-4 skeleton"></div>
            <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full"></div>
          </div>
          <div className="flex gap-8 overflow-hidden pb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-none w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm h-[500px]">
                <div className="h-56 bg-gray-200 dark:bg-slate-700 skeleton"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-700 rounded skeleton"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded skeleton"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded skeleton"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 dark:bg-red-900/10 rounded-3xl p-12 border border-red-100 dark:border-red-900/20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <X className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load projects</h3>
            <p className="text-red-600 dark:text-red-400 mb-8 max-w-sm text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[var(--color-leo-maroon)] text-white rounded-full font-bold hover:bg-red-900 transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0 cursor-pointer"
            >
              Try Again
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

        <div className="relative">
          <motion.div 
            className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode='popLayout'>
              {filteredProjects.length > 0 ? (
                filteredProjects
                  .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                  })
                  .map((project) => (
                    <motion.div
                      layout
                      key={project.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedProject(project)}
                      className="flex-none w-80 md:w-96 snap-center bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col border border-gray-100 dark:border-slate-700 h-[500px] cursor-pointer"
                    >
                      <div className="relative h-56 overflow-hidden shrink-0">
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
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">{project.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-4 flex-grow text-sm">{project.description}</p>

                        <div className="space-y-3 mt-auto">
                          {project.date && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Calendar size={16} className="mr-2 text-[var(--color-leo-gold)]" />
                              <span>{project.date}</span>
                            </div>
                          )}
                          
                          {project.committee && project.committee.length > 0 && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Users size={16} className="mr-2 text-[var(--color-leo-gold)]" />
                              <span className="line-clamp-1">{project.committee.join(", ")}</span>
                            </div>
                          )}

                          {project.category === 'Ongoing' && project.status && (
                            <div className="flex items-center text-sm text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] font-medium">
                              <Clock size={16} className="mr-2" />
                              <span>{project.status}</span>
                            </div>
                          )}

                          {project.category === 'Upcoming' && project.registrationLink && (
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
                  ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full py-20 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No projects found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs">We don't have any projects in this category at the moment. Check back soon!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Custom Scrollbar Hint/Gradient */}
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-gray-50 dark:from-slate-950 pointer-events-none opacity-50"></div>
          <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-gray-50 dark:from-slate-950 pointer-events-none opacity-50"></div>
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
      </div>

      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/Images/Round_logo.png'; }}
                />
              </div>

              <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[var(--color-leo-maroon)]/10 dark:bg-[var(--color-leo-gold)]/10 text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {selectedProject.category}
                  </span>
                  {selectedProject.category === 'Ongoing' && selectedProject.status && (
                    <span className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Clock size={14} className="mr-1" />
                      {selectedProject.status}
                    </span>
                  )}
                </div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedProject.title}
                </h3>

                <div className="space-y-4 mb-8">
                  {selectedProject.date && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar size={18} className="mr-3 text-[var(--color-leo-gold)]" />
                      <span className="font-medium">{selectedProject.date}</span>
                    </div>
                  )}

                  {selectedProject.committee && selectedProject.committee.length > 0 && (
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <Users size={18} className="mr-3 mt-1 text-[var(--color-leo-gold)]" />
                      <div>
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-1">Organizing Committee</p>
                        <p className="font-medium">{selectedProject.committee.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedProject.description}
                  </p>
                </div>

                {selectedProject.category === 'Upcoming' && selectedProject.registrationLink && (
                  <div className="mt-8">
                    <a
                      href={selectedProject.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] py-4 rounded-xl font-bold hover:bg-[#eec136] transition-all transform hover:scale-[1.02] shadow-lg"
                    >
                      Register Now <ArrowRight size={20} className="ml-2" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Projects;
