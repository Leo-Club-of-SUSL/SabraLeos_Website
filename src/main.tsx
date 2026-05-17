import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import ReactGA from 'react-ga4'
import './index.css'
import App from './App.tsx'

// Google Analytics 4 Initialization
// Set VITE_GA4_MEASUREMENT_ID in your .env file and Cloudflare Pages env vars
const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-57YGDY6C62';
if (GA4_ID) {
  ReactGA.initialize(GA4_ID);
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
