import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { resetSocket } from '../hooks/useSocket.js';

// Menú por rol
const MENU = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  { to: '/pos', label: 'Punto de Venta', roles: ['admin', 'cajero'] },
  { to: '/caja', label: 'Caja', roles: ['admin', 'cajero'] },
  { to: '/juegos', label: 'Juegos', roles: ['admin', 'cajero'] },
  { to: '/pedidos', label: 'Pedidos', roles: ['admin', 'cajero'] },
  { to: '/mesero', label: 'Tomar Pedido', roles: ['admin', 'mesero'] },
  { to: '/mesas', label: 'Mesas', roles: ['admin'] },
  { to: '/cocina', label: 'Cocina', roles: ['admin', 'cocina'] },
  { to: '/productos', label: 'Productos', roles: ['admin', 'cajero'] },
  { to: '/inventario', label: 'Inventario', roles: ['admin'] },
  { to: '/compras', label: 'Compras', roles: ['admin'] },
  { to: '/clientes', label: 'Clientes', roles: ['admin', 'cajero'] },
  { to: '/proveedores', label: 'Proveedores', roles: ['admin'] },
  { to: '/reportes', label: 'Reportes', roles: ['admin', 'cajero'] },
  { to: '/contabilidad', label: 'Contabilidad', roles: ['admin'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['admin'] },
  { to: '/configuracion', label: 'Configuración', roles: ['admin'] },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const items = MENU.filter((m) => m.roles.includes(usuario?.rol));

  const salir = async () => {
    await logout();
    resetSocket();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: 'var(--verde-oscuro)',
          color: '#fff',
          padding: '16px 12px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          display: abierto ? 'block' : undefined,
        }}
        className="sidebar"
      >
        <div style={{ fontSize: 22, fontWeight: 700, padding: '8px 12px 16px' }}>
          Zero Grados <span style={{ color: 'var(--verde-menta)' }}>0°</span>
        </div>
        <nav>
          {items.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={() => setAbierto(false)}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 12px',
                borderRadius: 8,
                color: '#fff',
                marginBottom: 2,
                background: isActive ? 'var(--verde-esmeralda)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
              })}
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid var(--gris-borde)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-outline btn-sm menu-toggle"
            onClick={() => setAbierto((v) => !v)}
            style={{ display: 'none' }}
          >
            ☰
          </button>
          <div className="text-muted" style={{ fontSize: 14 }}>
            {usuario?.nombre} · <strong style={{ textTransform: 'capitalize' }}>{usuario?.rol}</strong>
          </div>
          <button className="btn btn-outline btn-sm" onClick={salir}>
            Cerrar sesión
          </button>
        </header>

        <main style={{ padding: 20, flex: 1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            z-index: 50;
            display: ${abierto ? 'block' : 'none'} !important;
          }
          .menu-toggle { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
