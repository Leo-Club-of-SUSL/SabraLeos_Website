import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Leadership from '../components/Leadership';
import Awards from '../components/Awards';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Home = () => {
  const SITE_URL = "https://sabraleos.org";


  const { loading } = useData();
  const location = useLocation();

  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '');
      let attempts = 0;
      const maxAttempts = 5;
      
      const performScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: attempts === 0 ? 'auto' : 'smooth'
          });

          // If we haven't reached the end of the attempts, try again in case content expanded
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(performScroll, 500);
          }
        }
      };

      // Initial jump
      performScroll();
    }
  }, [loading, location.hash]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Leo Club of Sabragamuwa University of Sri Lanka",
    "alternateName": "Leo Club of SUSL",
    "url": SITE_URL,
    "logo": `${SITE_URL}/Images/Round_logo.png`,
    "sameAs": [], // Add social media URLs here if available
    "description": "The official Leo Club of Sabragamuwa University of Sri Lanka – serving the community through leadership, experience, and opportunity.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Belihuloya",
      "addressRegion": "Sabaragamuwa",
      "addressCountry": "Sri Lanka"
    }
  };

  return (
    <>
      <Helmet>
        <title>Leo Club of SUSL | SabraLeos of Sabragamuwa University</title>
        <meta name="description" content="Official website of the Leo Club of Sabragamuwa University of Sri Lanka (SUSL). Join SabraLeos (sabraleos.org) for leadership, experience, and opportunity for a better community." />
        <meta name="keywords" content="sabraleos, Sabra leos, Leo club of SUSL, Leo club of sabaragamuwa university, Sri Lanka, Leo Club, SUSL, Sabragamuwa University, Sri Lanka, Leo Club of Sabragamuwa, SabraLeos, Community Service, Leadership, Youth Organization" />
        
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="Leo Club of SUSL | SabraLeos of Sabragamuwa University" />
        <meta property="og:description" content="Official website of the Leo Club of Sabragamuwa University of Sri Lanka (SUSL). Join us in leadership, experience, and opportunity." />
        <meta property="og:image" content={`${SITE_URL}/Images/Round_logo.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_URL} />
        <meta name="twitter:title" content="Leo Club of SUSL | SabraLeos of Sabragamuwa University" />
        <meta name="twitter:description" content="Official website of the Leo Club of Sabragamuwa University of Sri Lanka (SUSL). Join us in leadership, experience, and opportunity." />
        <meta name="twitter:image" content={`${SITE_URL}/Images/Round_logo.png`} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <Navbar />
      <main id="main-content">
        <Hero />
        <About />
        <Projects />
        <Leadership />
        <Awards />
        <Gallery limit={6} showButton={true} />
        <Contact />
      </main>
      <Footer />

    </>
  );
};

export default Home;
