import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/*
  Shell visual del diseño premium (sidebar oscuro + header claro).
  OPCIONAL. No cambia la lógica de tus páginas: solo las envuelve.

  Uso típico con react-router (ajusta rutas a las tuyas):

    <Route element={<LayoutZeroGrados />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/pos" element={<POS />} />
      ...
    </Route>

  Requiere <Outlet/> => importa Outlet donde uses este layout, o
  pásale children. Aquí se usa Outlet para integrarse con router.
*/
import { Outlet } from 'react-router-dom';

const GRUPOS = [
  {
    titulo: 'Resumen',
    items: [{ to: '/dashboard', label: 'Dashboard' }],
  },
  {
    titulo: 'Operación',
    items: [
      { to: '/pos', label: 'Punto de venta' },
      { to: '/caja', label: 'Caja' },
      { to: '/pedidos', label: 'Pedidos' },
      { to: '/cocina', label: 'Cocina' },
      { to: '/mesero', label: 'Tomar pedido' },
      { to: '/mesas', label: 'Mesas' },
    ],
  },
  {
    titulo: 'Catálogo',
    items: [
      { to: '/productos', label: 'Productos' },
      { to: '/inventario', label: 'Inventario' },
      { to: '/compras', label: 'Compras' },
      { to: '/proveedores', label: 'Proveedores' },
      { to: '/clientes', label: 'Clientes' },
    ],
  },
  {
    titulo: 'Zona de juegos',
    items: [
      { to: '/juegos', label: 'Juegos' },
      { to: '/juegos/registro', label: 'Registro de juegos' },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { to: '/reportes', label: 'Reportes' },
      { to: '/contabilidad', label: 'Contabilidad' },
      { to: '/usuarios', label: 'Usuarios' },
      { to: '/configuracion', label: 'Configuración' },
    ],
  },
];

export default function LayoutZeroGrados() {
  const { usuario } = useAuth?.() || {};
  const location = useLocation();

  const nombre = usuario?.nombre || 'Usuario';
  const rol = usuario?.rol ? usuario.rol[0].toUpperCase() + usuario.rol.slice(1) : '';
  const iniciales = nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const crumb =
    GRUPOS.flatMap((g) => g.items).find((i) => location.pathname.startsWith(i.to))?.label ||
    'Zero Grados';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', minHeight: '100vh', alignItems: 'stretch' }}>
      {/* Sidebar */}
      <aside
        style={{
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
          height: '100vh',
          width: 250,
          boxSizing: 'border-box',
          background: '#062F2D',
          color: '#FFF9EC',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          padding: '22px 0',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 20px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#FFF9EC',
              display: 'grid',
              placeItems: 'center',
              font: '900 16px/1 Anton',
              color: '#0B4F4C',
              flex: 'none',
            }}
          >
            0°
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '400 16px/1 Pacifico', color: '#FFF9EC' }}>Zero Grados</div>
            <div
              style={{
                font: '700 9px/1 Rubik',
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color: '#37D0DE',
                marginTop: 5,
              }}
            >
              Sistema POS
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div
                style={{
                  padding: '16px 20px 6px',
                  font: '700 9px/1 Rubik',
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(191,243,245,.55)',
                }}
              >
                {g.titulo}
              </div>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    textDecoration: 'none',
                    borderLeft: '3px solid ' + (isActive ? '#37D0DE' : 'transparent'),
                    padding: '11px 20px',
                    font: '600 13.5px/1.2 Rubik',
                    background: isActive ? 'rgba(55,208,222,.16)' : 'transparent',
                    color: isActive ? '#FFF9EC' : 'rgba(255,249,236,.62)',
                    transition: 'background .2s,color .2s',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          flex: 'none',
                          background: isActive ? '#37D0DE' : 'rgba(255,249,236,.25)',
                        }}
                      />
                      <span>{it.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 20px' }}>
          <div
            style={{
              background: 'rgba(255,249,236,.07)',
              border: '1px solid rgba(191,243,245,.2)',
              borderRadius: 16,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                font: '700 10px/1 Rubik',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#BFF3F5',
              }}
            >
              Turno activo
            </div>
            <div style={{ font: '600 14px/1.3 Rubik', color: '#FFF9EC', marginTop: 8 }}>{nombre}</div>
            {rol && (
              <div style={{ font: '500 12px/1.3 Rubik', color: 'rgba(255,249,236,.6)', marginTop: 3 }}>
                {rol}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(247,241,227,.92)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(11,79,76,.12)',
            padding: '16px clamp(16px,3vw,34px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              font: '700 11px/1 Rubik',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: '#0E8C86',
            }}
          >
            {crumb}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#0B4F4C',
                color: '#FFD52E',
                display: 'grid',
                placeItems: 'center',
                font: '800 13px/1 Rubik',
              }}
            >
              {iniciales}
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: 'clamp(18px,3vw,34px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
