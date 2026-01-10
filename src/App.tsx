import { Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { RegionProvider } from './contexts/RegionContext';
import { Navigation } from './components/layout/Navigation';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { RegionRedirect } from './components/layout/RegionRedirect';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import {
  AdminLayout,
  AdminDashboard,
  CategoriesManagement,
  ProductsManagement,
  UsersManagement,
  SeoManagement,
  OrdersManagement,
  ReportsManagement,
  SystemSettings,
  NewsletterManagement,
  EmailSettingsManagement,
} from './components/admin';
import { CategoryAddPage } from './pages/CategoryAddPage';
import { CategoryEditPage } from './pages/CategoryEditPage';
import { ProductAddPage } from './pages/ProductAddPage';
import { ProductEditPage } from './pages/ProductEditPage';
import { ProductAttributesPage } from './pages/ProductAttributesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { DeliveryPolicyPage } from './pages/DeliveryPolicyPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { NotFound } from './components/pages/NotFound';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { PaymentCancelledPage } from './pages/PaymentCancelledPage';
import { PaymentErrorPage } from './pages/PaymentErrorPage';
import { RequireAuth } from './components/auth/RequireAuth';
import { AdminRegionRedirect } from './components/admin/AdminRegionRedirect';
import { initVisitorTracking } from './lib/visitorTracking';
import { migrateCartToRegionBased } from './lib/migrateCart';
import { useEffect } from 'react';
import './i18n';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');

  // Initialize visitor tracking on app load
  useEffect(() => {
    initVisitorTracking();
  }, []);

  // Migrate old cart to region-based storage on first load
  useEffect(() => {
    migrateCartToRegionBased();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <RegionRedirect />
      <Navigation />
      <MobileBottomNav />
      <CartDrawer />
      <ScrollToTop />
      <Toaster position="top-center" duration={2000} richColors />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<HomePage />} />
        
        {/* Region-specific routes - /om and /sa */}
        <Route path="/om" element={<HomePage />} />
        <Route path="/om/profile" element={<ProfilePage />} />
        <Route path="/om/favorites" element={<FavoritesPage />} />
        <Route path="/om/orders" element={<OrdersPage />} />
        <Route path="/om/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/om/about" element={<AboutPage />} />
        <Route path="/om/contact" element={<ContactPage />} />
        <Route path="/om/faq" element={<FAQPage />} />
        <Route path="/om/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/om/terms" element={<TermsConditionsPage />} />
        <Route path="/om/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/om/refund" element={<RefundPolicyPage />} />
        <Route path="/om/products" element={<ProductsPage />} />
        <Route path="/om/products/:productId" element={<ProductDetailPage />} />
        <Route path="/om/login" element={<LoginPage />} />
        <Route path="/om/register" element={<RegisterPage />} />
        <Route path="/om/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/om/reset-password" element={<ResetPasswordPage />} />
        <Route path="/om/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/om/checkout/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/om/checkout/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/om/checkout/payment-failed" element={<PaymentFailurePage />} />
        <Route path="/om/checkout/payment-error" element={<PaymentErrorPage />} />
        <Route path="/om/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
        <Route path="/om/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/om/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/om/payment/cancelled" element={<PaymentCancelledPage />} />
        
        {/* Saudi Arabia routes */}
        <Route path="/sa" element={<HomePage />} />
        <Route path="/sa/profile" element={<ProfilePage />} />
        <Route path="/sa/favorites" element={<FavoritesPage />} />
        <Route path="/sa/orders" element={<OrdersPage />} />
        <Route path="/sa/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/sa/about" element={<AboutPage />} />
        <Route path="/sa/contact" element={<ContactPage />} />
        <Route path="/sa/faq" element={<FAQPage />} />
        <Route path="/sa/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/sa/terms" element={<TermsConditionsPage />} />
        <Route path="/sa/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/sa/refund" element={<RefundPolicyPage />} />
        <Route path="/sa/products" element={<ProductsPage />} />
        <Route path="/sa/products/:productId" element={<ProductDetailPage />} />
        <Route path="/sa/login" element={<LoginPage />} />
        <Route path="/sa/register" element={<RegisterPage />} />
        <Route path="/sa/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/sa/reset-password" element={<ResetPasswordPage />} />
        <Route path="/sa/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/sa/checkout/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/sa/checkout/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/sa/checkout/payment-failed" element={<PaymentFailurePage />} />
        <Route path="/sa/checkout/payment-error" element={<PaymentErrorPage />} />
        <Route path="/sa/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
        <Route path="/sa/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/sa/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/sa/payment/cancelled" element={<PaymentCancelledPage />} />
        
        {/* Admin routes for Oman */}
        <Route path="/om/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="categories/add" element={<CategoryAddPage />} />
          <Route path="categories/edit/:id" element={<CategoryEditPage />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="products/add" element={<ProductAddPage />} />
          <Route path="products/edit/:productId" element={<ProductEditPage />} />
          <Route path="products/:id/attributes" element={<ProductAttributesPage />} />
          <Route path="seo" element={<SeoManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="newsletter" element={<NewsletterManagement />} />
          <Route path="email-settings" element={<EmailSettingsManagement />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
        
        {/* Admin routes for Saudi Arabia */}
        <Route path="/sa/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="categories/add" element={<CategoryAddPage />} />
          <Route path="categories/edit/:id" element={<CategoryEditPage />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="products/add" element={<ProductAddPage />} />
          <Route path="products/edit/:productId" element={<ProductEditPage />} />
          <Route path="products/:id/attributes" element={<ProductAttributesPage />} />
          <Route path="seo" element={<SeoManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="newsletter" element={<NewsletterManagement />} />
          <Route path="email-settings" element={<EmailSettingsManagement />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/admin/*" element={<AdminRegionRedirect />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/checkout/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/checkout/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/checkout/payment-failed" element={<PaymentFailurePage />} />
        <Route path="/checkout/payment-error" element={<PaymentErrorPage />} />
        <Route path="/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/payment/cancelled" element={<PaymentCancelledPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminPage && <Footer />}
    </div>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // If this is missing at *build time*, Google Sign-In will not work in production.
  if (!googleClientId) {
    console.warn('[auth] VITE_GOOGLE_CLIENT_ID is not set; Google Sign-In is disabled.');
  } else if (typeof window !== 'undefined') {
    // Helpful when "works on localhost but not on website": verify the *actual* origin users are visiting.
    console.info('[auth] Google OAuth enabled', {
      origin: window.location.origin,
      clientIdTail: googleClientId.slice(-10),
    });
  }

  const app = (
    <RegionProvider>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </RegionProvider>
  );

  return googleClientId ? (
    <GoogleOAuthProvider
      clientId={googleClientId}
      onScriptLoadSuccess={() => {
        console.info('[auth] Google OAuth script loaded');
      }}
      onScriptLoadError={() => {
        console.error(
          '[auth] Failed to load Google OAuth script. Check ad-blockers/CSP and Authorized JavaScript origins in Google Cloud Console.'
        );
      }}
    >
      {app}
    </GoogleOAuthProvider>
  ) : (
    app
  );
}

export default App;