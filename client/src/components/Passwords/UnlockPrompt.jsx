import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function UnlockPrompt() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { unlockVault, logout, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await unlockVault(password);
    } catch (err) {
      setError('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-navy px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-mid-navy border-2 border-lime/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <svg className="w-10 h-10 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold text-lime tracking-wider mb-3 drop-shadow-[0_0_15px_rgba(194,254,11,0.5)]">
            [ COFFRE VERROUILLE ]
          </h1>
          <p className="font-mono text-cyan text-sm uppercase tracking-wide">
            // Entrez votre mot de passe maitre pour deverrouiller
          </p>
        </div>

        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-8 shadow-glow-lg">
          {error && (
            <div className="bg-red-900/30 border-2 border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm">
              <span className="text-red-500 font-bold">ERROR:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Mot de passe maitre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="••••••••••••"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)]"
            >
              {loading ? '[ DEVERROUILLAGE... ]' : '[ DEVERROUILLER ]'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-cyan/10 pt-6">
            <p className="font-mono text-grey text-sm mb-3">
              <span className="text-cyan">▸</span> Connecte en tant que <span className="text-white">{user?.email}</span>
            </p>
            <button
              onClick={logout}
              className="font-mono text-red-400 hover:text-red-300 text-sm uppercase tracking-wide transition-colors"
            >
              [ Se deconnecter ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
