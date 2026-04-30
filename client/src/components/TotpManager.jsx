import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { totpApi } from '../utils/api';
import { hashForServer } from '../utils/crypto';
import { deriveKeysForUser } from '../utils/deriveForUser';

// Section 2FA dans la page Settings. Affiche l etat (active/inactif), permet
// l activation (wizard QR + code de confirmation + recovery codes) et la
// desactivation (modal mot de passe + code 2FA).
export function TotpManager({ user }) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState(null); // { enabled, recoveryCodesRemaining }
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const refreshStatus = async () => {
    try {
      const data = await totpApi.status();
      setStatus(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de récupérer le statut 2FA');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const onActivated = () => {
    setShowSetup(false);
    refreshStatus();
  };

  const onDisabled = () => {
    setShowDisable(false);
    refreshStatus();
  };

  return (
    <section className="mb-8" aria-labelledby="totp-section-title">
      <h2
        id="totp-section-title"
        className="font-heading text-2xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2"
      >
        Authentification à deux facteurs (2FA)
      </h2>

      <div className="bg-dark-navy border border-cyan/20 rounded p-4">
        {loadingStatus ? (
          <p className="font-mono text-grey text-sm">Chargement du statut 2FA...</p>
        ) : error ? (
          <div role="alert" className="text-red-300 font-mono text-sm">
            <span className="text-red-500">ERROR:</span> {error}
          </div>
        ) : status?.enabled ? (
          <div className="space-y-4">
            <p className="font-mono text-sm text-grey leading-relaxed">
              <span className="text-lime">▸</span> 2FA activée. Un code à 6 chiffres est requis à chaque connexion.<br />
              <span className="text-cyan">▸</span> Codes de secours restants :{' '}
              <span className="text-white font-bold">{status.recoveryCodesRemaining}</span> / 10
            </p>
            {status.recoveryCodesRemaining <= 3 && (
              <p
                role="alert"
                className="font-mono text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-500/40 rounded p-2"
              >
                <span className="text-yellow-400">⚠</span> Peu de codes de secours restants.
                Désactivez puis réactivez la 2FA pour en générer de nouveaux.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="bg-red-900/30 hover:bg-red-900/50 text-red-300 border-2 border-red-500/30 hover:border-red-500 font-heading uppercase tracking-wider px-4 py-2 rounded transition-all text-sm"
            >
              [ Désactiver la 2FA ]
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-sm text-grey leading-relaxed">
              <span className="text-lime">▸</span> Une fois activée, un code à 6 chiffres généré par votre app
              authenticator (Google Authenticator, Authy, 1Password, etc.) sera demandé à chaque connexion.<br />
              <span className="text-cyan">▸</span> Vous recevrez 10 codes de secours à usage unique en cas de perte de votre téléphone.
            </p>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              className="bg-cyan/20 hover:bg-cyan/30 text-cyan border-2 border-cyan/30 hover:border-cyan font-heading uppercase tracking-wider px-4 py-2 rounded transition-all text-sm"
            >
              [ Activer la 2FA ]
            </button>
          </div>
        )}
      </div>

      {showSetup && (
        <TotpSetupWizard
          email={user.email}
          onClose={() => setShowSetup(false)}
          onActivated={onActivated}
        />
      )}

      {showDisable && (
        <TotpDisableModal
          email={user.email}
          onClose={() => setShowDisable(false)}
          onDisabled={onDisabled}
        />
      )}
    </section>
  );
}

// Wizard 2 etapes : (1) afficher QR + secret + champ code de confirmation,
// (2) afficher les recovery codes apres activation.
function TotpSetupWizard({ email, onClose, onActivated }) {
  const [step, setStep] = useState('loading'); // loading | configure | recovery
  const [setupData, setSetupData] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await totpApi.setup();
        if (cancelled) return;
        setSetupData(data);
        const dataUrl = await QRCode.toDataURL(data.otpauthUri, {
          margin: 1,
          width: 240,
          color: { dark: '#01ffff', light: '#0a1628' }
        });
        if (cancelled) return;
        setQrDataUrl(dataUrl);
        setStep('configure');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Impossible de démarrer la configuration 2FA');
        setStep('configure');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Le code doit contenir exactement 6 chiffres');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await totpApi.enable(code);
      setRecoveryCodes(data.recoveryCodes);
      setStep('recovery');
    } catch (err) {
      setError(err.response?.data?.error || 'Code incorrect');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    } catch {
      // pas critique
    }
  };

  const downloadAll = () => {
    const blob = new Blob(
      [`VerrouPass - Codes de secours 2FA\nCompte : ${email}\nGénérés le : ${new Date().toISOString()}\n\nChaque code est à usage unique. Conservez ce fichier dans un endroit sûr.\n\n` + recoveryCodes.join('\n') + '\n'],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verroupass-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title="Activation de la 2FA" onClose={onClose}>
      {step === 'loading' && (
        <p className="font-mono text-grey">Génération du secret...</p>
      )}

      {step === 'configure' && setupData && (
        <form onSubmit={handleConfirm} className="space-y-5">
          <div>
            <p className="font-mono text-sm text-grey mb-3 leading-relaxed">
              <span className="text-lime">1.</span> Scannez ce QR code avec votre application authenticator,
              ou saisissez la clé manuellement.
            </p>
            {qrDataUrl ? (
              <div className="flex justify-center mb-3">
                <img
                  src={qrDataUrl}
                  alt="QR code de configuration 2FA. Si vous ne pouvez pas scanner, utilisez la clé secrète affichée en dessous."
                  width={240}
                  height={240}
                  className="border-2 border-cyan/30 rounded"
                />
              </div>
            ) : null}
            <div>
              <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-1">
                Clé secrète (saisie manuelle)
              </label>
              <code className="block bg-dark-navy border border-cyan/20 rounded p-2 font-mono text-xs text-white break-all select-all">
                {setupData.secret}
              </code>
            </div>
          </div>

          <div>
            <label
              htmlFor="totp-confirm"
              className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2"
            >
              <span className="text-lime">2.</span> Code à 6 chiffres généré par l'application
            </label>
            <input
              id="totp-confirm"
              name="totp-confirm"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) setError('');
              }}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? 'setup-error' : undefined}
              className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono text-2xl tracking-[0.5em] text-center focus:border-cyan focus:outline-none transition-all"
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div
              id="setup-error"
              role="alert"
              className="bg-red-900/30 border border-red-500/50 text-red-300 px-3 py-2 rounded font-mono text-sm"
            >
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading uppercase tracking-wider rounded transition-all disabled:opacity-50"
            >
              [ Annuler ]
            </button>
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="flex-1 bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
            >
              {submitting ? '[ Vérification... ]' : '[ Confirmer ]'}
            </button>
          </div>
        </form>
      )}

      {step === 'recovery' && (
        <div className="space-y-4">
          <div
            role="alert"
            className="bg-yellow-900/20 border border-yellow-500/40 rounded p-3 font-mono text-sm text-yellow-200 leading-relaxed"
          >
            <span className="text-yellow-400 font-bold">⚠ IMPORTANT :</span> ces codes ne seront plus jamais
            réaffichés. Sauvegardez-les maintenant dans un endroit sûr (gestionnaire de mots de passe,
            coffre-fort, papier dans un tiroir verrouillé...). Chaque code est à usage unique.
          </div>

          <ol
            className="bg-dark-navy border border-cyan/20 rounded p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-sm text-white"
            aria-label="Codes de secours à sauvegarder"
          >
            {recoveryCodes.map((rc, i) => (
              <li key={rc} className="flex items-center gap-2">
                <span className="text-cyan/60 text-xs w-5 inline-block text-right">{i + 1}.</span>
                <code className="select-all">{rc}</code>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="px-3 py-2 bg-cyan/20 hover:bg-cyan/30 text-cyan border-2 border-cyan/30 hover:border-cyan rounded font-heading uppercase tracking-wider text-sm transition-all"
            >
              [ Copier tous ]
            </button>
            <button
              type="button"
              onClick={downloadAll}
              className="px-3 py-2 bg-cyan/20 hover:bg-cyan/30 text-cyan border-2 border-cyan/30 hover:border-cyan rounded font-heading uppercase tracking-wider text-sm transition-all"
            >
              [ Télécharger en .txt ]
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onActivated}
              className="w-full bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
            >
              [ J'ai sauvegardé les codes ]
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TotpDisableModal({ email, onClose, onDisabled }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !code) {
      setError('Mot de passe et code 2FA requis');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { authKey } = await deriveKeysForUser(password, email);
      const passwordHash = await hashForServer(authKey);
      await totpApi.disable({ passwordHash, totpCode: code });
      onDisabled();
    } catch (err) {
      setError(err.response?.data?.error || 'Désactivation refusée');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Désactivation de la 2FA" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="font-mono text-sm text-grey leading-relaxed">
          <span className="text-yellow-400">⚠</span> La désactivation supprimera votre secret TOTP et tous
          vos codes de secours. Vous devrez réactiver la 2FA pour la retrouver.
        </p>

        <div>
          <label
            htmlFor="disable-password"
            className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2"
          >
            Mot de passe maître
          </label>
          <input
            id="disable-password"
            name="disable-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            autoComplete="current-password"
            autoFocus
            className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none transition-all"
            placeholder="••••••••••••"
            required
          />
        </div>

        <div>
          <label
            htmlFor="disable-totp"
            className="block text-cyan font-mono text-xs uppercase tracking-wider mb-2"
          >
            Code à 6 chiffres 2FA
          </label>
          <input
            id="disable-totp"
            name="disable-totp"
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            aria-invalid={!!error}
            aria-describedby={error ? 'disable-error' : undefined}
            className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono text-xl tracking-[0.5em] text-center focus:border-cyan focus:outline-none transition-all"
            placeholder="••••••"
            required
          />
        </div>

        {error && (
          <div
            id="disable-error"
            role="alert"
            className="bg-red-900/30 border border-red-500/50 text-red-300 px-3 py-2 rounded font-mono text-sm"
          >
            <span className="text-red-500">ERROR:</span> {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 px-4 bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading uppercase tracking-wider rounded transition-all disabled:opacity-50"
          >
            [ Annuler ]
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 border-2 border-red-500/40 hover:border-red-500 font-heading uppercase tracking-wider py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '[ Désactivation... ]' : '[ Désactiver ]'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Modal accessible : focus piege simplement (autoFocus sur premier input),
// fermeture via ESC, role dialog + aria-modal, label par titre.
function Modal({ title, onClose, children }) {
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="bg-mid-navy border-2 border-lime/30 rounded-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-glow-lg"
      >
        <h3
          id={titleId}
          className="font-heading text-xl text-lime uppercase tracking-wider mb-4 border-b border-lime/30 pb-2"
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export default TotpManager;
