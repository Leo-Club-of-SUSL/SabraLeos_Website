import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Target, Eye, History, Heart } from 'lucide-react';

const About = () => {
  const { siteContent } = useData();

  const cards = [
    { title: "Our Mission", text: siteContent.about_mission, icon: Target },
    { title: "Our Vision", text: siteContent.about_vision, icon: Eye },
    { title: "Our History", text: siteContent.about_history, icon: History },
  ];

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">Who We Are</h2>
          <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700"
            >
              <div className="w-14 h-14 bg-[var(--color-leo-maroon)]/10 dark:bg-[var(--color-leo-maroon)]/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                <card.icon className="text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 bg-[var(--color-leo-maroon)] rounded-3xl p-10 md:p-16 text-white text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            {/* Abstract pattern could go here */}
          </div>
          <Heart className="w-16 h-16 mx-auto mb-6 text-[var(--color-leo-gold)]" />
          <h3 className="text-3xl font-bold mb-6">Our Core Values</h3>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-red-100">
            {siteContent.about_values}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
