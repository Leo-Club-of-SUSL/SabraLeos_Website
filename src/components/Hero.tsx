import { motion } from 'framer-motion';
import { Link } from 'react-scroll';
import { useData } from '../context/DataContext';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const { siteContent } = useData();

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={siteContent.hero_bg_image}
          alt="Leo Club Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--color-leo-maroon)]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight flex flex-col gap-2">
            <span>{siteContent.hero_title}</span>
            <span className="text-2xl md:text-4xl font-medium text-gray-200">{siteContent.hero_subtitle}</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-gray-100 font-light">
            {siteContent.hero_tagline}
          </p>

          <Link to="contact" smooth={true} duration={500}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] px-8 py-4 rounded-full font-bold text-lg flex items-center mx-auto gap-2 hover:bg-white transition-colors shadow-lg cursor-pointer"
            >
              {siteContent.hero_cta}
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
