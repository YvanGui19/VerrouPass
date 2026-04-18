import axios from 'axios';

const API_URL = '/api';

// Instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  async register(email, passwordHash) {
    const response = await api.post('/auth/register', { email, passwordHash });
    return response.data;
  },

  async login(email, passwordHash) {
    const response = await api.post('/auth/login', { email, passwordHash });
    return response.data;
  },

  async verify() {
    const response = await api.post('/auth/verify');
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
