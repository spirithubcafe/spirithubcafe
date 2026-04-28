import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import ShopPage from './pages/Shop/ShopPage';
import ShopCategoryPage from './pages/Shop/ShopCategoryPage';
import { NotFound } from './components/pages/NotFound';
import { ErrorBoundary, RouteErrorBoundary } from './components/pages/ErrorBoundary';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireWholesale } from './components/auth/RequireWholesale';
import { AdminRegionRedirect } from './components/admin/AdminRegionRedirect';
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
const CategoryAddPage = lazy(() => import('./pages/CategoryAddPage').then((m) => ({ default: m.CategoryAddPage })));
const CategoryEditPage = lazy(() => import('./pages/CategoryEditPage').then((m) => ({ default: m.CategoryEditPage })));
const ProductAddPage = lazy(() => import('./pages/ProductAddPage').then((m) => ({ default: m.ProductAddPage })));
const ProductEditPage = lazy(() => import('./pages/ProductEditPage').then((m) => ({ default: m.ProductEditPage })));
const ProductAttributesPage = lazy(() => import('./pages/ProductAttributesPage').then((m) => ({ default: m.ProductAttributesPage })));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const CategoriesManagement = lazy(() => import('./components/admin/CategoriesManagement').then((m) => ({ default: m.CategoriesManagement })));
const ProductsManagement = lazy(() => import('./components/admin/ProductsManagement').then((m) => ({ default: m.ProductsManagement })));
const UsersManagement = lazy(() => import('./components/admin/UsersManagement').then((m) => ({ default: m.UsersManagement })));
const SeoManagement = lazy(() => import('./components/admin/SeoManagement').then((m) => ({ default: m.SeoManagement })));
const OrdersManagement = lazy(() => import('./components/admin/OrdersManagement').then((m) => ({ default: m.OrdersManagement })));
const WholesaleOrdersManagement = lazy(() => import('./components/admin/WholesaleOrdersManagement').then((m) => ({ default: m.WholesaleOrdersManagement })));
const ReportsManagement = lazy(() => import('./components/admin/ReportsManagement').then((m) => ({ default: m.ReportsManagement })));
const SystemSettings = lazy(() => import('./components/admin/SystemSettings').then((m) => ({ default: m.SystemSettings })));
const NewsletterManagement = lazy(() => import('./components/admin/NewsletterManagement').then((m) => ({ default: m.NewsletterManagement })));
const EmailSettingsManagement = lazy(() => import('./components/admin/EmailSettingsManagement').then((m) => ({ default: m.EmailSettingsManagement })));
const EmailNotificationSettingsManagement = lazy(() => import('./components/admin/EmailNotificationSettingsManagement').then((m) => ({ default: m.EmailNotificationSettingsManagement })));
const ReviewsManagement = lazy(() => import('./components/admin/ReviewsManagement').then((m) => ({ default: m.ReviewsManagement })));
const WhatsAppSendMessage = lazy(() => import('./components/admin/WhatsAppSendMessage').then((m) => ({ default: m.WhatsAppSendMessage })));
const WhatsAppNotificationSettingsManagement = lazy(() => import('./components/admin/WhatsAppNotificationSettingsManagement').then((m) => ({ default: m.WhatsAppNotificationSettingsManagement })));
const WhatsAppTemplatesManagement = lazy(() => import('./components/admin/WhatsAppTemplatesManagement').then((m) => ({ default: m.WhatsAppTemplatesManagement })));
const ProductTagsManagement = lazy(() => import('./components/admin/ProductTagsManagement').then((m) => ({ default: m.ProductTagsManagement })));

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const isInvoicePage = location.pathname.startsWith('/invoice/');

  // Initialize visitor tracking on app load
  useEffect(() => {
    initVisitorTracking();
  }, []);

  // Initialize GA4 analytics (no-op when VITE_GA4_MEASUREMENT_ID is not set)
  useEffect(() => {
    initGA4();
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
      {!isInvoicePage && <MobileBottomNav />}
      {!isInvoicePage && <CartDrawer />}
      {!isInvoicePage && <ScrollToTop />}
      {!isInvoicePage && <Toaster position="top-center" duration={2000} richColors />}
      <RouteErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
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
          <Route path="product-tags" element={<ProductTagsManagement />} />
          <Route path="seo" element={<SeoManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="wholesale-orders" element={<WholesaleOrdersManagement />} />
          <Route path="newsletter" element={<NewsletterManagement />} />
          <Route path="email-settings" element={<EmailSettingsManagement />} />
          <Route path="email-notification-settings" element={<EmailNotificationSettingsManagement />} />
          <Route path="whatsapp-send" element={<WhatsAppSendMessage />} />
          <Route path="whatsapp-notification-settings" element={<WhatsAppNotificationSettingsManagement />} />
          <Route path="whatsapp-templates" element={<WhatsAppTemplatesManagement />} />
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
          <Route path="product-tags" element={<ProductTagsManagement />} />
          <Route path="seo" element={<SeoManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="wholesale-orders" element={<WholesaleOrdersManagement />} />
          <Route path="newsletter" element={<NewsletterManagement />} />
          <Route path="email-settings" element={<EmailSettingsManagement />} />
          <Route path="email-notification-settings" element={<EmailNotificationSettingsManagement />} />
          <Route path="whatsapp-send" element={<WhatsAppSendMessage />} />
          <Route path="whatsapp-notification-settings" element={<WhatsAppNotificationSettingsManagement />} />
          <Route path="whatsapp-templates" element={<WhatsAppTemplatesManagement />} />
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
