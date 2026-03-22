
import { useData } from '../context/DataContext';

const Footer = () => {
  const { siteContent } = useData();

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 transition-colors duration-300" role="contentinfo">
      <div className="container mx-auto px-6 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">
          
          {/* Left Side: Club Info */}
          <div className="text-center lg:text-left">
            <h2 className="font-bold text-lg md:text-xl mb-1 text-slate-800 dark:text-white">{siteContent.footer_club_name}</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{siteContent.footer_sponsor}</p>
          </div>

          {/* Right Side: Copyright & Logo */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-4 md:gap-6 lg:ml-auto">
            <div className="flex flex-wrap justify-center items-center text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center gap-x-2 gap-y-1">
              <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
              <span className="hidden md:inline" aria-hidden="true">|</span>
              <span className="w-full md:hidden"></span>
              <span>Made by Leo Club of SUSL</span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-gray-300 dark:bg-slate-700" aria-hidden="true"></div>
            
            <img 
              src="/Images/Leo_LogoLine.png" 
              alt="Leo Logo Line" 
              className="h-8 md:h-10 lg:h-12 w-auto object-contain bg-white dark:bg-white/95 p-1.5 md:p-2 rounded-lg shadow-sm"
              loading="lazy"
            />
          </div>
          
        </div>
      </div>
    </footer>

  );
};

export default Footer;
