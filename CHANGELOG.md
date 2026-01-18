# Changelog

All notable changes to Spirit Hub Cafe will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-18

### 🎉 Initial Release

This is the first official release of Spirit Hub Cafe e-commerce platform.

#### ✨ Features

**Multi-Region Support**
- Support for Oman (OM) and Saudi Arabia (SA) regions
- Automatic region detection from URL path
- Region-specific content and pricing
- Beautiful SVG flag icons for region selection

**Bilingual Interface**
- Full support for Arabic and English languages
- RTL/LTR layout switching
- Localized content and UI elements
- Custom Cairo font for Arabic text

**Currency & Pricing**
- Smart currency display (OMR for Oman, SAR for Saudi Arabia)
- Language-aware price formatting:
  - Arabic: `123.000 ر.ع.` or `123.000 ر.س`
  - English: `123.000 OMR` or `123.000 SAR`
- Consistent pricing across all pages

**Product Catalog**
- Comprehensive product listing with filtering
- Detailed product pages with specifications
- Coffee information: roast level, process, variety, altitude, farm
- Product images with zoom functionality
- Variant selection (different weights/packages)
- Stock management

**E-Commerce Features**
- Shopping cart with quantity management
- Checkout system with address validation
- Multiple payment methods support
- Order tracking and history
- User profile management
- Favorites/Wishlist functionality

**User Authentication**
- Email/password authentication
- Google OAuth integration
- Profile management
- Order history

**Progressive Web App (PWA)**
- Offline support with service worker
- Smart caching strategy:
  - API images cached for 90 days (400 entries)
  - Site assets cached for 30 days (200 entries)
  - API calls network-only
- Install as app on mobile devices
- Push notification support (future)

**Admin Panel**
- Product management (CRUD operations)
- Order management
- Category management
- User management
- Analytics and reports

**Performance & SEO**
- Server-side rendering (SSR) support
- Automatic sitemap generation
- robots.txt configuration
- Product feeds (XML)
- Optimized images with lazy loading
- Code splitting and lazy loading

**UI/UX**
- Modern, responsive design
- Smooth animations with Framer Motion
- Custom scrollbars with OverlayScrollbars
- Toast notifications for user feedback
- Loading states and skeleton screens

#### 🛠️ Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next
- **PWA**: vite-plugin-pwa with Workbox
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **HTTP Client**: Axios

#### 📦 Dependencies

See `package.json` for full list of dependencies.

#### 🐛 Known Issues

None at this time.

---

## Versioning Guidelines

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New features (backwards-compatible)
- **PATCH** version (0.0.X): Bug fixes (backwards-compatible)

---

[1.0.0]: https://github.com/spirithubcafe/spirithubcafe/releases/tag/v1.0.0
