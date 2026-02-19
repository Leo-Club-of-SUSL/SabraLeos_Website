import Navbar from '../components/Navbar';
import Gallery from '../components/Gallery';
import Footer from '../components/Footer';

const GalleryPage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-20">
                <Gallery />
            </main>
            <Footer />
        </div>
    );
};

export default GalleryPage;
