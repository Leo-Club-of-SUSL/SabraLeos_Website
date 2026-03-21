import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Gallery from '../components/Gallery';
import Footer from '../components/Footer';



const GalleryPage = () => {
    const SITE_URL = "https://sabraleos.org";


    return (
        <div className="flex flex-col min-h-screen">
            <Helmet>
                <title>Photo Gallery | Leo Club of SUSL | SabraLeos</title>
                <meta name="description" content="Browse through capture of our service projects, events, and meaningful moments. Experience the impact of the Leo Club of Sabaragamuwa University of Sri Lanka." />
                <meta name="keywords" content="Leo Club SUSL Gallery, SabraLeos Photos, Sabaragamuwa University Events, Sri Lanka Leos, Club Activities, Community Service Photos" />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/gallery`} />
                <meta property="og:title" content="Photo Gallery | Leo Club of SUSL | SabraLeos" />
                <meta property="og:description" content="Browse through captures of our service projects, events, and meaningful moments." />
                <meta property="og:image" content={`${SITE_URL}/Images/Round_logo.png`} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${SITE_URL}/gallery`} />
                <meta name="twitter:title" content="Photo Gallery | Leo Club of SUSL | SabraLeos" />
                <meta name="twitter:description" content="Browse through captures of our service projects, events, and meaningful moments." />
                <meta name="twitter:image" content={`${SITE_URL}/Images/Round_logo.png`} />
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
