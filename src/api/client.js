import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Adjunta token del localStorage si existe (fallback a cookie httpOnly)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

// Normaliza mensajes de error
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;