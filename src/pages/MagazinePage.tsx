// src/pages/MagazinePage.tsx
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MagazineCard from '../components/magazine/MagazineCard';
const MagazineViewer = React.lazy(() => import('../components/magazine/MagazineViewer'));
import { fetchMagazines } from '../services/magazineService';
import type { Magazine } from '../types/magazine';

const SITE_URL = 'https://sabraleos.org';
const LIMIT = 12;

// Skeleton card matching 3:4 cover ratio
const MagazineCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
    <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
    <div className="p-4 space-y-2">
      <div className="h-3 w-20 skeleton rounded" />
      <div className="h-4 w-full skeleton rounded" />
      <div className="h-3 w-3/4 skeleton rounded" />
      <div className="h-8 w-24 skeleton rounded-lg mt-3" />
    </div>
  </div>
);

// Year filter options
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR - i));

const MagazinePage = () => {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [yearFilter, setYearFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedMagazine, setSelectedMagazine] = useState<Magazine | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMagazines = useCallback(
    async (p: number, year: string, tag: string) => {
      setLoading(true);
      try {
        const res = await fetchMagazines(p, LIMIT, year || undefined, tag || undefined);
        setMagazines(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Failed to fetch magazines:', err);
        setMagazines([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced filter change
  const handleFilterChange = (newYear: string, newTag: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadMagazines(1, newYear, newTag);
    }, 300);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMagazines(1, '', '');
  }, [loadMagazines]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYearFilter(val);
    handleFilterChange(val, tagFilter);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTagFilter(val);
    handleFilterChange(yearFilter, val);
  };

  const clearFilters = () => {
    setYearFilter('');
    setTagFilter('');
    setPage(1);
    loadMagazines(1, '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadMagazines(newPage, yearFilter, tagFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = yearFilter || tagFilter;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>SabraLeos E-Magazine Archive | Leo Club of Sabragamuwa University</title>
        <meta
          name="description"
          content="Read the official E-Magazines of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos). Browse all volumes and issues online."
        />
        <meta
          name="keywords"
          content="SabraLeos E-Magazine, Leo Club SUSL magazine, Sabaragamuwa University Leo Club, SabraLeos journal"
        />
        <link rel="canonical" href={`${SITE_URL}/e-magazine`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/e-magazine`} />
        <meta property="og:title" content="SabraLeos E-Magazine Archive | Leo Club of Sabragamuwa University" />
        <meta
          property="og:description"
          content="Read the official E-Magazines of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos). Browse all volumes and issues online."
        />
        <meta property="og:image" content={`${SITE_URL}/Images/Round_logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${SITE_URL}/e-magazine`} />
        <meta name="twitter:title" content="SabraLeos E-Magazine Archive | Leo Club of Sabragamuwa University" />
        <meta
          name="twitter:description"
          content="Read the official E-Magazines of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos). Browse all volumes and issues online."
        />
        <meta name="twitter:image" content={`${SITE_URL}/Images/Round_logo.png`} />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-20" id="magazine-main">
        {/* Breadcrumbs */}
        <div className="bg-gray-50 dark:bg-slate-950/20 pt-6 transition-colors">
          <div className="container mx-auto px-6">
            <nav className="flex text-xs md:text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-2 list-none p-0 m-0">
                <li className="inline-flex items-center">
                  <Link to="/" className="hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] transition-colors no-underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-gray-400 font-light">/</li>
                <li className="text-gray-800 dark:text-slate-200">
                  E-Magazine
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <section id="e-magazine" className="py-20 bg-gray-50 dark:bg-slate-950 transition-colors duration-300 pt-10">
          <div className="container mx-auto px-6">

            {/* Section heading — matches Gallery.tsx pattern exactly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">
                SabraLeos E-Magazine Archive
              </h1>
              <div className="w-20 h-1 bg-[var(--color-leo-gold)] mx-auto rounded-full mb-6" />
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Browse and read the official publications of the Leo Club of Sabragamuwa University of Sri Lanka.
              </p>
            </motion.div>

            {/* Filter bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <div className="flex-1 min-w-[140px] max-w-xs">
                <select
                  id="magazine-year-filter"
                  value={yearFilter}
                  onChange={handleYearChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none transition-all"
                  aria-label="Filter by year"
                >
                  <option value="">All Years</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[160px] max-w-xs relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="magazine-tag-filter"
                  type="text"
                  placeholder="Filter by tag…"
                  value={tagFilter}
                  onChange={handleTagChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/40 outline-none transition-all"
                  aria-label="Filter by tag"
                />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] transition-colors"
                  aria-label="Clear filters"
                >
                  <X size={14} />
                  Clear
                </button>
              )}

              <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                {total} {total === 1 ? 'issue' : 'issues'}
              </span>
            </motion.div>

            {/* Magazine grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <MagazineCardSkeleton key={i} />
                ))}
              </div>
            ) : magazines.length === 0 ? (
              // Empty state — matches Gallery.tsx style
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No magazines found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  {hasFilters
                    ? 'No magazines match your current filters. Try adjusting them.'
                    : "We haven't published any magazines yet. Stay tuned!"}
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-[var(--color-leo-maroon)] text-white rounded-xl text-sm font-medium hover:bg-[#600000] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {magazines.map((mag, i) => (
                  <MagazineCard
                    key={mag.id}
                    magazine={mag}
                    onRead={setSelectedMagazine}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mt-12"
              >
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  id="magazine-prev-page"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  id="magazine-next-page"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Descriptive content section for SEO and heading hierarchy */}
        <section className="py-16 bg-white dark:bg-slate-900 transition-colors border-t border-gray-100 dark:border-slate-800 mt-16">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
              About SabraLeos Publications & E-Magazines
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-12 text-center text-lg font-light">
              The E-Magazine portal serves as the official digital archive of publications by the Leo Club of Sabragamuwa University of Sri Lanka. 
              Our digital magazines showcase quarterly reports, inspiring service logs, creative contributions, and key insights 
              from our club operations and youth leadership projects.
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                  Why Read Our E-Magazines?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Our issues offer readers a detailed look at how we carry out youth development, community service, and environmental restoration programs. 
                  Every volume acts as a historical record, featuring articles written by our talented members, poetry, and features on 
                  our exemplary Leos who have shown exceptional dedication to volunteerism.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                  Open Access & Digital Archive
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We believe in transparency and knowledge sharing. All our publications are open access, meaning anyone in the global community 
                  can read and download them. This helps keep our sponsors, partners, and the general public updated on the 
                  direct impact of their support and contributions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                  Contribute to Our Next Issue
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We are always looking for creative writers, photographers, and editors from the Sabragamuwa University community. 
                  If you are interested in sharing an article, a piece of poetry, or a service story in our upcoming edition, 
                  please reach out to our editorial board through the contact form on our homepage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Internal Navigation for better crawlability */}
        <div className="py-12 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-slate-800 transition-colors">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider">Explore More of SabraLeos</h3>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] font-semibold transition-colors no-underline">
                Home
              </Link>
              <Link to="/gallery" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] font-semibold transition-colors no-underline">
                Photo Gallery
              </Link>
              <a href="/#contact" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] font-semibold transition-colors no-underline">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* PDF Viewer Modal */}
      <Suspense fallback={null}>
        <MagazineViewer
          magazine={selectedMagazine}
          onClose={() => setSelectedMagazine(null)}
        />
      </Suspense>
    </div>
  );
};

export default MagazinePage;
