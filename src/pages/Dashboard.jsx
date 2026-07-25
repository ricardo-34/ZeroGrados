import { useFetch } from '../hooks/useFetch.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { money } from '../utils/format.js';
import { Loading, Alert, Empty } from '../components/UI.jsx';

export default function Dashboard() {
  const { data, cargando, error, recargar } = useFetch('/reportes/dashboard');

  // Refrescar cuando llegan ventas o alertas de stock
  useSocketEvent('inventario:stock_bajo', recargar);

  if (cargando) return <Loading />;
  if (error) return <Alert type="error">{error}</Alert>;

  const d = data?.data || {};

  return (
    <div>
      <h1 className="mb">Dashboard</h1>

      <div className="grid grid-3 mb">
        <div className="card">
          <div className="text-muted">Ventas de hoy</div>
          <div className="big-number">{money(d.totalVentasHoy)}</div>
        </div>
        <div className="card">
          <div className="text-muted">N.º de ventas hoy</div>
          <div className="big-number">{d.numVentasHoy || 0}</div>
        </div>
        <div className="card">
          <div className="text-muted">Caja actual</div>
          <div className="big-number" style={{ fontSize: 22 }}>
            {d.cajaAbierta ? (
              <>
                Abierta
                <div className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
                  {d.cajaAbierta.usuario?.nombre}
                </div>
              </>
            ) : (
              <span className="text-muted">Sin abrir</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb">Alertas de stock bajo</h2>
        {(!d.alertasStock || d.alertasStock.length === 0) ? (
          <Empty text="Todo el inventario está por encima del mínimo." />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Stock actual</th>
                  <th className="text-right">Stock mínimo</th>
                </tr>
              </thead>
              <tbody>
                {d.alertasStock.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td className="text-right text-danger">
                      <strong>{p.stock}</strong>
                    </td>
                    <td className="text-right">{p.stockMinimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
