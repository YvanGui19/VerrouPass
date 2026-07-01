import { useState } from 'react';

export default function PasswordItem({ item, onView, onToggleFavorite, favoritesFull }) {
  const starDisabled = favoritesFull && !item.favorite;
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
    <div className={`bg-mid-navy border-2 rounded-lg overflow-hidden hover:shadow-[0_0_15px_rgba(1,255,255,0.1)] transition-all flex flex-col h-full ${
      item.favorite ? 'border-lime/60 hover:border-lime' : 'border-cyan/20 hover:border-cyan/40'
    }`}>
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
        {/* Header : avatar + nom + [etoile favori] + édit */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-dark-navy border border-lime/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lime font-heading text-lg">{initial}</span>
          </div>
          <h3 className="font-heading text-lg uppercase tracking-wider truncate flex-1 mt-1 text-lime">
            {item.name}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (starDisabled) return;
              onToggleFavorite?.();
            }}
            disabled={starDisabled}
            className={`p-2 rounded transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center flex-shrink-0 -mr-1 -mt-1 ${
              item.favorite
                ? 'text-lime hover:text-lime-dim drop-shadow-[0_0_6px_rgba(194,254,11,0.6)]'
                : starDisabled
                ? 'text-grey/30 cursor-not-allowed'
                : 'text-grey hover:text-lime'
            }`}
            title={
              item.favorite
                ? 'Retirer des favoris'
                : starDisabled
                ? 'Limite de 5 favoris atteinte'
                : 'Definir comme favori'
            }
            aria-pressed={!!item.favorite}
            aria-disabled={starDisabled}
          >
            <svg
              className="w-4 h-4"
              fill={item.favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.786 5.497h5.781c.969 0 1.371 1.24.588 1.81l-4.676 3.397 1.786 5.497c.3.921-.755 1.688-1.539 1.118L12 16.847l-4.677 3.399c-.783.57-1.838-.197-1.539-1.118l1.786-5.497-4.676-3.397c-.783-.57-.38-1.81.588-1.81h5.781l1.786-5.497z"
              />
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

      {/* Bouton Copier - hauteur fixe, texte nudge de 2px pour compenser
          la baseline haute de Bebas Neue */}
      {item.password && (
        <>
        <div className={`h-0.5 shrink-0 transition-colors ${copied ? 'bg-lime' : 'bg-lime/20'}`} />
        <button
          onClick={copyPassword}
          className={`w-full h-11 px-4 font-heading uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
            copied
              ? 'bg-lime text-dark-navy'
              : 'bg-lime/10 text-lime hover:bg-lime hover:text-dark-navy hover:shadow-[0_0_15px_rgba(194,254,11,0.4)]'
          }`}
          title="Copier le mot de passe"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="translate-y-[2px]">Copié</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="translate-y-[2px]">Copier</span>
            </>
          )}
        </button>
        </>
      )}
    </div>
  );
}
