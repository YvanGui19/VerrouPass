import axios from 'axios';

const API_URL = '/api';

// Instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Envoie les cookies HttpOnly avec chaque requête
});

// Variable pour éviter les rafraîchissements multiples simultanés
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = () => {
  refreshSubscribers.forEach(callback => callback());
  refreshSubscribers = [];
};

// Intercepteur pour gérer les erreurs d'authentification et le refresh automatique
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si token expiré et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        // Attendre que le refresh en cours se termine
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenter de rafraîchir le token
        await api.post('/auth/refresh');
        isRefreshing = false;
        onTokenRefreshed();

        // Réessayer la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // Refresh échoué, rediriger vers login
        const isOnLoginPage = window.location.pathname === '/login';
        if (!isOnLoginPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Autres erreurs 401 (non liées à l'expiration)
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/refresh');
      const isOnLoginPage = window.location.pathname === '/login';

      if (!isAuthRequest && !isOnLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  async register(email, passwordHash, invitationCode) {
    const response = await api.post('/auth/register', { email, passwordHash, invitationCode });
    return response.data;
  },

  async login(email, passwordHash) {
    const response = await api.post('/auth/login', { email, passwordHash });
    return response.data;
  },

  async verify() {
    const response = await api.post('/auth/verify');
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refresh() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async changePassword(oldPasswordHash, newPasswordHash, reencryptedItems) {
    const response = await api.put('/auth/change-password', {
      oldPasswordHash,
      newPasswordHash,
      reencryptedItems
    });
    return response.data;
  },

  async deleteAccount(passwordHash) {
    const response = await api.delete('/auth/account', {
      data: { passwordHash }
    });
    return response.data;
  }
};

// Vault API
export const vaultApi = {
  async getAll() {
    const response = await api.get('/vault');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/vault/${id}`);
    return response.data;
  },

  async create(encryptedData, iv) {
    const response = await api.post('/vault', { encryptedData, iv });
    return response.data;
  },

  async update(id, encryptedData, iv) {
    const response = await api.put(`/vault/${id}`, { encryptedData, iv });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/vault/${id}`);
    return response.data;
  }
};

export default api;
