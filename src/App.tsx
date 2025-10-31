import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { AdminPanel } from './pages/AdminPanel';
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
