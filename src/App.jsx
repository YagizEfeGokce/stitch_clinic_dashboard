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
import { checkBetaAccess } from './middleware/betaGuard';

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
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const AuthConfirm = lazy(() => import('./pages/AuthConfirm'));
const BetaLanding = lazy(() => import('./pages/BetaLanding'));
const BetaSignup = lazy(() => import('./pages/BetaSignup'));
const BetaAccessDenied = lazy(() => import('./pages/BetaAccessDenied'));
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage'));

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
          <summary className="cursor-pointer font-bold text-slate-700 mb-2">Hata Detayları (Sadece Geliştirme)</summary>
          <pre className="whitespace-pre-wrap text-slate-600 overflow-auto max-h-48">{error?.toString()}\n{componentStack}</pre>
        </details>
      )}
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Sayfayı Yenile</button>
        <button onClick={() => window.location.href = '/'} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">Ana Sayfa</button>
      </div>
    </div>
  </div>
);

import { LogoSpinner } from './components/ui/LogoSpinner';

// ... (existing imports)

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
        <LogoSpinner size="xl" />
        {/* <p className="text-slate-400 font-medium animate-pulse">Yükleniyor...</p> */}
        {showRetry && (
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 font-semibold transition-colors animate-in fade-in cursor-pointer">Taking too long? Reload</button>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading, profileLoading } = useAuth();

  // Wait for both auth and profile to load
  if (loading || profileLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0) {
    if (!role) return <LoadingScreen />;
    if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// Beta Protected Route - Checks beta access before allowing entry
const BetaProtectedRoute = () => {
  const { user, role, loading, profileLoading } = useAuth();
  const [hasBetaAccess, setHasBetaAccess] = useState(null);
  const [checkingBeta, setCheckingBeta] = useState(true);

  useEffect(() => {
    async function verifyBetaAccess() {
      if (!user) {
        setHasBetaAccess(false);
        setCheckingBeta(false);
        return;
      }

      // Super admins always have access
      if (role === 'super_admin') {
        setHasBetaAccess(true);
        setCheckingBeta(false);
        return;
      }

      const hasAccess = await checkBetaAccess(user.id, user.email);
      setHasBetaAccess(hasAccess);
      setCheckingBeta(false);
    }

    if (!loading && !profileLoading) {
      verifyBetaAccess();
    }
  }, [user, role, loading, profileLoading]);

  // Still loading auth
  if (loading || profileLoading) return <LoadingScreen />;
  // Not logged in
  if (!user) return <Navigate to="/login" replace />;
  // Checking beta access
  if (checkingBeta) return <LoadingScreen />;
  // Logged in but no beta access
  if (!hasBetaAccess) return <BetaAccessDenied />;
  // Has access - render children
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
                {/* Public Booking Route - No Auth Required */}
                <Route path="/book/:clinicSlug" element={<PublicBookingPage />} />

                {/* Public Routes */}
                <Route path="/" element={<BetaLanding />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/signup" element={<AcceptInvite />} />
                <Route path="/beta" element={<BetaLanding />} />
                <Route path="/beta-signup" element={<BetaSignup />} />

                {/* Protected Routes - Beta Access Required */}
                <Route element={<BetaProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />

                  {/* Super Admin Routes */}
                  <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                  </Route>

                  {/* Routes Accessible to ALL Authenticated Users (including Staff) */}
                  <Route element={<AppLayout />}>
                    <Route path="/overview" element={<Home />} />
                    <Route path="/schedule" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/schedule" replace />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientProfile />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/support" element={<Support />} />

                    {/* Routes RESTRICTED to Admin, Owner & Doctor */}
                    <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.DOCTOR, ROLES.SUPER_ADMIN]} />}>
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
