import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '../data';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Small timeout to allow potential navigation/rendering to complete if needed, 
      // but for same-page it should be almost instant.
      // However, for pure same-page smooth scroll, we can just call it directly.
      // If we are redirecting from another page, the timeout in handleNavClick handles it.
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (isHomePage) {
      scrollToSection(href);
    } else {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        scrollToSection(href);
      }, 100);
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer">
          <img
            src="/Images/Round_logo.png"
            alt="Leo Club Logo"
            className="w-12 h-12 lg:w-14 lg:h-14 object-contain drop-shadow-md"
          />
          <div className={`font-bold tracking-tighter flex flex-col leading-tight ${scrolled ? 'text-[var(--color-leo-maroon)] dark:text-white' : 'text-white'}`}>
            <span className="text-xl lg:text-2xl">LEO CLUB</span>
            <span className="text-xs lg:text-sm font-medium opacity-90">Sabaragamuwa University of Sri Lanka</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className={`cursor-pointer font-medium transition-colors bg-transparent border-none ${scrolled ? 'text-gray-700 dark:text-gray-300 hover:text-[var(--color-leo-gold)]' : 'text-white/90 hover:text-[var(--color-leo-gold)]'}`}
            >
              {link.name}
            </button>
          ))}

          <div className={`w-px h-6 mx-4 ${scrolled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-white/30'}`}></div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${scrolled ? 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-yellow-400' : 'hover:bg-white/10 text-white'}`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <RouterLink
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-leo-maroon)] text-white hover:bg-red-900 transition-colors text-sm font-medium"
          >
            <UserCog size={16} />
            Admin
          </RouterLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-yellow-400 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-white" aria-label={isOpen ? "Close menu" : "Open menu"}>
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
            className="lg:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800"
          >
            <div className="flex flex-col items-center py-4 space-y-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-gray-700 dark:text-gray-300 hover:text-[var(--color-leo-gold)] cursor-pointer font-medium text-lg bg-transparent border-none"
                >
                  {link.name}
                </button>
              ))}
              <RouterLink
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-[var(--color-leo-maroon)] text-white hover:bg-red-900 transition-colors font-medium"
              >
                <UserCog size={18} />
                Admin Login
              </RouterLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
