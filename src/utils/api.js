import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// URL base del backend, preferiblemente usar variable de entorno en el futuro
// Por ejemplo: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar el token JWT en cada petición automáticamente
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expira o es inválido, deslogueamos al usuario
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
