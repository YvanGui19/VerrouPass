import { useState, useCallback, useRef, useEffect } from 'react';
import { vaultApi } from '../utils/api';
import { encrypt, decrypt } from '../utils/crypto';
import { useAuth } from './useAuth';

// Extrait uniquement les champs chiffres d'un item (retire les meta serveur).
function pickPayload(item) {
  return {
    name: item.name ?? '',
    username: item.username ?? '',
    password: item.password ?? '',
    url: item.url ?? '',
    notes: item.notes ?? '',
    favorite: !!item.favorite,
  };
}

// Plafond de favoris affiches dans la bande sous le carousel.
export const MAX_FAVORITES = 5;

export function usePasswords() {
  const { encKey } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Récupérer et déchiffrer toutes les entrées
  const fetchItems = useCallback(async () => {
    if (!encKey) {
      setError('Coffre verrouille');
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
      throw new Error('Coffre verrouille');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les données
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

  // Modifier une entrée
  const updateItem = useCallback(async (id, itemData) => {
    if (!encKey) {
      throw new Error('Coffre verrouille');
    }

    setLoading(true);
    setError(null);

    try {
      // Chiffrer les données
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

  // Toggle du favori sur une entree. Plafonne a MAX_FAVORITES : au-dela on
  // rejette avec un message clair, la modification n'est pas appliquee.
  const setFavorite = useCallback(async (id) => {
    if (!encKey) throw new Error('Coffre verrouille');
    const current = itemsRef.current;
    const target = current.find((i) => i.id === id);
    if (!target) return;
    const willBecomeFavorite = !target.favorite;
    if (willBecomeFavorite) {
      const count = current.filter((i) => i.favorite).length;
      if (count >= MAX_FAVORITES) {
        const err = new Error(
          `Maximum ${MAX_FAVORITES} favoris. Retirez-en un pour en ajouter un autre.`
        );
        err.code = 'FAVORITES_FULL';
        setError(err.message);
        throw err;
      }
    }
    await updateItem(id, { ...pickPayload(target), favorite: willBecomeFavorite });
    if (error) setError(null);
  }, [encKey, updateItem, error]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setFavorite,
  };
}

export default usePasswords;
