import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// 2e etape du login pour les comptes 2FA. Affiche un champ 6 chiffres avec
// auto-submit, ou un champ "code de secours" en alternative.
export default function TotpChallenge() {
  const { loginTotp, cancelTotpFlow, pendingTotpEmail } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('totp'); // 'totp' | 'recovery'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const submit = async (rawCode) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      if (mode === 'totp') {
        await loginTotp({ totpCode: rawCode });
      } else {
        await loginTotp({ recoveryCode: rawCode });
      }
      navigate('/vault');
    } catch (err) {
      setError(err.response?.data?.error || 'Code 2FA incorrect');
      setCode('');
      setLoading(false);
      // Re-focus pour ressaisir
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleTotpChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(v);
    if (error) setError('');
    if (v.length === 6) {
      // Auto-submit au 6e chiffre
      submit(v);
    }
  };

  const handleRecoveryChange = (e) => {
    const v = e.target.value.toUpperCase().slice(0, 19); // XXXX-XXXX-XXXX-XXXX
    setCode(v);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'totp' && code.length !== 6) {
      setError('Le code doit contenir exactement 6 chiffres');
      return;
    }
    if (mode === 'recovery' && code.replace(/[\s-]/g, '').length !== 16) {
      setError('Code de secours invalide (16 caractères attendus)');
      return;
    }
    submit(code);
  };

  const handleCancel = () => {
    cancelTotpFlow();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-navy px-4 py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-12 w-full">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-lime tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(194,254,11,0.5)]">
          VERROUPASS
        </h1>
        <p className="font-mono text-cyan text-xs sm:text-sm tracking-widest uppercase">
          // Vérification en deux étapes
        </p>
      </div>

      <div className="max-w-md w-full">
        <div className="bg-mid-navy border-2 border-lime/20 rounded-lg p-6 sm:p-8 shadow-glow-lg backdrop-blur-sm">
          <h2 className="font-heading text-xl sm:text-2xl text-lime uppercase tracking-wider mb-6 border-b border-lime/30 pb-2">
            Code 2FA
          </h2>

          {pendingTotpEmail && (
            <p className="font-mono text-sm text-grey mb-4">
              <span className="text-cyan">▸</span> Connexion en cours pour{' '}
              <span className="text-white">{pendingTotpEmail}</span>
            </p>
          )}

          {error && (
            <div
              id="totp-error"
              role="alert"
              aria-live="assertive"
              className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm"
            >
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {mode === 'totp' ? (
              <div>
                <label
                  htmlFor="totp-code"
                  className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2"
                >
                  Code à 6 chiffres
                </label>
                <input
                  ref={inputRef}
                  id="totp-code"
                  name="totp-code"
                  type="text"
                  value={code}
                  onChange={handleTotpChange}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'totp-error' : 'totp-help'}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono text-2xl tracking-[0.5em] text-center focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                  placeholder="••••••"
                  required
                />
                <p id="totp-help" className="font-mono text-xs text-grey mt-2">
                  <span className="text-cyan">▸</span> Code généré par votre application authenticator
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="recovery-code"
                  className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2"
                >
                  Code de secours
                </label>
                <input
                  ref={inputRef}
                  id="recovery-code"
                  name="recovery-code"
                  type="text"
                  value={code}
                  onChange={handleRecoveryChange}
                  autoComplete="off"
                  spellCheck="false"
                  autoCapitalize="characters"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'totp-error' : 'recovery-help'}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono text-lg tracking-widest text-center uppercase focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey disabled:opacity-50"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                />
                <p id="recovery-help" className="font-mono text-xs text-grey mt-2">
                  <span className="text-lime">▸</span> Code à usage unique : il ne fonctionnera plus après cette utilisation.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading text-xl uppercase tracking-wider py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(194,254,11,0.4)] hover:shadow-[0_0_30px_rgba(194,254,11,0.6)]"
            >
              {loading ? '[ VÉRIFICATION... ]' : '[ VALIDER ]'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center">
            {mode === 'totp' ? (
              <button
                type="button"
                onClick={() => switchMode('recovery')}
                className="text-cyan hover:text-lime transition-colors font-mono text-sm underline"
              >
                Utiliser un code de secours
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode('totp')}
                className="text-cyan hover:text-lime transition-colors font-mono text-sm underline"
              >
                Revenir au code à 6 chiffres
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="text-grey hover:text-red-400 transition-colors font-mono text-xs underline"
            >
              Annuler et revenir à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
