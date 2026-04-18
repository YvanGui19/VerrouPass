/**
 * Client API pour communiquer avec le serveur VerrouPass
 */

import axios from 'axios';
import { getToken, getServerUrl } from './config.js';

// Créer une instance axios avec la configuration par défaut
const api = axios.create({
  baseURL: getServerUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const message = error.response.data?.error || error.response.statusText;
      throw new Error(message);
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      // Erreur lors de la configuration de la requête
      throw new Error(error.message);
    }
  }
);

// Fonctions de l'API

export async function login(email, password) {
  const response = await api.post('/auth/login', { email, passwordHash: password });
  return response.data;
}

export async function register(email, password) {
  const response = await api.post('/auth/register', { email, passwordHash: password });
  return response.data;
}

export async function getVaultItems() {
  const response = await api.get('/vault');
  return response.data.items;
}

export async function getVaultItem(id) {
  const response = await api.get(`/vault/${id}`);
  return response.data.item;
}

export async function createVaultItem(encryptedData, iv) {
  const response = await api.post('/vault', { encryptedData, iv });
  return response.data.item;
}

export async function updateVaultItem(id, encryptedData, iv) {
  const response = await api.put(`/vault/${id}`, { encryptedData, iv });
  return response.data.item;
}

export async function deleteVaultItem(id) {
  const response = await api.delete(`/vault/${id}`);
  return response.data;
}

export async function deleteAccount(passwordHash) {
  const response = await api.delete('/auth/account', {
    data: { passwordHash }
  });
  return response.data;
}

export default api;
