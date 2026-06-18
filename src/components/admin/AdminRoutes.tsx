import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { CategoriesManagement } from './CategoriesManagement';
import { ProductsManagement } from './ProductsManagement';
import { UsersManagement } from './UsersManagement';
import { SeoManagement } from './SeoManagement';
import { OrdersManagement } from './OrdersManagement';
import { WholesaleOrdersManagement } from './WholesaleOrdersManagement';
import { ReportsManagement } from './ReportsManagement';
import { SystemSettings } from './SystemSettings';
import { NewsletterManagement } from './NewsletterManagement';
import { EmailSettingsManagement } from './EmailSettingsManagement';
import { EmailNotificationSettingsManagement } from './EmailNotificationSettingsManagement';
import { EmailTemplatesManagement } from './EmailTemplatesManagement';
import { ReviewsManagement } from './ReviewsManagement';
import { WhatsAppSendMessage } from './WhatsAppSendMessage';
import { WhatsAppActivationManagement } from './WhatsAppActivationManagement';
import { WhatsAppNotificationSettingsManagement } from './WhatsAppNotificationSettingsManagement';
import { WhatsAppTemplatesManagement } from './WhatsAppTemplatesManagement';
import { ProductTagsManagement } from './ProductTagsManagement';
import { ProducersManagement } from './ProducersManagement';
import { CategoryAddPage } from '../../pages/CategoryAddPage';
import { CategoryEditPage } from '../../pages/CategoryEditPage';
import { ProductAddPage } from '../../pages/ProductAddPage';
import { ProductEditPage } from '../../pages/ProductEditPage';
import { ProductAttributesPage } from '../../pages/ProductAttributesPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<CategoriesManagement />} />
        <Route path="categories/add" element={<CategoryAddPage />} />
        <Route path="categories/edit/:id" element={<CategoryEditPage />} />
        <Route path="products" element={<ProductsManagement />} />
        <Route path="products/add" element={<ProductAddPage />} />
        <Route path="products/edit/:productId" element={<ProductEditPage />} />
        <Route path="products/:id/attributes" element={<ProductAttributesPage />} />
        <Route path="product-tags" element={<ProductTagsManagement />} />
        <Route path="producers" element={<ProducersManagement />} />
        <Route path="seo" element={<SeoManagement />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="reviews" element={<ReviewsManagement />} />
        <Route path="wholesale-orders" element={<WholesaleOrdersManagement />} />
        <Route path="newsletter" element={<NewsletterManagement />} />
        <Route path="email-settings" element={<EmailSettingsManagement />} />
        <Route path="email-notification-settings" element={<EmailNotificationSettingsManagement />} />
        <Route path="email-templates" element={<EmailTemplatesManagement />} />
        <Route path="whatsapp-activation" element={<WhatsAppActivationManagement />} />
        <Route path="whatsapp-send" element={<WhatsAppSendMessage />} />
        <Route path="whatsapp-notification-settings" element={<WhatsAppNotificationSettingsManagement />} />
        <Route path="whatsapp-templates" element={<WhatsAppTemplatesManagement />} />
        <Route path="reports" element={<ReportsManagement />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>
    </Routes>
  );
}
