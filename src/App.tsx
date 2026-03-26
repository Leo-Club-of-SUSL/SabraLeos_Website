import { useEffect, lazy, Suspense, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Page View Tracker Component
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Exclude admin routes from tracking
    if (!location.pathname.startsWith('/admin')) {
      ReactGA.send({ hitType: 'pageview', page: location.pathname });
    }
  }, [location.pathname]);

  return null;
};

// Hidden Admin Shortcut Handler
const KeyboardNavigator = () => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl + Shift + A
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'A') {
      e.preventDefault();
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Router>
              <KeyboardNavigator />
              <PageViewTracker />
              <main id="app-content">
                 <Suspense fallback={
                   <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors">
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="relative flex flex-col items-center"
                     >
                       <img src="/Images/Round_logo.png" alt="Leo Logo" className="w-24 h-24 mb-8 animate-pulse" />
                       <div className="w-48 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ x: '-100%' }}
                           animate={{ x: '100%' }}
                           transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                           className="w-full h-full bg-gradient-to-r from-[var(--color-leo-maroon)] to-[var(--color-leo-gold)]"
                         />
                       </div>
                       <p className="mt-4 text-xs font-bold tracking-[0.3em] uppercase text-gray-400 dark:text-gray-500">Loading Experience</p>
                     </motion.div>
                   </div>
                 }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            </Router>
          </ToastProvider>
          </DataProvider>
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
