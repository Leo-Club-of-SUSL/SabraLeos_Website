import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Leadership from '../components/Leadership';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://YOUR_DOMAIN';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>SabraLeos – Leo Club of Sabaragamuwa University of Sri Lanka</title>
        <meta name="description" content="Leo Club of Sabaragamuwa University of Sri Lanka – serving the community through leadership, experience, and opportunity." />
        <meta property="og:title" content="SabraLeos – Leo Club of SUSL" />
        <meta property="og:description" content="Leo Club of Sabaragamuwa University of Sri Lanka – serving the community through leadership, experience, and opportunity." />
        <meta property="og:image" content={`${BASE_URL}/Images/Round_logo.png`} />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Navbar />
      <Hero />
      <About />
      <Projects />
      <Leadership />
      <Gallery limit={6} showButton={true} />
      <Contact />
      <Footer />
    </>
  );
};

export default Home;
