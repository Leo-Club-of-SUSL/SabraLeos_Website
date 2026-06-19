import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Gallery from '../components/Gallery';
import Footer from '../components/Footer';

const GalleryPage = () => {
    const SITE_URL = "https://sabraleos.org";

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <Helmet>
                <title>SabraLeos Photo Gallery | Leo Club of Sabragamuwa University of Sri Lanka</title>
                <meta name="description" content="Browse through captures of our service projects, events, and meaningful moments. Experience the impact of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos)." />
                <meta name="keywords" content="sabraleos photo gallery, Sabra leos, Leo Club SUSL Gallery, SabraLeos Photos, Sabaragamuwa University Events, Sri Lanka Leos" />
                
                <link rel="canonical" href={`${SITE_URL}/gallery`} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/gallery`} />
                <meta property="og:title" content="SabraLeos Photo Gallery | Leo Club of Sabragamuwa University of Sri Lanka" />
                <meta property="og:description" content="Browse through captures of our service projects, events, and meaningful moments. Experience the impact of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos)." />
                <meta property="og:image" content={`${SITE_URL}/Images/Round_logo.png`} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${SITE_URL}/gallery`} />
                <meta name="twitter:title" content="SabraLeos Photo Gallery | Leo Club of Sabragamuwa University of Sri Lanka" />
                <meta name="twitter:description" content="Browse through captures of our service projects, events, and meaningful moments. Experience the impact of the Leo Club of Sabragamuwa University of Sri Lanka (SabraLeos)." />
                <meta name="twitter:image" content={`${SITE_URL}/Images/Round_logo.png`} />
            </Helmet>

            <Navbar />
            
            <main className="flex-grow pt-20">
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
                                    Gallery
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <Gallery enableLightbox={true} titleLevel="h1" />

                {/* Descriptive content section for SEO and heading hierarchy */}
                <section className="py-16 bg-white dark:bg-slate-900 transition-colors border-t border-gray-100 dark:border-slate-800">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
                            About SabraLeos Humanitarian Action
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-12 text-center text-lg font-light">
                            Our photo gallery captures the visual legacy of the Leo Club of Sabragamuwa University of Sri Lanka. 
                            Through these collections, we document our ongoing efforts to serve the local community, foster youth leadership, 
                            and drive impactful humanitarian and environmental projects in Sri Lanka.
                        </p>

                        <div className="space-y-12">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                                    Youth Leadership & Development
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Our members actively engage in capacity building, project management, and public speaking. 
                                    The images showcased here reflect various training programs, workshops, and team-building sessions 
                                    that shape the leaders of tomorrow. By taking charge of diverse initiatives, our youth members gain 
                                    invaluable real-world experience, developing skills that serve them in their professional and personal lives.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                                    Community Empowerment & Relief
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    From healthcare camps and educational workshops to disaster relief operations and donation drives, 
                                    our hands-on service projects address the critical needs of society. We partner with local groups 
                                    and Lions Clubs to deliver long-term support for underfunded schools, rural healthcare clinics, 
                                    and marginalized communities across the Sabaragamuwa province.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-leo-maroon)] dark:text-[var(--color-leo-gold)] mb-4">
                                    Environmental Stewardship
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Preserving the environment is one of our central pillars. Our gallery documents reforestation projects, 
                                    waste management campaigns, and conservation awareness workshops. We believe in taking direct action 
                                    to protect the beautiful Sabaragamuwa region, ensuring a green and sustainable future for upcoming generations.
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
                            <Link to="/e-magazine" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] font-semibold transition-colors no-underline">
                                E-Magazine
                            </Link>
                            <a href="/#contact" className="text-gray-600 dark:text-gray-400 hover:text-[var(--color-leo-maroon)] dark:hover:text-[var(--color-leo-gold)] font-semibold transition-colors no-underline">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default GalleryPage;
