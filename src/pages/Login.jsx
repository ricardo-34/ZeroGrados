import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { resetSocket } from '../hooks/useSocket.js';
import { Alert } from '../components/UI.jsx';

const DEMO = [
  { rol: 'Admin', email: 'admin@zerogrados.com', pass: 'admin123' },
  { rol: 'Cajero', email: 'cajero@zerogrados.com', pass: 'cajero123' },
  { rol: 'Mesero', email: 'mesero@zerogrados.com', pass: 'mesero123' },
  { rol: 'Cocina', email: 'cocina@zerogrados.com', pass: 'cocina123' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      resetSocket();
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const usarDemo = (d) => {
    setEmail(d.email);
    setPassword(d.pass);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--verde-oscuro), var(--verde-bosque))',
        padding: 16,
      }}
    >
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--verde-esmeralda)' }}>
            Zero Grados 0°
          </div>
          <div className="text-muted">Sistema POS — Heladería y Granizados</div>
        </div>

        <Alert type="error">{error}</Alert>

        <form onSubmit={submit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@zerogrados.com"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt">
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Accesos de demostración:
          </div>
          <div className="flex flex-wrap gap-sm">
            {DEMO.map((d) => (
              <button
                key={d.email}
                className="btn btn-outline btn-sm"
                onClick={() => usarDemo(d)}
                type="button"
              >
                {d.rol}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
