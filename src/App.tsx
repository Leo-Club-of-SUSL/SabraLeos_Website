import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import GalleryPage from './pages/GalleryPage';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
