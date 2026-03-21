
import { useData } from '../context/DataContext';

const Footer = () => {
  const { siteContent } = useData();

  return (
    <footer className="bg-slate-900 text-white py-12 border-t border-white/10" role="contentinfo">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="font-bold text-xl mb-1">{siteContent.footer_club_name}</h2>
          <p className="text-sm text-gray-300 font-medium">{siteContent.footer_sponsor}</p>
        </div>

        <div className="flex flex-col md:items-end items-center gap-2">
          <div className="flex items-center text-sm text-gray-400">
            <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
            <span className="mx-2" aria-hidden="true">|</span>
            <span>Made by Leo Club of SUSL</span>
          </div>
        </div>
      </div>
    </footer>

  );
};

export default Footer;
