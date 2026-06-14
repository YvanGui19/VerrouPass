import { useState } from 'react';

export default function PasswordItem({ item, onView, onEdit }) {
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
    <div className="bg-mid-navy border-2 border-cyan/20 rounded-lg overflow-hidden hover:border-cyan/40 hover:shadow-[0_0_15px_rgba(1,255,255,0.1)] transition-all flex flex-col">
      {/* Zone cliquable - infos + ouverture détail */}
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
        className="p-4 cursor-pointer flex flex-col gap-3 flex-1"
      >
        {/* Header : avatar + nom + édit */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-dark-navy border border-lime/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lime font-heading text-lg">{initial}</span>
          </div>
          <h3 className="font-heading text-lg text-lime uppercase tracking-wider truncate flex-1 mt-1">
            {item.name}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-cyan hover:text-lime rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center flex-shrink-0 -mr-1 -mt-1"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Username + URL */}
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

        {/* Badge Notes */}
        {item.notes && (
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
            <span className="px-2 py-0.5 bg-lime/10 text-lime border border-lime/30 rounded">
              Notes
            </span>
          </div>
        )}
      </div>

      {/* Bouton Copier - pleine largeur, prominent */}
      {item.password && (
        <button
          onClick={copyPassword}
          className={`w-full py-3 px-4 font-heading uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all border-t-2 ${
            copied
              ? 'bg-lime text-dark-navy border-lime'
              : 'bg-lime/10 text-lime border-lime/20 hover:bg-lime hover:text-dark-navy hover:border-lime hover:shadow-[0_0_15px_rgba(194,254,11,0.4)]'
          }`}
          title="Copier le mot de passe"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Copié
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copier
            </>
          )}
        </button>
      )}
    </div>
  );
}
