import React from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback. If omitted, the built-in amber-themed UI is shown. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based React Error Boundary.
 *
 * Catches runtime errors anywhere in the subtree, logs them, and shows a
 * user-friendly bilingual (AR/EN) fallback screen that matches the app's
 * amber coffee theme.  Call `reset()` (exposed via ref) or pass a new `key`
 * to recover.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log full details so the developer can track down the real culprit.
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    // Read language preference without hooks (class component limitation).
    const lang = (() => {
      try {
        return localStorage.getItem('spirithub-language') || 'ar';
      } catch {
        return 'ar';
      }
    })();
    const isAr = lang === 'ar';

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-16"
      >
        <div className="max-w-xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-12 h-12 text-amber-600" />
            </div>
          </div>

          {/* Heading */}
          <h1
            className={`text-3xl md:text-4xl font-bold text-gray-800 mb-4 ${
              isAr ? 'font-cairo' : ''
            }`}
          >
            {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
          </h1>

          {/* Body */}
          <p
            className={`text-gray-600 mb-8 leading-relaxed text-lg ${
              isAr ? 'font-cairo' : ''
            }`}
          >
            {isAr
              ? 'نعتذر عن الإزعاج. حدث خطأ في هذه الصفحة. يمكنك المحاولة مجدداً أو العودة إلى الصفحة الرئيسية.'
              : "Sorry for the inconvenience. An error occurred on this page. You can try again or head back home."}
          </p>

          {/* Dev-only error details */}
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-gray-900 text-red-300 p-4 rounded-lg mb-8 overflow-auto max-h-44 shadow-inner">
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}

          {/* Actions */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${
              isAr ? 'sm:flex-row-reverse' : ''
            }`}
          >
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              {isAr ? 'حاول مجدداً' : 'Try Again'}
            </button>

            {/* Use <a> instead of <Link> so this works even if the Router is broken */}
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-amber-600 text-amber-700 hover:bg-amber-50 font-medium transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              {isAr ? 'الصفحة الرئيسية' : 'Go Home'}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Route-aware wrapper around `ErrorBoundary`.
 *
 * Passes `location.pathname` as the React `key` so the boundary
 * automatically resets whenever the user navigates to a different route —
 * without requiring a full page reload.
 *
 * Place this inside a Router so `useLocation` is available.
 */
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      {children}
    </ErrorBoundary>
  );
}
