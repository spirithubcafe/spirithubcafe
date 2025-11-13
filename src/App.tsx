import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navigation } from './components/layout/Navigation';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ScrollToTop } from './components/layout/ScrollToTop';
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
} from './components/admin';
import { CategoryAddPage } from './pages/CategoryAddPage';
import { CategoryEditPage } from './pages/CategoryEditPage';
import { ProductAddPage } from './pages/ProductAddPage';
import { ProductEditPage } from './pages/ProductEditPage';
import { ProductAttributesPage } from './pages/ProductAttributesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { OrdersPage } from './pages/OrdersPage';
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
import { NotFound } from './components/pages/NotFound';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { PaymentCancelledPage } from './pages/PaymentCancelledPage';
import { PaymentErrorPage } from './pages/PaymentErrorPage';
import './i18n';
import './App.css';

function AppContent() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <MobileBottomNav />
      <CartDrawer />
      <ScrollToTop />
      <Toaster position="top-center" duration={2000} richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/*" element={<AdminLayout />}>
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
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
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
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Payment routes - new structure */}
        <Route path="/checkout/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/checkout/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/checkout/payment-failed" element={<PaymentFailurePage />} />
        <Route path="/checkout/payment-error" element={<PaymentErrorPage />} />
        
        {/* Payment routes - legacy support */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/payment/cancelled" element={<PaymentCancelledPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <Router>
              <AppContent />
            </Router>
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;