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
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-[var(--color-leo-maroon)]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tighter flex flex-col items-center">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">{siteContent.hero_title}</span>
              <span className="text-2xl md:text-4xl lg:text-5xl font-medium text-[var(--color-leo-gold)] drop-shadow-lg -mt-2">
                {siteContent.hero_subtitle}
              </span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl lg:text-2xl mb-12 text-white/90 font-light tracking-wide px-4"
          >
            {siteContent.hero_tagline}
          </motion.p>
 
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.8 }}
           >
             <Link to="contact" smooth={true} duration={500}>
               <motion.button
                 whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                 whileTap={{ scale: 0.95 }}
                 className="group relative bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] px-10 py-5 rounded-full font-black text-xl flex items-center mx-auto gap-3 overflow-hidden transition-all shadow-2xl cursor-pointer"
                 aria-label={`Scroll to ${siteContent.hero_cta}`}
               >
                 <span className="relative z-10">{siteContent.hero_cta}</span>
                 <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                 <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               </motion.button>
             </Link>
           </motion.div>

        </div>

      </div>
    </section>
  );
};

export default Hero;
