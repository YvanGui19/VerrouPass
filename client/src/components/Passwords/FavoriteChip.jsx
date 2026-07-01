import { useEffect, useState } from 'react';

// Puce favori affichee dans la bande sous la navigation du carousel.
// Face avant : nom centre. Face arriere : "Copié" (feedback, pas action).
// Un clic sur le chip = flip 3D + copie automatique du mot de passe.
// Le contenu des deux faces est monte / demonte via un timer aligne sur
// la mi-course de l'animation (250 ms sur 500 ms total), ce qui garantit
// qu'une seule face est jamais visible a la fois - independamment du
// support de backface-visibility par le navigateur.
export default function FavoriteChip({ item, isFlipped, onFlipToggle }) {
  const [showBack, setShowBack] = useState(isFlipped);

  // Bascule le contenu affiche a la moitie de l'animation (250 ms).
  useEffect(() => {
    const t = setTimeout(() => setShowBack(isFlipped), 250);
    return () => clearTimeout(t);
  }, [isFlipped]);

  const handleClick = async () => {
    // Copie immediate au clic quand on part de la face avant vers l'arriere.
    if (!isFlipped && item.password) {
      try {
        await navigator.clipboard.writeText(item.password);
      } catch (err) {
        console.error('Erreur copie:', err);
      }
    }
    onFlipToggle();
  };

  return (
    <div
      className="relative w-full h-[68px] sm:h-[92px] short:h-[72px]"
      style={{ perspective: '800px' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative w-full h-full block"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          willChange: 'transform',
        }}
        aria-label={
          isFlipped
            ? `Retourner ${item.name}`
            : `Copier le mot de passe de ${item.name} et retourner la carte`
        }
        aria-pressed={isFlipped}
      >
        {/* Face avant - nom */}
        <span
          className={`absolute inset-0 flex items-center justify-center bg-mid-navy border-2 rounded px-2 transition-colors ${
            isFlipped ? 'border-lime/40' : 'border-lime/40 hover:border-lime'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          aria-hidden={showBack}
        >
          {!showBack && (
            <span className="font-heading text-lime text-sm sm:text-base uppercase tracking-wider truncate w-full text-center">
              {item.name}
            </span>
          )}
        </span>

        {/* Face arriere - feedback "Copie" pleine surface */}
        <span
          className="absolute inset-0 rounded overflow-hidden shadow-[0_0_10px_rgba(194,254,11,0.4)]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          aria-hidden={!showBack}
        >
          {showBack && (
            <span
              className={`w-full h-full flex items-center justify-center font-heading uppercase tracking-wider text-sm sm:text-base border-2 rounded ${
                item.password
                  ? 'bg-lime text-dark-navy border-lime'
                  : 'bg-dark-navy text-grey/50 border-grey/40 font-mono text-xs normal-case'
              }`}
            >
              {item.password ? 'Copié' : '(sans mdp)'}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
