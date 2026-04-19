import { useState, useCallback } from 'react';
import { vaultApi } from '../utils/api';
import { encrypt, decrypt } from '../utils/crypto';
import { useAuth } from './useAuth';

export function usePasswords() {
  const { encKey } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recuperer et dechiffrer toutes les entrees
  const fetchItems = useCallback(async () => {
    if (!encKey) {
      setError('Coffre verrouille');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await vaultApi.getAll();

      // Dechiffrer chaque entree
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
            console.error('Erreur dechiffrement:', err);
            return {
              id: item.id,
              name: '[Erreur de dechiffrement]',
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

  // Ajouter une nouvelle entree
  const addItem = useCallback(async (itemData) => {
    if (!encKey) {
      throw new Error('Coffre verrouille');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les donnees
      const { encryptedData, iv } = await encrypt(itemData, encKey);

      // Envoyer au serveur
      const data = await vaultApi.create(encryptedData, iv);

      // Ajouter a la liste locale
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

  // Modifier une entree
  const updateItem = useCallback(async (id, itemData) => {
    if (!encKey) {
      throw new Error('Coffre verrouille');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les donnees
      const { encryptedData, iv } = await encrypt(itemData, encKey);

      // Envoyer au serveur
      const data = await vaultApi.update(id, encryptedData, iv);

      // Mettre a jour la liste locale
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

  // Supprimer une entree
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

export default usePasswords;
