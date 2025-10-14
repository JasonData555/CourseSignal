import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DemoDashboard from './pages/DemoDashboard';
import Onboarding from './pages/Onboarding';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import Account from './pages/Account';
import Launches from './pages/Launches';
import LaunchNew from './pages/LaunchNew';
import LaunchDashboard from './pages/LaunchDashboard';
import LaunchComparison from './pages/LaunchComparison';
import PublicLaunchRecap from './pages/PublicLaunchRecap';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      <Route
        path="/account"
        element={
          <PrivateRoute>
            <Account />
          </PrivateRoute>
        }
      />

      <Route
        path="/launches"
        element={
          <PrivateRoute>
            <Launches />
          </PrivateRoute>
        }
      />

      <Route
        path="/launches/new"
        element={
          <PrivateRoute>
            <LaunchNew />
          </PrivateRoute>
        }
      />

      <Route
        path="/launches/:id"
        element={
          <PrivateRoute>
            <LaunchDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/launches/compare"
        element={
          <PrivateRoute>
            <LaunchComparison />
          </PrivateRoute>
        }
      />

      {/* Public routes - no auth required */}
      <Route path="/public/launch/:shareToken" element={<PublicLaunchRecap />} />
      <Route path="/demo" element={<DemoDashboard />} />
    </Routes>
  );
}

export default App;
