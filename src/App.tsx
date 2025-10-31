import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { AdminPanel } from './pages/AdminPanel';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { DeliveryPolicyPage } from './pages/DeliveryPolicyPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { NotFound } from './components/pages/NotFound';
import { useOverlayScrollbars } from './hooks/useOverlayScrollbars';
import { OverlayScrollbars } from 'overlayscrollbars';
import './i18n';
import './App.css';
import './styles/overlayscrollbars.css';
import 'overlayscrollbars/overlayscrollbars.css';

function AppContent() {
  // Initialize OverlayScrollbars globally
  useOverlayScrollbars();

  // Force scrollbar initialization on mount
  React.useEffect(() => {
    // Ensure scrollbars are initialized on body
    const bodyElement = document.body;
    if (bodyElement && !bodyElement.hasAttribute('data-overlayscrollbars-initialize')) {
      OverlayScrollbars(bodyElement, {
        overflow: {
          x: 'hidden',
          y: 'scroll'
        },
        scrollbars: {
          visibility: 'visible',
          autoHide: 'never',
          theme: 'os-theme-spirit-hub'
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/delivery" element={<DeliveryPolicyPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
