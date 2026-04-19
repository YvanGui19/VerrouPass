import { useEffect, useState } from 'react';
import { usePasswords } from '../../hooks/usePasswords';
import { useAuth } from '../../hooks/useAuth';
import Header from '../Header';
import PasswordItem from './PasswordItem';
import PasswordForm from './PasswordForm';
import UnlockPrompt from './UnlockPrompt';

export default function PasswordList() {
  const { user, isUnlocked, logout } = useAuth();
  const { items, loading, error, fetchItems, addItem, updateItem, deleteItem } = usePasswords();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isUnlocked) {
      fetchItems();
    }
  }, [isUnlocked, fetchItems]);

  if (!isUnlocked) {
    return <UnlockPrompt />;
  }

  const filteredItems = items.filter(item =>
    !item.error && (
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleAdd = async (data) => {
    await addItem(data);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdate = async (data) => {
    await updateItem(editingItem.id, data);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette entree ?')) {
      await deleteItem(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

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
              Base de donnees vide
            </h3>
            <p className="font-mono text-grey mb-8">// Ajoutez votre premier mot de passe securise</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-lime hover:bg-lime-dim text-dark-navy font-heading text-lg uppercase tracking-wider px-8 py-3 rounded transition-all shadow-[0_0_15px_rgba(194,254,11,0.4)]"
            >
              [ Nouvelle Entree ]
            </button>
          </div>
        )}

        {/* Items list */}
        {filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <PasswordItem
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {searchQuery && filteredItems.length === 0 && items.length > 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-grey text-lg">
              <span className="text-red-400">[ 0 RESULTATS ]</span><br />
              <span className="text-sm">// Aucune correspondance pour "{searchQuery}"</span>
            </p>
          </div>
        )}

        {/* Stats footer */}
        {items.length > 0 && (
          <div className="mt-8 pt-4 border-t border-lime/10">
            <p className="font-mono text-xs text-grey/70 text-center">
              <span className="text-cyan">{items.length}</span> entree{items.length > 1 ? 's' : ''} •
              <span className="text-lime"> {filteredItems.length}</span> affichee{filteredItems.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </main>

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
