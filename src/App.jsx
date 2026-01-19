import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Spinner } from './components/ui/Spinner';
import * as Sentry from '@sentry/react';
import { initSentry } from './lib/sentry';
import PageTransition from './components/core/PageTransition';
import MainLayout from './layouts/MainLayout';
import AuthProvider, { useAuth } from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ROLES } from './utils/constants';
import { initAnalytics, trackPageView } from './lib/analytics';

// Initialize Sentry BEFORE any components render
initSentry();


// Eager Load Core Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Inventory from './pages/Inventory';

// Lazy Load Secondary Pages
const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
const Services = lazy(() => import('./pages/Services'));
const Finance = lazy(() => import('./pages/Finance'));
const Performance = lazy(() => import('./pages/Performance'));
const Marketing = lazy(() => import('./pages/Marketing'));
const Settings = lazy(() => import('./pages/Settings'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Support = lazy(() => import('./pages/Support'));
const BookingWizard = lazy(() => import('./components/booking/BookingWizard'));
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

// Sentry Error Boundary Fallback UI
const ErrorFallback = ({ error, componentStack, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-3">Bir Hata Oluştu</h1>
      <p className="text-slate-600 mb-6">
        Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
      </p>
      {import.meta.env.DEV && (
        <details className="mb-6 p-4 bg-slate-50 rounded-xl text-left text-xs">
          <summary className="cursor-pointer font-bold text-slate-700 mb-2">
            Hata Detayları (Sadece Geliştirme)
          </summary>
          <pre className="whitespace-pre-wrap text-slate-600 overflow-auto max-h-48">
            {error?.toString()}\n{componentStack}
          </pre>
        </details>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
        >
          Sayfayı Yenile
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
        >
          Ana Sayfa
        </button>
      </div>
    </div>
  </div>
);

// Loading Screen Component with Failsafe
const LoadingScreen = () => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 5000); // 5s timeout
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-slate-400 font-medium animate-pulse">Yükleniyor...</p>

        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 font-semibold transition-colors animate-in fade-in cursor-pointer"
          >
            Taking too long? Reload
          </button>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0) {
    if (!role) {
      // Role hasn't loaded yet but user has? Wait or show loading.
      // Usually loading covers this. If role is null here it means failure or delay.
      // We'll assume if loading is false and role is null, something might be wrong or they have no role.
      // Allowing access might be dangerous, blocking is safer.
      // But let's check if role is indeed null.
      // For now, if role is required and we don't match, Unauthorized.
      // Warning: 'role' might be null initially? fetchProfile logic handles it.
      // If role is strictly null after loading, deny.
      return <Navigate to="/unauthorized" replace />;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

// Layout Wrapper
const AppLayout = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Suspense fallback={<div className="p-10 flex justify-center"><Spinner size="lg" color="muted" /></div>}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </MainLayout>
  );
};

// Root Redirector Logic
const RootRedirector = () => {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role === ROLES.ADMIN || role === ROLES.OWNER || role === ROLES.DOCTOR) return <Home />;
  return <Navigate to="/schedule" replace />;
};

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

                {/* Protected Routes - General Access */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* Super Admin Routes (Protected by RLS/RPC at data level, but UI route also needed) */}
                  <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                  </Route>

                  {/* Routes Accessible to ALL Authenticated Users (including Staff) */}
                  <Route element={<AppLayout />}>
                    {/* <Route path="/" element={<RootRedirector />} /> Removed, / is now Landing */}
                    <Route path="/overview" element={<Home />} />
                    <Route path="/schedule" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/schedule" replace />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientProfile />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/support" element={<Support />} />

                    {/* Routes RESTRICTED to Admin, Owner & Doctor */}
                    <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.DOCTOR]} />}>
                      {/* Home is now handled by RootRedirector above */}
                      <Route path="/services" element={<Services />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/performance" element={<Performance />} />
                      <Route path="/book" element={<BookingWizard />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Wrap App with Sentry ErrorBoundary for production error catching
export default Sentry.withErrorBoundary(App, {
  fallback: ErrorFallback,
  showDialog: false, // Don't show Sentry's crash report dialog
});
