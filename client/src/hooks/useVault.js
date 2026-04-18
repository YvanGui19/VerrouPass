import { useState, useCallback } from 'react';
import { vaultApi } from '../utils/api';
import { encrypt, decrypt } from '../utils/crypto';
import { useAuth } from './useAuth';

export function useVault() {
  const { encKey } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer et déchiffrer toutes les entrées
  const fetchItems = useCallback(async () => {
    if (!encKey) {
      setError('Coffre verrouillé');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await vaultApi.getAll();

      // Déchiffrer chaque entrée
      const decryptedItems = await Promise.all(
        data.items.map(async (item) => {
          try {
            const decrypted = await decrypt(item.encrypted_data, item.iv, encKey);
            return {
              id: item.id,
              ...decrypted,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            };
          } catch (err) {
            console.error('Erreur déchiffrement:', err);
            return {
              id: item.id,
              name: '[Erreur de déchiffrement]',
              error: true
            };
          }
        })
      );

      setItems(decryptedItems);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [encKey]);

  // Ajouter une nouvelle entrée
  const addItem = useCallback(async (itemData) => {
    if (!encKey) {
      throw new Error('Coffre verrouillé');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les données
      const { encryptedData, iv } = await encrypt(itemData, encKey);

      // Envoyer au serveur
      const data = await vaultApi.create(encryptedData, iv);

      // Ajouter à la liste locale
      const newItem = {
        id: data.item.id,
        ...itemData,
        createdAt: data.item.created_at,
        updatedAt: data.item.updated_at
      };

      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [encKey]);

  // Modifier une entrée
  const updateItem = useCallback(async (id, itemData) => {
    if (!encKey) {
      throw new Error('Coffre verrouillé');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les données
      const { encryptedData, iv } = await encrypt(itemData, encKey);

      // Envoyer au serveur
      const data = await vaultApi.update(id, encryptedData, iv);

      // Mettre à jour la liste locale
      setItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...itemData, updatedAt: data.item.updated_at }
          : item
      ));

      return data.item;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [encKey]);

  // Supprimer une entrée
  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await vaultApi.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem
  };
}

export default useVault;
