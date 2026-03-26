import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '../data';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  
  const isSolid = scrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Track active section for navbar highlighting
      if (isHomePage) {
        const sections = NAV_LINKS.map(link => link.href);
        const current = sections.find(section => {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top <= 150 && rect.bottom >= 150;
          }
          return false;
        });
        if (current) setActiveSection(current);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: id === 'home' ? 0 : offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (isHomePage) {
      setTimeout(() => {
        scrollToSection(href);
      }, 50);
    } else {
      navigate('/');
      setTimeout(() => {
        scrollToSection(href);
      }, 300);
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isSolid ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center" role="navigation">
        <div 
          onClick={() => {
            if (isHomePage) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setActiveSection('home');
            } else {
              navigate('/');
              window.scrollTo(0, 0);
            }
          }} 
          className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0 focus-visible:ring-2 focus-visible:ring-leo-gold rounded-lg no-underline group"
          role="button"
          tabIndex={0}
          aria-label="Leo Club of SUSL Home"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (isHomePage) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveSection('home');
              }
              else navigate('/');
            }
          }}
        >
          <img
            src="/Images/Round_logo.png"
            alt="Leo Club Round Logo"
            className="w-10 h-10 lg:w-12 lg:h-12 object-contain drop-shadow-md transition-transform group-hover:scale-105"
          />
          <div className={`flex flex-col items-start leading-none transition-colors duration-300 ${isSolid ? 'text-[var(--color-leo-maroon)] dark:text-white' : 'text-white'}`}>
            <span className="text-lg lg:text-2xl font-black tracking-tighter uppercase">LEO CLUB</span>
            <span className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.1em] ${isSolid ? 'text-[var(--color-leo-gold)]' : 'text-[var(--color-leo-gold)]'}`}>
              Sabaragamuwa University of Sri Lanka
            </span>
          </div>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center space-x-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.name}>
              <button
                onClick={() => handleNavClick(link.href)}
                className={`group relative cursor-pointer font-semibold text-sm transition-colors bg-transparent border-none py-2 ${
                  activeSection === link.href 
                    ? (isSolid ? 'text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)]' : 'text-[var(--color-leo-gold)]')
                    : isSolid ? 'text-gray-600 dark:text-gray-300 hover:text-[var(--color-leo-maroon)]' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[var(--color-leo-gold)] transition-all duration-300 ${activeSection === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            </li>
          ))}

          <li className={`w-px h-6 mx-4 ${isSolid ? 'bg-gray-300 dark:bg-gray-700' : 'bg-white/30'}`} aria-hidden="true"></li>

          <li>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${isSolid ? 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-yellow-400' : 'hover:bg-white/10 text-white'}`}
              aria-label={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${isSolid ? 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-yellow-400' : 'hover:bg-white/10 text-white'}`}
            aria-label={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={`flex items-center justify-center p-2 rounded-lg ${isSolid ? 'text-gray-700 dark:text-white hover:bg-gray-100' : 'text-white hover:bg-white/10'}`} 
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 overflow-hidden shadow-2xl"
          >
            <ul className="flex flex-col py-4 list-none m-0 p-0">
              {NAV_LINKS.map((link) => (
                <li key={link.name} className="w-full">
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className={`w-full text-left px-8 py-4 font-bold text-lg cursor-pointer transition-all flex items-center justify-between group ${
                      activeSection === link.href
                        ? 'bg-[var(--color-leo-maroon)] text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{link.name}</span>
                    {activeSection === link.href && <ArrowRight size={20} />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
