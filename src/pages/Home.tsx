import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Leadership from '../components/Leadership';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
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
