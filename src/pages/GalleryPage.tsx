import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Gallery from '../components/Gallery';
import Footer from '../components/Footer';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://YOUR_DOMAIN';

const GalleryPage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Helmet>
                <title>Gallery – SabraLeos | Leo Club of SUSL</title>
                <meta name="description" content="Explore photos from Leo Club of Sabaragamuwa University of Sri Lanka events and activities." />
                <meta property="og:title" content="Gallery – SabraLeos | Leo Club of SUSL" />
                <meta property="og:description" content="Explore photos from Leo Club of Sabaragamuwa University of Sri Lanka events and activities." />
                <meta property="og:image" content={`${BASE_URL}/Images/Round_logo.png`} />
                <meta property="og:url" content={`${BASE_URL}/gallery`} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            <Navbar />
            <main className="flex-grow pt-20">
                <Gallery />
            </main>
            <Footer />
        </div>
    );
};

export default GalleryPage;
