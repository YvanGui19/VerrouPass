import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PasswordList from './components/Passwords/PasswordList';
import { Settings } from './pages/Settings';
import { Goodbye } from './pages/Goodbye';
import PasswordGenerator from './pages/PasswordGenerator';
import { CliDownload } from './pages/CliDownload';
import MigrationOverlay from './components/MigrationOverlay';

// Route protégée
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Route publique (redirige si connecté)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/vault" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/vault"
        element={
          <PrivateRoute>
            <PasswordList />
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
        path="/generator"
        element={
          <PrivateRoute>
            <PasswordGenerator />
          </PrivateRoute>
        }
      />

      {/* Routes publiques */}
      <Route path="/goodbye" element={<Goodbye />} />
      <Route path="/cli" element={<CliDownload />} />

      <Route path="/" element={<Navigate to="/vault" />} />
      <Route path="*" element={<Navigate to="/vault" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <MigrationOverlay />
    </AuthProvider>
  );
}
