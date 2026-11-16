import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV ? '' : API_BASE_URL.replace(/\/api\/?$/, ''));

export const getApiOrigin = () => API_ORIGIN || window.location.origin;

export const resolveAssetUrl = (path = '') => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (import.meta.env.DEV && path.startsWith('/')) {
    return path;
  }

  const origin = API_ORIGIN || 'http://localhost:5000';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getAuthToken = () => {
  const raw = localStorage.getItem('token');
  if (!raw) {
    return '';
  }

  return raw.replace(/^"|"$/g, '').trim();
};

export const setAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem('token', String(token).trim());
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const setHeader = (headers, key, value) => {
  if (!headers) {
    return;
  }

  if (typeof headers.set === 'function') {
    headers.set(key, value);
    return;
  }

  headers[key] = value;
};

const removeHeader = (headers, key) => {
  if (!headers) {
    return;
  }

  if (typeof headers.delete === 'function') {
    headers.delete(key);
    return;
  }

  delete headers[key];
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    setHeader(config.headers, 'Authorization', `Bearer ${token}`);
  }

  if (config.data instanceof FormData) {
    removeHeader(config.headers, 'Content-Type');
    removeHeader(config.headers, 'content-type');
    setHeader(config.headers, 'Content-Type', false);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = error.response?.data?.message || '';
      if (/token|authorization|session/i.test(message)) {
        error.sessionExpired = true;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
