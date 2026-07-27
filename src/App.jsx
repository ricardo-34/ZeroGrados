import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Loading } from './components/UI.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import POS from './pages/POS.jsx';
import Caja from './pages/Caja.jsx';
import Pedidos from './pages/Pedidos.jsx';
import Mesero from './pages/Mesero.jsx';
import Mesas from './pages/Mesas.jsx';
import Cocina from './pages/Cocina.jsx';
import Productos from './pages/Productos.jsx';
import Inventario from './pages/Inventario.jsx';
import Compras from './pages/Compras.jsx';
import Clientes from './pages/Clientes.jsx';
import Proveedores from './pages/Proveedores.jsx';
import Reportes from './pages/Reportes.jsx';
import Contabilidad from './pages/Contabilidad.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Juegos from './pages/Juegos.jsx';
import JuegosRegistro from './pages/JuegosRegistro.jsx';

// Ruta de inicio según rol
const INICIO = {
  admin: '/dashboard',
  cajero: '/pos',
  mesero: '/mesero',
  cocina: '/cocina',
   juegos: '/juegos',
};

function Protegido({ roles, children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Loading text="Verificando sesión..." />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={INICIO[usuario.rol] || '/login'} replace />;
  }
  return children;
}

export default function App() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Loading text="Cargando Zero Grados..." />;

  return (
    <Routes>
      {/* Landing pública: la ve cualquiera que no haya iniciado sesión.
          Si ya hay sesión, se redirige a su panel según el rol. */}
      <Route
        path="/"
        element={usuario ? <Navigate to={INICIO[usuario.rol] || '/pos'} replace /> : <Landing />}
      />

      <Route
        path="/login"
        element={usuario ? <Navigate to={INICIO[usuario.rol] || '/pos'} replace /> : <Login />}
      />

      <Route element={<Protegido><Layout /></Protegido>}>
        <Route path="/dashboard" element={<Protegido roles={['admin']}><Dashboard /></Protegido>} />
        <Route path="/pos" element={<Protegido roles={['admin', 'cajero']}><POS /></Protegido>} />
        <Route path="/caja" element={<Protegido roles={['admin', 'cajero']}><Caja /></Protegido>} />
        <Route path="/juegos" element={<Protegido roles={['admin', 'cajero']}><Juegos /></Protegido>} />
        <Route path="/pedidos" element={<Protegido roles={['admin', 'cajero']}><Pedidos /></Protegido>} />
        <Route path="/mesero" element={<Protegido roles={['admin', 'mesero']}><Mesero /></Protegido>} />
        <Route path="/mesas" element={<Protegido roles={['admin']}><Mesas /></Protegido>} />
        <Route path="/cocina" element={<Protegido roles={['admin', 'cocina']}><Cocina /></Protegido>} />
        <Route path="/productos" element={<Protegido roles={['admin', 'cajero']}><Productos /></Protegido>} />
        <Route path="/inventario" element={<Protegido roles={['admin']}><Inventario /></Protegido>} />
        <Route path="/compras" element={<Protegido roles={['admin']}><Compras /></Protegido>} />
        <Route path="/clientes" element={<Protegido roles={['admin', 'cajero']}><Clientes /></Protegido>} />
        <Route path="/proveedores" element={<Protegido roles={['admin']}><Proveedores /></Protegido>} />
        <Route path="/reportes" element={<Protegido roles={['admin', 'cajero']}><Reportes /></Protegido>} />
        <Route path="/contabilidad" element={<Protegido roles={['admin']}><Contabilidad /></Protegido>} />
        <Route path="/usuarios" element={<Protegido roles={['admin']}><Usuarios /></Protegido>} />
        <Route path="/configuracion" element={<Protegido roles={['admin']}><Configuracion /></Protegido>} />
        <Route path="/juegos" element={<Protegido roles={['admin', 'cajero', 'juegos']}><Juegos /></Protegido>} />
<Route path="/juegos-registro" element={<Protegido roles={['admin', 'cajero', 'juegos']}><JuegosRegistro /></Protegido>} />F
      </Route>

      {/* Cualquier ruta desconocida: al panel si hay sesión, o a la landing. */}
      <Route path="*" element={<Navigate to={usuario ? (INICIO[usuario.rol] || '/pos') : '/'} replace />} />
    </Routes>
  );
}