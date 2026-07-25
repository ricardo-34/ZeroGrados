import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zg_token');
    if (!token) {
      setCargando(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUsuario(res.data.usuario))
      .catch(() => {
        localStorage.removeItem('zg_token');
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('zg_token', res.data.token);
    setUsuario(res.data.usuario);
    return res.data.usuario;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignorar
    }
    localStorage.removeItem('zg_token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
