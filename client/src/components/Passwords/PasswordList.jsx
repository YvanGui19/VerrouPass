import { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePasswords } from '../../hooks/usePasswords';
import { useAuth } from '../../hooks/useAuth';
import Header from '../Header';
import PasswordItem from './PasswordItem';
import PasswordForm from './PasswordForm';
import PasswordDetail from './PasswordDetail';
import UnlockPrompt from './UnlockPrompt';
import FavoriteChip from './FavoriteChip';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 280;

// Décale l'offset brut vers le plus court chemin sur le cercle (boucle infinie).
function wrapOffset(raw, length) {
  if (length <= 1) return 0;
  const half = length / 2;
  if (raw > half) return raw - length;
  if (raw < -half) return raw + length;
  return raw;
}

// Position 3D d'une carte relative au centre. Au-delà de ±3 on la masque.
// Les cartes latérales restent opaques (empêche de voir a travers) et sont
// floutées de plus en plus (empêche la lecture / capture d'écran).
function getCardTransform(offset) {
  const abs = Math.abs(offset);
  if (abs > 3) return { x: 0, rotateY: 0, scale: 0, opacity: 0, z: -500, blur: 0 };
  const sign = Math.sign(offset);
  return {
    x: sign * Math.min(abs, 3) * 160,
    rotateY: -sign * Math.min(abs, 3) * 30,
    scale: abs === 0 ? 1 : 1 - abs * 0.08,
    opacity: abs === 0 ? 1 : 1,
    z: -abs * 120,
    blur: abs === 0 ? 0 : Math.min(4 + (abs - 1) * 6, 18),
  };
}

export default function PasswordList() {
  const { user, isUnlocked, logout } = useAuth();
  const { items, loading, error, fetchItems, addItem, updateItem, deleteItem, setFavorite } = usePasswords();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItemId, setViewingItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [flippedFavoriteId, setFlippedFavoriteId] = useState(null);
  // Une fois la premiere positionnee sur le favori, on n'y touche plus (pour
  // ne pas ecraser le currentIndex quand l'utilisateur navigue ou toggle).
  const initialFavoritePositioned = useRef(false);
  const touchStartX = useRef(null);
  const sceneRef = useRef(null);
  const favoritesStripRef = useRef(null);

  useEffect(() => {
    if (isUnlocked) {
      fetchItems();
    }
  }, [isUnlocked, fetchItems]);

  // Reset le flag de positionnement sur le favori a chaque nouvelle session
  // (verrouillage/deverrouillage).
  useEffect(() => {
    if (!isUnlocked) {
      initialFavoritePositioned.current = false;
      setFlippedFavoriteId(null);
    }
  }, [isUnlocked]);

  // Liste triée alpha (pas filtrée — la recherche déplace le focus, ne filtre pas)
  const sortedItems = useMemo(
    () =>
      items
        .filter((item) => !item.error)
        .sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
        ),
    [items]
  );

  // Recherche : saute sur la 1re carte qui match + déclenche le pulse visuel
  useEffect(() => {
    if (!searchQuery.trim() || sortedItems.length === 0) return;
    const q = searchQuery.toLowerCase();
    const match = sortedItems.findIndex(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.username?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q)
    );
    if (match >= 0 && match !== currentIndex) {
      setCurrentIndex(match);
    }
    if (match >= 0) {
      setHighlightTrigger((h) => h + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortedItems]);

  // Clamp si on supprime la dernière entrée
  useEffect(() => {
    if (currentIndex >= sortedItems.length && sortedItems.length > 0) {
      setCurrentIndex(sortedItems.length - 1);
    }
  }, [sortedItems.length, currentIndex]);

  // Au premier chargement des items apres unlock, positionner sur le favori.
  useEffect(() => {
    if (initialFavoritePositioned.current) return;
    if (sortedItems.length === 0) return;
    const favIndex = sortedItems.findIndex((i) => i.favorite);
    if (favIndex >= 0) {
      setCurrentIndex(favIndex);
    }
    initialFavoritePositioned.current = true;
  }, [sortedItems]);

  // Item couramment ouvert dans la modale, deduit de items pour rester frais
  // apres un toggle favori ou un update.
  const viewingItem = viewingItemId ? items.find((i) => i.id === viewingItemId) : null;

  // Bande favoris : max 5 items, tries alpha comme le reste.
  const favoriteItems = useMemo(
    () => sortedItems.filter((i) => i.favorite).slice(0, 5),
    [sortedItems]
  );
  const favoritesFull = favoriteItems.length >= 5;

  const handleFlipFavorite = (id) => {
    setFlippedFavoriteId((prev) => (prev === id ? null : id));
  };

  // Retourne le chip actuellement flippe si l'utilisateur clique en dehors
  // de la bande favoris.
  useEffect(() => {
    if (!flippedFavoriteId) return;
    const handleClickOutside = (e) => {
      if (favoritesStripRef.current && !favoritesStripRef.current.contains(e.target)) {
        setFlippedFavoriteId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [flippedFavoriteId]);

  const tryToggleFavorite = async (id) => {
    try {
      await setFavorite(id);
    } catch (_err) {
      // Le hook a deja setError avec le message pour l'utilisateur.
    }
  };

  const goPrev = () =>
    setCurrentIndex((i) =>
      sortedItems.length === 0 ? 0 : (i - 1 + sortedItems.length) % sortedItems.length
    );
  const goNext = () =>
    setCurrentIndex((i) => (sortedItems.length === 0 ? 0 : (i + 1) % sortedItems.length));

  // Navigation clavier
  useEffect(() => {
    const handler = (e) => {
      // Ignore si on est dans un input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showForm || viewingItem) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sortedItems.length, showForm, viewingItem]);

  // Navigation molette sur la scene (throttle 200ms pour eviter le cascade
  // sur un seul geste de scroll). Listener non-passif pour bloquer le scroll
  // de la page pendant qu'on defile les cartes.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let lock = false;
    const onWheel = (e) => {
      if (sortedItems.length <= 1 || showForm || viewingItem) return;
      e.preventDefault();
      if (lock) return;
      lock = true;
      setTimeout(() => {
        lock = false;
      }, 200);
      const len = sortedItems.length;
      const delta = e.deltaY || e.deltaX;
      if (delta > 0) setCurrentIndex((i) => (i + 1) % len);
      else if (delta < 0) setCurrentIndex((i) => (i - 1 + len) % len);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [sortedItems.length, showForm, viewingItem]);

  // Touchmove non-passif pour bloquer les gestes systeme du navigateur
  // (retour arriere Android, changement d'onglet) pendant qu'on swipe
  // horizontalement sur les cartes.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    let startX = null;
    let startY = null;
    const onStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (startX === null) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
      }
    };
    const onEnd = () => {
      startX = null;
      startY = null;
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [sortedItems.length]);

  if (!isUnlocked) {
    return <UnlockPrompt />;
  }

  const handleAdd = async (data) => {
    await addItem(data);
    setShowForm(false);
  };

  const handleView = (item) => {
    setViewingItemId(item.id);
  };

  const handleEdit = (item) => {
    setViewingItemId(null);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdate = async (data) => {
    // Preserve le flag favori qui n'est pas expose dans le formulaire
    // d'edition (il se toggle uniquement depuis la modale de detail).
    await updateItem(editingItem.id, { ...data, favorite: !!editingItem.favorite });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette entrée ?')) {
      await deleteItem(id);
      if (viewingItemId === id) setViewingItemId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) goPrev();
    else if (dx < -50) goNext();
    touchStartX.current = null;
  };

  return (
    <div
      className="bg-dark-navy flex flex-col overflow-hidden"
      style={{ height: '100svh' }}
    >
      <Header />

      <main className="max-w-6xl w-full mx-auto px-4 py-2 sm:py-8 flex flex-col">
        {/* Actions - flex-row toujours pour economiser la hauteur sur mobile */}
        <div className="flex flex-row gap-2 sm:gap-4 mb-3 sm:mb-8 shrink-0">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="RECHERCHER..."
              className="w-full px-3 sm:px-4 py-3 bg-mid-navy border-2 border-cyan/30 rounded text-white font-mono placeholder-grey focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-lime hover:bg-lime-dim text-dark-navy font-heading text-lg uppercase tracking-wider px-3 sm:px-6 py-3 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)] flex items-center justify-center gap-2 shrink-0"
            aria-label="Ajouter une entrée"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 font-mono text-sm">
            <span className="text-red-500 font-bold">ERROR:</span> {error}
          </div>
        )}

        {/* Loading */}
        {loading && items.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block animate-pulse">
              <p className="font-mono text-cyan text-lg">[ CHARGEMENT... ]</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-mid-navy border-2 border-lime/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
              <svg className="w-10 h-10 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl text-lime uppercase tracking-wider mb-2">
              Base de données vide
            </h3>
            <p className="font-mono text-grey mb-8">// Ajoutez votre premier mot de passe sécurisé</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-lime hover:bg-lime-dim text-dark-navy font-heading text-lg uppercase tracking-wider px-8 py-3 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)]"
            >
              [ Nouvelle Entrée ]
            </button>
          </div>
        )}

        {/* Roulette coverflow */}
        {sortedItems.length > 0 && (
          <>
          {/* Scène 3D - hauteur fixe pour rester collee aux flèches */}
          <div
            ref={sceneRef}
            className="relative mx-auto flex items-center justify-center w-full h-[300px] shrink-0"
              style={{
                perspective: '1400px',
                perspectiveOrigin: '50% 50%',
                touchAction: 'pan-y',
              }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {sortedItems.map((item, index) => {
                const offset = wrapOffset(index - currentIndex, sortedItems.length);
                const { x, rotateY, scale, opacity, z, blur } = getCardTransform(offset);
                const isCenter = offset === 0;
                return (
                  <motion.div
                    key={item.id}
                    animate={{
                      x,
                      rotateY,
                      scale,
                      opacity,
                      z,
                      filter: `blur(${blur}px)`,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                    style={{
                      position: 'absolute',
                      width: `${CARD_WIDTH}px`,
                      minHeight: `${CARD_HEIGHT}px`,
                      left: '50%',
                      top: '50%',
                      marginLeft: `-${CARD_WIDTH / 2}px`,
                      marginTop: `-${CARD_HEIGHT / 2}px`,
                      zIndex: 10 - Math.abs(offset),
                      transformStyle: 'preserve-3d',
                      pointerEvents: isCenter ? 'auto' : 'none',
                      cursor: 'default',
                    }}
                  >
                    <div className="relative">
                      {/* Pulse lime sur la carte ciblée par la recherche */}
                      {isCenter && (
                        <motion.div
                          key={highlightTrigger}
                          initial={{ boxShadow: '0 0 40px 8px rgba(194,254,11,0.8)' }}
                          animate={{ boxShadow: '0 0 0px 0px rgba(194,254,11,0)' }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-lg pointer-events-none"
                        />
                      )}
                      <PasswordItem
                        item={item}
                        onView={() => isCenter && handleView(item)}
                        onToggleFavorite={isCenter ? () => tryToggleFavorite(item.id) : undefined}
                        favoritesFull={favoritesFull}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Navigation - collee au plus pres de la scene */}
          <div className="relative z-20 flex items-center justify-center gap-4 mt-1 shrink-0">
              <button
                onClick={goPrev}
                disabled={sortedItems.length <= 1}
                className="p-3 bg-mid-navy border-2 border-cyan/30 rounded text-cyan hover:border-cyan hover:shadow-[0_0_10px_rgba(1,255,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Précédent (←)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="font-mono text-sm text-grey min-w-[60px] text-center">
                <span className="text-lime">{sortedItems.length > 0 ? currentIndex + 1 : 0}</span>
                <span className="text-grey/50"> / </span>
                <span>{sortedItems.length}</span>
              </div>

              <button
                onClick={goNext}
                disabled={sortedItems.length <= 1}
                className="p-3 bg-mid-navy border-2 border-cyan/30 rounded text-cyan hover:border-cyan hover:shadow-[0_0_10px_rgba(1,255,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Suivant (→)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Bande favoris - jusqu'a 5 raccourcis retournables */}
            {favoriteItems.length > 0 && (
              <div ref={favoritesStripRef} className="mt-1 sm:mt-3 shrink-0 w-full">
                <p className="font-mono text-[10px] text-lime/60 uppercase tracking-wider text-center mb-1">
                  Favoris ({favoriteItems.length}/5)
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 mx-auto max-w-[680px]">
                  {favoriteItems.map((fav) => (
                    <div key={fav.id} className="w-[100px] sm:w-[120px] shrink-0">
                      <FavoriteChip
                        item={fav}
                        isFlipped={flippedFavoriteId === fav.id}
                        onFlipToggle={() => handleFlipFavorite(fav.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty search hint (recherche sans match) */}
        {searchQuery && sortedItems.length > 0 && (() => {
          const q = searchQuery.toLowerCase();
          const anyMatch = sortedItems.some(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.username?.toLowerCase().includes(q) ||
              item.url?.toLowerCase().includes(q)
          );
          if (anyMatch) return null;
          return (
            <p className="font-mono text-grey text-sm text-center mt-6">
              <span className="text-red-400">[ AUCUN RÉSULTAT ]</span>
              <br />
              <span className="text-xs">// Aucune correspondance pour "{searchQuery}"</span>
            </p>
          );
        })()}

        {/* Stats footer */}
        {items.length > 0 && (
          <div className="mt-1 sm:mt-8 pt-1 sm:pt-4 border-t border-lime/10 shrink-0">
            <p className="font-mono text-xs text-grey/70 text-center">
              <span className="text-cyan">{sortedItems.length}</span> entrée{sortedItems.length > 1 ? 's' : ''} dans le coffre
            </p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {viewingItem && (
        <PasswordDetail
          item={viewingItem}
          onClose={() => setViewingItemId(null)}
          onEdit={() => handleEdit(viewingItem)}
          onDelete={() => handleDelete(viewingItem.id)}
          onToggleFavorite={() => tryToggleFavorite(viewingItem.id)}
          favoritesFull={favoritesFull}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <PasswordForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdate : handleAdd}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
