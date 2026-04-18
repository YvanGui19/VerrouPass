import { useEffect, useState } from 'react';
import { useVault } from '../../hooks/useVault';
import { useAuth } from '../../hooks/useAuth';
import VaultItem from './VaultItem';
import VaultForm from './VaultForm';
import UnlockPrompt from './UnlockPrompt';

export default function VaultList() {
  const { user, isUnlocked, logout } = useAuth();
  const { items, loading, error, fetchItems, addItem, updateItem, deleteItem } = useVault();
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
    if (confirm('Supprimer cette entrée ?')) {
      await deleteItem(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Vault</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && items.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chargement...
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Votre coffre est vide</h3>
            <p className="text-slate-500 mb-4">Ajoutez votre premier mot de passe</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Ajouter une entrée
            </button>
          </div>
        )}

        {/* Items list */}
        {filteredItems.length > 0 && (
          <div className="space-y-2">
            {filteredItems.map(item => (
              <VaultItem
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
          <div className="text-center py-12 text-slate-500">
            Aucun résultat pour "{searchQuery}"
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <VaultForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdate : handleAdd}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
