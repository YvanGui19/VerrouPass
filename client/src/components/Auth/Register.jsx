import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/vault');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-navy px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Titre */}
        <div className="text-center mb-12">
          <h1 className="font-display text-6xl font-bold text-lime tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(194,254,11,0.5)]">
            VERROUPASS
          </h1>
          <p className="font-mono text-cyan text-sm tracking-widest uppercase">
            // Zero-Knowledge Password Manager
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-8 shadow-glow-lg backdrop-blur-sm">
          <h2 className="font-heading text-2xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-2">
            Créer un compte
          </h2>

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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="••••••••••••"
                required
                minLength={8}
              />
              <p className="text-grey/70 font-mono text-xs mt-2">
                <span className="text-lime">▸</span> Minimum 8 caractères
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="••••••••••••"
                required
              />
            </div>

            <div className="bg-amber-900/20 border-2 border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-200 font-mono text-sm leading-relaxed">
                <span className="text-amber-500 font-bold">⚠ ATTENTION:</span><br />
                Votre mot de passe maître est votre clé de chiffrement.<br />
                <span className="text-amber-400">Si vous le perdez, vos données seront irrécupérables.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)]"
            >
              {loading ? '[ CRÉATION... ]' : '[ CRÉER MON COMPTE ]'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-grey font-mono text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-cyan hover:text-lime transition-colors underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-grey/70 leading-relaxed">
            <span className="text-lime">▸</span> Chiffrement zero-knowledge
            <br />
            <span className="text-cyan">▸</span> Nous ne voyons jamais vos données
          </p>
        </div>
      </div>
    </div>
  );
}
