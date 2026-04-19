import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-mid-navy border-b-2 border-lime/20 shadow-glow">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link to="/vault" className="font-display text-3xl font-bold text-lime tracking-wider drop-shadow-[0_0_10px_rgba(194,254,11,0.5)] hover:text-lime-dim transition-colors">
          VERROUPASS
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          {user && <span className="font-mono text-grey">{user.email}</span>}
          {user && <span className="text-lime/30">|</span>}
          <Link
            to="/generator"
            className="font-mono text-grey hover:text-cyan transition-colors uppercase tracking-wide"
          >
            [ Générateur ]
          </Link>
          <Link
            to="/cli"
            className="font-mono text-grey hover:text-cyan transition-colors uppercase tracking-wide"
          >
            [ CLI ]
          </Link>
          <Link
            to="/settings"
            className="font-mono text-grey hover:text-cyan transition-colors uppercase tracking-wide"
          >
            [ Paramètres ]
          </Link>
          {user && (
            <button
              onClick={logout}
              className="font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-wide"
            >
              [ Déconnexion ]
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
