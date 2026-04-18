import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VaultList from './components/Vault/VaultList';
import { Settings } from './pages/Settings';
import { Goodbye } from './pages/Goodbye';
import PasswordGenerator from './pages/PasswordGenerator';

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
            <VaultList />
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

      {/* Route publique pour Goodbye (après suppression de compte) */}
      <Route path="/goodbye" element={<Goodbye />} />

      <Route path="/" element={<Navigate to="/vault" />} />
      <Route path="*" element={<Navigate to="/vault" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
