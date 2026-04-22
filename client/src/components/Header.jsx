import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/generator', label: 'Generateur' },
    { to: '/cli', label: 'CLI' },
    { to: '/settings', label: 'Parametres' },
  ];

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <header className="bg-mid-navy border-b-2 border-lime/20 shadow-glow">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/vault"
            className="font-display text-2xl sm:text-3xl font-bold text-lime tracking-wider drop-shadow-[0_0_10px_rgba(194,254,11,0.5)] hover:text-lime-dim transition-colors"
          >
            VERROUPASS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {user && <span className="font-mono text-grey truncate max-w-[200px]">{user.email}</span>}
            {user && <span className="text-lime/30">|</span>}
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="font-mono text-grey hover:text-cyan transition-colors uppercase tracking-wide"
              >
                [ {label} ]
              </Link>
            ))}
            {user && (
              <button
                onClick={logout}
                className="font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-wide"
              >
                [ Deconnexion ]
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-grey hover:text-lime transition-colors rounded"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-lime/10">
            {user && (
              <p className="font-mono text-grey text-xs mb-4 truncate">
                <span className="text-cyan">▸</span> {user.email}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-mono text-grey hover:text-cyan transition-colors uppercase tracking-wide py-3 px-3 -mx-3 hover:bg-dark-navy/50 rounded min-h-[44px] flex items-center"
                >
                  [ {label} ]
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-wide py-3 px-3 -mx-3 hover:bg-dark-navy/50 rounded text-left min-h-[44px] flex items-center mt-2 border-t border-lime/10 pt-4"
                >
                  [ Deconnexion ]
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
