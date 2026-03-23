import { useEffect, lazy, Suspense, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';
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

                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                  <div className="w-12 h-12 border-4 border-[var(--color-leo-maroon)] border-t-transparent rounded-full animate-spin"></div>
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
