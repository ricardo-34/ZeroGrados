import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { fecha } from '../utils/format.js';
import { Alert, Field, Empty } from '../components/UI.jsx';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [ajuste, setAjuste] = useState({ productoId: '', tipo: 'entrada', cantidad: '', motivo: '' });

  const cargar = async () => {
    try {
      const [p, m] = await Promise.all([
        api.get('/productos?activo=true'),
        api.get('/productos/inventario/movimientos'),
      ]);
      setProductos(p.data.items);
      setMovimientos(m.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const registrar = async () => {
    setError('');
    setOk('');
    if (!ajuste.productoId || ajuste.cantidad === '') return setError('Selecciona producto y cantidad');
    try {
      await api.post('/productos/inventario/ajuste', {
        productoId: ajuste.productoId,
        tipo: ajuste.tipo,
        cantidad: Number(ajuste.cantidad),
        motivo: ajuste.motivo,
      });
      setOk('Movimiento registrado');
      setAjuste({ productoId: '', tipo: 'entrada', cantidad: '', motivo: '' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="mb">Inventario</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <div className="card">
          <h3 className="mb">Ajuste de inventario</h3>
          <Field label="Producto">
            <select className="select" value={ajuste.productoId} onChange={(e) => setAjuste({ ...ajuste, productoId: e.target.value })}>
              <option value="">— Selecciona —</option>
              {productos.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre} (stock: {p.stock})</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="select" value={ajuste.tipo} onChange={(e) => setAjuste({ ...ajuste, tipo: e.target.value })}>
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (−)</option>
              <option value="ajuste">Ajuste (usar +/−)</option>
            </select>
          </Field>
          <Field label="Cantidad">
            <input className="input" type="number" value={ajuste.cantidad} onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })} />
          </Field>
          <Field label="Motivo">
            <input className="input" value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} placeholder="Ej: merma, conteo físico" />
          </Field>
          <button className="btn btn-primary btn-block" onClick={registrar}>Registrar movimiento</button>
        </div>

        <div className="card">
          <h3 className="mb">Stock actual</h3>
          <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>Producto</th><th className="text-right">Stock</th><th className="text-right">Mínimo</th></tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td className={`text-right ${p.stock <= p.stockMinimo ? 'text-danger' : ''}`}>
                      <strong>{p.stock}</strong>
                    </td>
                    <td className="text-right text-muted">{p.stockMinimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt">
        <h3 className="mb">Historial de movimientos</h3>
        {movimientos.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Stock resultante</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m._id}>
                    <td>{fecha(m.createdAt)}</td>
                    <td>{m.producto?.nombre || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{m.tipo}</td>
                    <td className={`text-right ${m.cantidad < 0 ? 'text-danger' : 'text-success'}`}>
                      {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                    </td>
                    <td className="text-right">{m.stockResultante}</td>
                    <td className="text-muted">{m.motivo || '—'}</td>
                    <td className="text-muted">{m.usuario?.nombre || '—'}</td>
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
