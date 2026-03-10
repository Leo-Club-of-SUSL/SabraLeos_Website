import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 text-center px-6">
            <h1 className="text-8xl font-bold text-[var(--color-leo-maroon)] dark:text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Page Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                className="px-8 py-3 bg-[var(--color-leo-maroon)] text-white rounded-full font-semibold hover:bg-red-900 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
