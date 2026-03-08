import { Heart } from 'lucide-react';
import { useData } from '../context/DataContext';

const Footer = () => {
  const { siteContent } = useData();

  return (
    <footer className="bg-slate-900 text-white py-8 border-t border-white/10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <p className="font-bold text-lg">{siteContent.footer_club_name}</p>
          <p className="text-sm text-gray-400">{siteContent.footer_sponsor}</p>
        </div>

        <div className="flex items-center text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
          <span className="mx-2">|</span>
          <span className="flex items-center">
            Made by Leo Club of SUSL
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
