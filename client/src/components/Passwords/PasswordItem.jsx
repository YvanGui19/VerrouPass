import { useState } from 'react';

export default function PasswordItem({ item, onView, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';

  const copyPassword = async (e) => {
    e.stopPropagation();
    if (!item.password) return;
    try {
      await navigator.clipboard.writeText(item.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  return (
    <div
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView();
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-mid-navy border-2 border-cyan/20 rounded-lg p-4 hover:border-cyan/40 hover:shadow-[0_0_15px_rgba(1,255,255,0.1)] transition-all cursor-pointer flex flex-col gap-3"
    >
      {/* Header : avatar + nom */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-dark-navy border border-lime/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-lime font-heading text-lg">{initial}</span>
        </div>
        <h3 className="font-heading text-lg text-lime uppercase tracking-wider truncate flex-1">
          {item.name}
        </h3>
      </div>

      {/* Username + URL (compact) */}
      <div className="min-h-[2.5rem] flex flex-col gap-1">
        {item.username && (
          <span className="text-sm text-grey font-mono truncate" title={item.username}>
            {item.username}
          </span>
        )}
        {item.url && (
          <span className="text-xs text-cyan/70 font-mono truncate" title={item.url}>
            {item.url}
          </span>
        )}
      </div>

      {/* Indicateurs presence (TOTP / notes) */}
      {(item.totpSecret || item.notes) && (
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
          {item.totpSecret && (
            <span className="px-2 py-0.5 bg-cyan/10 text-cyan border border-cyan/30 rounded">
              2FA
            </span>
          )}
          {item.notes && (
            <span className="px-2 py-0.5 bg-lime/10 text-lime border border-lime/30 rounded">
              Notes
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-2 mt-auto border-t border-cyan/10">
        {item.password && (
          <button
            onClick={copyPassword}
            className={`p-2 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${
              copied ? 'text-lime' : 'text-cyan hover:text-lime'
            }`}
            title={copied ? 'Copié' : 'Copier le mot de passe'}
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-cyan hover:text-lime rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          title="Modifier"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-grey hover:text-red-400 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          title="Supprimer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
