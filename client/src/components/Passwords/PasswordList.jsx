import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePasswords } from '../../hooks/usePasswords';
import { useAuth } from '../../hooks/useAuth';
import Header from '../Header';
import PasswordItem from './PasswordItem';
import PasswordForm from './PasswordForm';
import PasswordDetail from './PasswordDetail';
import UnlockPrompt from './UnlockPrompt';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 280;
const ROULETTE_HEIGHT = 420;

// Décale l'offset brut vers le plus court chemin sur le cercle (boucle infinie).
function wrapOffset(raw, length) {
  if (length <= 1) return 0;
  const half = length / 2;
  if (raw > half) return raw - length;
  if (raw < -half) return raw + length;
  return raw;
}

// Position 3D d'une carte relative au centre. Au-delà de ±3 on la masque.
function getCardTransform(offset) {
  const abs = Math.abs(offset);
  if (abs > 3) return { x: 0, rotateY: 0, scale: 0, opacity: 0, z: -500 };
  const sign = Math.sign(offset);
  return {
    x: sign * Math.min(abs, 3) * 160,
    rotateY: -sign * Math.min(abs, 3) * 30,
    scale: abs === 0 ? 1 : 1 - abs * 0.08,
    opacity: abs === 0 ? 1 : Math.max(0, 0.7 - (abs - 1) * 0.25),
    z: -abs * 120,
  };
}

export default function PasswordList() {
  const { user, isUnlocked, logout } = useAuth();
  const { items, loading, error, fetchItems, addItem, updateItem, deleteItem } = usePasswords();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (isUnlocked) {
      fetchItems();
    }
  }, [isUnlocked, fetchItems]);

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

  if (!isUnlocked) {
    return <UnlockPrompt />;
  }

  const handleAdd = async (data) => {
    await addItem(data);
    setShowForm(false);
  };

  const handleView = (item) => {
    setViewingItem(item);
  };

  const handleEdit = (item) => {
    setViewingItem(null);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdate = async (data) => {
    await updateItem(editingItem.id, data);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette entrée ?')) {
      await deleteItem(id);
      if (viewingItem?.id === id) setViewingItem(null);
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

  const currentItem = sortedItems[currentIndex];

  return (
    <div className="min-h-screen bg-dark-navy">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="RECHERCHER..."
              className="w-full px-4 py-3 bg-mid-navy border-2 border-cyan/30 rounded text-white font-mono placeholder-grey focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-lime hover:bg-lime-dim text-dark-navy font-heading text-lg uppercase tracking-wider px-6 py-3 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
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
          <div className="relative">
            {/* Scène 3D */}
            <div
              className="relative mx-auto flex items-center justify-center"
              style={{
                height: `${ROULETTE_HEIGHT}px`,
                perspective: '1400px',
                perspectiveOrigin: '50% 50%',
              }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {sortedItems.map((item, index) => {
                const offset = wrapOffset(index - currentIndex, sortedItems.length);
                const { x, rotateY, scale, opacity, z } = getCardTransform(offset);
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
                        onEdit={() => handleEdit(item)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
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

            {/* Nom centré (lisible même quand la carte est tilted légèrement) */}
            <AnimatePresence mode="wait">
              {currentItem && (
                <motion.p
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-xs text-grey text-center mt-4 uppercase tracking-[0.2em]"
                >
                  // {currentItem.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
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
          <div className="mt-8 pt-4 border-t border-lime/10">
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
          onClose={() => setViewingItem(null)}
          onEdit={() => handleEdit(viewingItem)}
          onDelete={() => handleDelete(viewingItem.id)}
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
