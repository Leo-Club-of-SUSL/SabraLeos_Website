// src/components/magazine/MagazineCard.tsx
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Download } from 'lucide-react';
import type { Magazine } from '../../types/magazine';

interface MagazineCardProps {
  magazine: Magazine;
  onRead: (magazine: Magazine) => void;
  index: number;
}

const MagazineCard = ({ magazine, onRead, index }: MagazineCardProps) => {
  const {
    title,
    volume_number,
    issue_number,
    published_date,
    cover_url,
    description,
    is_downloadable,
  } = magazine;

  const volumeLabel =
    volume_number != null && issue_number != null
      ? `Vol. ${volume_number}, Issue ${issue_number}`
      : volume_number != null
      ? `Vol. ${volume_number}`
      : issue_number != null
      ? `Issue ${issue_number}`
      : null;

  const formattedDate = published_date
    ? new Date(published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col group cursor-pointer transition-shadow duration-300"
      onClick={() => onRead(magazine)}
      role="article"
      aria-label={`Read ${title}`}
      id={`magazine-card-${magazine.id}`}
    >
      {/* Cover image — 3:4 aspect ratio */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {cover_url ? (
          <img
            src={cover_url}
            alt={`${title} cover`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        {/* Placeholder (shown when no cover or on image error) */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-leo-maroon)] to-[#600000] ${cover_url ? 'hidden' : ''}`}
          aria-hidden="true"
        >
          <BookOpen size={48} className="text-[var(--color-leo-gold)] mb-3 opacity-80" />
          <span className="text-white/60 text-xs font-medium uppercase tracking-widest px-4 text-center">
            {title}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-bold text-sm bg-[var(--color-leo-maroon)] px-4 py-2 rounded-full">
            Read Now
          </span>
        </div>

        {/* Download badge */}
        {is_downloadable && (
          <div className="absolute top-2 right-2 bg-[var(--color-leo-gold)] text-[#600000] p-1.5 rounded-full shadow-md" aria-label="Downloadable">
            <Download size={12} />
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {volumeLabel && (
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-leo-gold)]">
            {volumeLabel}
          </span>
        )}

        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {formattedDate && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Calendar size={11} />
              {formattedDate}
            </span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onRead(magazine); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-leo-maroon)] text-white text-xs font-bold rounded-lg hover:bg-[#600000] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-leo-gold)] focus-visible:outline-none"
            aria-label={`Read ${title}`}
          >
            <BookOpen size={12} />
            Read
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default MagazineCard;
