import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import About from './pages/About';
import Important from './pages/Important';
import NotFound from './pages/NotFound';
import DashboardFeed from './pages/DashboardFeed';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import { useEffect, useState, Suspense, lazy } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Auth = lazy(() => import('./pages/Auth'));

function App() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        window.location.reload();
      } else if (event === 'SIGNED_IN') {
        // Redirect to home on login
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-primary">Loading...</div>;
  }

  // Fallback UI for lazy loaded components
  const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="text-gray-200" style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>
        <ParticleBackground />
        <Navbar />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={session ? <DashboardFeed /> : <LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/about" element={<About />} />

            {/* Protected Routes */}
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* <Route
              path="/important"
              element={
                <ProtectedRoute>
                  <Important />
                </ProtectedRoute>
              }
            /> */}

            {/* Redirects */}
            <Route path="/notes" element={<Navigate to="/user-dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* Global Disclaimer */}
        {/* <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'var(--accent)',
          color: 'white',
          textAlign: 'center',
          padding: '10px',
          fontWeight: 'bold',
          zIndex: 100,
          fontSize: '0.9rem'
        }}>
          <marquee behavior="scroll" direction="left" scrollamount="5">DISCLAIMER: This website is made only for educational purposes. Take it at your own risk.</marquee>
        </div> */}
      </div>
    </ToastProvider>
  );
}

export default App;
