import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import GalleryPage from './pages/GalleryPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
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
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
