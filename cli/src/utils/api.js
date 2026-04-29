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

// 1ere etape du login. Envoie le passwordHash (PBKDF2 + transformation,
// jamais le password en clair) sous le nom de champ attendu par le serveur.
// Retourne { token, user } pour un compte sans 2FA, ou { totpRequired: true,
// challenge } si le compte a active la 2FA.
export async function login(email, passwordHash) {
  const response = await api.post('/auth/login', { email, passwordHash });
  return response.data;
}

// 2e etape du login pour les comptes avec 2FA active. Echange le challenge JWT
// (recu en reponse a /login) contre des cookies de session, en fournissant
// soit un code TOTP a 6 chiffres, soit un code de secours.
// Body : { challenge, totpCode } ou { challenge, recoveryCode }.
export async function loginTotp({ challenge, totpCode, recoveryCode }) {
  const body = { challenge };
  if (totpCode) body.totpCode = totpCode;
  if (recoveryCode) body.recoveryCode = recoveryCode;
  const response = await api.post('/auth/login/totp', body);
  return response.data;
}

export async function register(email, passwordHash, invitationCode) {
  const response = await api.post('/auth/register', {
    email,
    passwordHash,
    invitationCode
  });
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

export default api;
