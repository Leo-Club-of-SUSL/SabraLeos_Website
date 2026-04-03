import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-center px-6 transition-colors">
            <Helmet>
                <title>404 - Page Not Found | Leo Club of SUSL</title>
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <img src="/Images/Round_logo.png" alt="Leo Logo" className="w-24 h-24 mx-auto mb-8 grayscale opacity-50" />
                
                <h1 className="text-9xl font-black text-gray-100 dark:text-slate-900 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10 select-none">404</h1>
                
                <h2 className="text-4xl font-black text-[var(--color-leo-maroon)] dark:text-white mb-4">Lost in Service?</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                    The page you're looking for seems to have vanished. Even the best leaders sometimes take a wrong turn!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-leo-maroon)] text-white rounded-full font-bold hover:bg-red-900 transition-all shadow-lg hover:shadow-red-900/20 active:scale-95 gap-2"
                    >
                        <Home size={20} />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all gap-2"
                    >
                        <ArrowLeft size={20} />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
