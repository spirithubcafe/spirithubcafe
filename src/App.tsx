import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { RegionProvider } from './contexts/RegionContext';
import { Navigation } from './components/layout/Navigation';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { RegionRedirect } from './components/layout/RegionRedirect';
import { ChatBot } from './components/chatbot/ChatBot';
import { Footer } from './components/layout/Footer';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { PageHeader } from './components/layout/PageHeader';
import HomePage from './pages/HomePage';
import { ErrorBoundary, RouteErrorBoundary } from './components/pages/ErrorBoundary';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireWholesale } from './components/auth/RequireWholesale';
import { AdminRegionRedirect } from './components/layout/AdminRegionRedirect';
import { initVisitorTracking } from './lib/visitorTracking';
import { migrateCartToRegionBased } from './lib/migrateCart';
import { initGA4, trackPageView } from './lib/ga4';
import './i18n';
import './App.css';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage').then((m) => ({ default: m.LoyaltyPage })));
const LoyaltySignupPage = lazy(() => import('./pages/LoyaltySignupPage').then((m) => ({ default: m.LoyaltySignupPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage').then((m) => ({ default: m.TermsConditionsPage })));
const DeliveryPolicyPage = lazy(() => import('./pages/DeliveryPolicyPage').then((m) => ({ default: m.DeliveryPolicyPage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })));
const WholesaleOrderPage = lazy(() => import('./pages/WholesaleOrderPage').then((m) => ({ default: m.WholesaleOrderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then((m) => ({ default: m.PaymentPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then((m) => ({ default: m.PaymentSuccessPage })));
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage').then((m) => ({ default: m.PaymentFailurePage })));
const PaymentCancelledPage = lazy(() => import('./pages/PaymentCancelledPage').then((m) => ({ default: m.PaymentCancelledPage })));
const PaymentErrorPage = lazy(() => import('./pages/PaymentErrorPage').then((m) => ({ default: m.PaymentErrorPage })));
const InvoicePage = lazy(() => import('./pages/InvoicePage').then((m) => ({ default: m.InvoicePage })));
const WholesaleLoginPage = lazy(() => import('./pages/WholesaleLoginPage'));
const WholesaleDashboardPage = lazy(() => import('./pages/WholesaleDashboardPage'));
const WholesaleOrdersPage = lazy(() => import('./pages/WholesaleOrdersPage'));
const WholesaleOrderDetailsPage = lazy(() => import('./pages/WholesaleOrderDetailsPage'));
const AdminRoutes = lazy(() => import('./components/admin/AdminRoutes'));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ShopPage = lazy(() => import('./pages/Shop/ShopPage'));
const ShopCategoryPage = lazy(() => import('./pages/Shop/ShopCategoryPage'));
const NotFound = lazy(() => import('./components/pages/NotFound').then((m) => ({ default: m.NotFound })));
const MobileBottomNav = lazy(() => import('./components/layout/MobileBottomNav').then((m) => ({ default: m.MobileBottomNav })));
const CartDrawer = lazy(() => import('./components/cart/CartDrawer').then((m) => ({ default: m.CartDrawer })));

const scheduleAfterInitialLoad = (task: () => void) => {
  if (typeof window === 'undefined') return () => undefined;

  let didRun = false;
  let timeoutId: number | null = null;
  let idleId: number | null = null;
  let onLoad: (() => void) | null = null;

  const clearScheduledWork = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (idleId !== null && 'cancelIdleCallback' in window) {
      (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      idleId = null;
    }
    if (onLoad !== null) {
      window.removeEventListener('load', onLoad);
    }
  };

  const runOnce = () => {
    if (didRun) return;
    didRun = true;
    clearScheduledWork();
    task();
  };

  const scheduleIdle = () => {
    if ('requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(runOnce, { timeout: 20000 });
      return;
    }
    timeoutId = globalThis.setTimeout(runOnce, 20000);
  };

  if (document.readyState === 'complete') {
    timeoutId = window.setTimeout(scheduleIdle, 12000);
  } else {
    onLoad = () => {
      timeoutId = window.setTimeout(scheduleIdle, 12000);
    };
    window.addEventListener('load', onLoad, { once: true });
  }

  return clearScheduledWork;
};

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const isInvoicePage = location.pathname.startsWith('/invoice/');
  const isProductsPage = /^\/(?:(?:om|sa)\/)?products\/?$/.test(location.pathname);

  const routeFallback = isProductsPage ? (
    <>
      <AnnouncementBar />
      <PageHeader
        variant="products"
        title="Shop Specialty Coffee"
        titleAr="منتجاتنا"
        subtitle="Freshly roasted in Oman & Saudi Arabia"
        subtitleAr="اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية"
      />
      <div className="min-h-screen bg-gray-50" aria-hidden="true" />
    </>
  ) : (
    <div className="min-h-screen bg-white" />
  );

  // Initialize visitor tracking on app load
  useEffect(() => {
    initVisitorTracking();
  }, []);

  // Initialize GA4 analytics (no-op when VITE_GA4_MEASUREMENT_ID is not set)
  useEffect(() => {
    return scheduleAfterInitialLoad(() => {
      initGA4();
      trackPageView(window.location.pathname + window.location.search);
    });
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Migrate old cart to region-based storage on first load
  useEffect(() => {
    migrateCartToRegionBased();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {!isInvoicePage && <RegionRedirect />}
      {!isInvoicePage && <Navigation />}
      {!isInvoicePage && (
        <Suspense fallback={null}>
          <MobileBottomNav />
          <CartDrawer />
        </Suspense>
      )}
      {!isInvoicePage && !isAdminPage && <ScrollToTop />}
      {!isInvoicePage && !isAdminPage && (import.meta.env.VITE_CHATBOT_ENABLED ?? 'false') === 'true' && <ChatBot />}
      {!isInvoicePage && <Toaster position="top-center" duration={2000} richColors />}
      <RouteErrorBoundary>
      <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/invoice/:orderNumber" element={<InvoicePage />} />

        {/* Wholesale panel routes */}
        <Route path="/wholesale/login" element={<WholesaleLoginPage />} />
        <Route
          path="/wholesale/dashboard"
          element={
            <RequireWholesale>
              <WholesaleDashboardPage />
            </RequireWholesale>
          }
        />
        <Route
          path="/wholesale/orders"
          element={
            <RequireWholesale>
              <WholesaleOrdersPage />
            </RequireWholesale>
          }
        />
        <Route
          path="/wholesale/orders/new"
          element={
            <RequireWholesale>
              <WholesaleOrderPage />
            </RequireWholesale>
          }
        />
        <Route
          path="/wholesale/orders/:id"
          element={
            <RequireWholesale>
              <WholesaleOrderDetailsPage />
            </RequireWholesale>
          }
        />
        <Route path="/wholesale" element={<Navigate to="/wholesale/dashboard" replace />} />

        {/* Root redirect */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ShopCategoryPage />} />
        <Route path="/shop/product/:productId" element={<ProductDetailPage />} />
        
        {/* Region-specific routes - /om and /sa */}
        <Route path="/om" element={<HomePage />} />
        <Route path="/om/profile" element={<ProfilePage />} />
        <Route path="/om/favorites" element={<FavoritesPage />} />
        <Route path="/om/orders" element={<OrdersPage />} />
        <Route path="/om/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/om/about" element={<AboutPage />} />
        <Route path="/om/contact" element={<ContactPage />} />
        <Route path="/om/loyalty" element={<LoyaltyPage />} />
        <Route path="/om/loyalty/signup" element={<LoyaltySignupPage />} />
        <Route path="/om/faq" element={<FAQPage />} />
        <Route path="/om/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/om/terms" element={<TermsConditionsPage />} />
        <Route path="/om/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/om/refund" element={<RefundPolicyPage />} />
        <Route path="/om/shop" element={<ShopPage />} />
        <Route path="/om/shop/:slug" element={<ShopCategoryPage />} />
        <Route path="/om/shop/product/:productId" element={<ProductDetailPage />} />
        <Route path="/om/products" element={<ProductsPage />} />
        <Route path="/om/products/:productId" element={<ProductDetailPage />} />
        <Route
          path="/om/wholesale"
          element={
            <RequireWholesale>
              <WholesaleOrderPage />
            </RequireWholesale>
          }
        />
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
        <Route path="/sa/loyalty" element={<LoyaltyPage />} />
        <Route path="/sa/loyalty/signup" element={<LoyaltySignupPage />} />
        <Route path="/sa/faq" element={<FAQPage />} />
        <Route path="/sa/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/sa/terms" element={<TermsConditionsPage />} />
        <Route path="/sa/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/sa/refund" element={<RefundPolicyPage />} />
        <Route path="/sa/shop" element={<ShopPage />} />
        <Route path="/sa/shop/:slug" element={<ShopCategoryPage />} />
        <Route path="/sa/shop/product/:productId" element={<ProductDetailPage />} />
        <Route path="/sa/products" element={<ProductsPage />} />
        <Route path="/sa/products/:productId" element={<ProductDetailPage />} />
        <Route
          path="/sa/wholesale"
          element={
            <RequireWholesale>
              <WholesaleOrderPage />
            </RequireWholesale>
          }
        />
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
        
        {/* Admin routes */}
        <Route path="/om/admin/*" element={<AdminRoutes />} />
        <Route path="/sa/admin/*" element={<AdminRoutes />} />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/admin/*" element={<AdminRegionRedirect />} />
        <Route path="/email-templates.html" element={<Navigate to="/admin/email-templates" replace />} />
        <Route path="/om/email-templates.html" element={<Navigate to="/om/admin/email-templates" replace />} />
        <Route path="/sa/email-templates.html" element={<Navigate to="/sa/admin/email-templates" replace />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
        <Route path="/loyalty/signup" element={<LoyaltySignupPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/delivery" element={<DeliveryPolicyPage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route
          path="/wholesale"
          element={
            <RequireWholesale>
              <WholesaleOrderPage />
            </RequireWholesale>
          }
        />
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
      </Suspense>
      </RouteErrorBoundary>

      {!isAdminPage && !isInvoicePage && <Footer />}
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
    <ErrorBoundary>
      <RegionProvider>
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </RegionProvider>
    </ErrorBoundary>
  );

  return app;
}

export default App;
