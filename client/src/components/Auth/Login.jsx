import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TotpChallenge from './TotpChallenge';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, pendingTotp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.info;

  // Si une etape 2FA est en attente (apres un /login reussi sur compte 2FA),
  // afficher TotpChallenge a la place du formulaire.
  if (pendingTotp) {
    return <TotpChallenge />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      // Si totpRequired, le hook a stocke pendingTotp et le composant va se
      // re-rendre en TotpChallenge au prochain tick. Sinon on navigue.
      if (!result?.totpRequired) {
        navigate('/vault');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-navy px-4 py-8 sm:py-12">
      {/* Logo/Titre - centre */}
      <div className="text-center mb-8 sm:mb-12 w-full">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-lime tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(194,254,11,0.5)]">
          VERROUPASS
        </h1>
        <p className="font-mono text-cyan text-xs sm:text-sm tracking-widest uppercase">
          // Zero-Knowledge Password Manager
        </p>
      </div>

      <div className="max-w-md w-full">

        {/* Formulaire */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 shadow-glow-lg backdrop-blur-sm">
          <h2 className="font-heading text-xl sm:text-2xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-2">
            Connexion
          </h2>

          {infoMessage && !error && (
            <div className="bg-mid-navy border-2 border-cyan/50 text-white px-4 py-3 rounded mb-6 font-mono text-sm leading-relaxed">
              <span className="text-cyan font-bold">INFO :</span> {infoMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm">
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2">
                Mot de passe maître
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)]"
            >
              {loading ? '[ CONNEXION... ]' : '[ SE CONNECTER ]'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-grey font-mono text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-cyan hover:text-lime transition-colors underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-grey/70 leading-relaxed">
            <span className="text-lime">▸</span> Chiffrement local AES-256
            <br />
            <span className="text-lime">▸</span> Dérivation Argon2id (RFC 9106)
            <br />
            <span className="text-cyan">▸</span> Vos mots de passe restent secrets
          </p>
        </div>
      </div>
    </div>
  );
}
