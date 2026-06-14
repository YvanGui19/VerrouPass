import { useState } from 'react';
import TOTPDisplay from '../TOTP/TOTPDisplay';

export default function PasswordDetail({ item, onClose, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-mid-navy border-2 border-lime/20 rounded-lg shadow-glow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
          {/* Header avec avatar + nom + close */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-12 h-12 bg-dark-navy border border-lime/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lime font-heading text-xl">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-xl sm:text-2xl text-lime uppercase tracking-wider truncate">
                {item.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-grey hover:text-red-400 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              title="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Identifiant */}
            {item.username && (
              <div>
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">Identifiant</label>
                <div className="flex items-center gap-2 bg-dark-navy border border-cyan/20 rounded px-3 py-2">
                  <span className="text-sm text-white font-mono flex-1 break-all">{item.username}</span>
                  <button
                    onClick={() => copyToClipboard(item.username, 'username')}
                    className="p-2 text-cyan hover:text-lime rounded transition-colors flex-shrink-0"
                    title="Copier l'identifiant"
                  >
                    {copied === 'username' ? (
                      <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mot de passe */}
            {item.password && (
              <div>
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">Mot de passe</label>
                <div className="flex items-center gap-2 bg-dark-navy border border-cyan/20 rounded px-3 py-2">
                  <span className="text-sm text-white font-mono flex-1 break-all">
                    {showPassword ? item.password : '••••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-cyan hover:text-lime rounded transition-colors flex-shrink-0"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.password, 'password')}
                    className="p-2 text-cyan hover:text-lime rounded transition-colors flex-shrink-0"
                    title="Copier le mot de passe"
                  >
                    {copied === 'password' ? (
                      <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TOTP */}
            {item.totpSecret && (
              <div>
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">2FA / TOTP</label>
                <div className="bg-dark-navy border border-cyan/20 rounded px-3 py-2">
                  <TOTPDisplay
                    secret={item.totpSecret}
                    onCopy={() => {
                      setCopied('totp');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                  />
                </div>
              </div>
            )}

            {/* URL */}
            {item.url && (
              <div>
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">URL</label>
                <a
                  href={item.url.includes('://') ? item.url : `https://${item.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-dark-navy border border-cyan/20 rounded px-3 py-2 text-sm text-cyan hover:text-lime font-mono transition-colors break-all"
                >
                  {item.url}
                </a>
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div>
                <label className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">Notes</label>
                <div className="bg-dark-navy border border-cyan/20 rounded px-3 py-2 text-sm text-white font-mono whitespace-pre-wrap break-words">
                  {item.notes}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-6 border-t border-lime/10">
            <button
              onClick={onDelete}
              className="flex-1 py-3 px-4 bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 border-2 border-red-500/30 font-heading uppercase tracking-wider rounded transition-all"
            >
              [ Supprimer ]
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
            >
              [ Modifier ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
