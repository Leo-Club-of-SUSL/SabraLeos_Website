import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Target, Eye, Award, Users, Heart } from 'lucide-react';

const About = () => {
  const { siteContent } = useData();

  return (
    <section id="about" className="py-20 bg-slate-50 dark:bg-slate-900/40 transition-colors duration-500 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[var(--color-leo-maroon)]/5 rounded-full blur-[120px] -mr-24 -mt-24 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[var(--color-leo-gold)]/5 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Mission & Vision (Stacked Asymmetrically) */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-leo-maroon)]/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-leo-maroon)] text-white text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-[var(--color-leo-maroon)]/20">
                <Target size={16} />
                Our Mission
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {siteContent.about_mission}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative bg-[#1a1a1a] p-8 rounded-[2rem] shadow-2xl overflow-hidden ml-4 md:ml-8"
            >
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[var(--color-leo-gold)]/10 rounded-full -mr-12 -mb-12 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-leo-gold)] text-slate-900 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-[var(--color-leo-gold)]/20">
                <Eye size={16} />
                Our Vision
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                {siteContent.about_vision}
              </p>
            </motion.div>
          </div>

          {/* Right Column: History & Values */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <span className="text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] text-sm font-black uppercase tracking-[0.4em] mb-4 block opacity-50">Discovery & Impact</span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Our Journey Through <br />
                <span className="text-[var(--color-leo-maroon)] italic">Collective Service</span>
              </h2>
              <div className="w-16 h-1 bg-[var(--color-leo-gold)] rounded-full mb-8"></div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-200 dark:border-slate-800 pl-6 mb-10">
                "{siteContent.about_history}"
              </p>

              {/* LEO Values Row */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm mx-auto mb-3 group-hover:border-[var(--color-leo-maroon)] group-hover:-translate-y-1 transition-all">
                    <Award className="text-[var(--color-leo-maroon)]" size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">Leadership</span>
                </div>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm mx-auto mb-3 group-hover:border-[var(--color-leo-gold)] group-hover:-translate-y-1 transition-all">
                    <Users className="text-[var(--color-leo-gold)]" size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">Experience</span>
                </div>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm mx-auto mb-3 group-hover:border-red-400 group-hover:-translate-y-1 transition-all">
                    <Heart className="text-red-500" size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">Opportunity</span>
                </div>
              </div>
            </motion.div>

            {/* Filosofy Banner */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.4 }}
               className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center"
            >
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                "{siteContent.about_values}"
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
