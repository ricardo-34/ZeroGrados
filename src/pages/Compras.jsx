import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money, fecha } from '../utils/format.js';
import { Alert, Modal, Field, Badge, Empty } from '../components/UI.jsx';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ proveedor: '', metodoPago: 'efectivo', detalle: [] });
  const [linea, setLinea] = useState({ producto: '', cantidad: 1, precioUnitario: 0 });

  const cargar = async () => {
    try {
      const [c, p, pr] = await Promise.all([
        api.get('/compras'),
        api.get('/proveedores'),
        api.get('/productos?activo=true'),
      ]);
      setCompras(c.data.items);
      setProveedores(p.data.items);
      setProductos(pr.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = () => {
    setForm({ proveedor: '', metodoPago: 'efectivo', detalle: [] });
    setModal(true);
  };

  const agregarLinea = () => {
    if (!linea.producto || linea.cantidad < 1) return;
    const prod = productos.find((p) => p._id === linea.producto);
    setForm((f) => ({
      ...f,
      detalle: [...f.detalle, { ...linea, nombre: prod?.nombre }],
    }));
    setLinea({ producto: '', cantidad: 1, precioUnitario: 0 });
  };

  const quitarLinea = (i) =>
    setForm((f) => ({ ...f, detalle: f.detalle.filter((_, idx) => idx !== i) }));

  const total = form.detalle.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);

  const guardar = async () => {
    setError('');
    setOk('');
    if (!form.proveedor || form.detalle.length === 0) return setError('Selecciona proveedor y agrega productos');
    try {
      await api.post('/compras', {
        proveedor: form.proveedor,
        metodoPago: form.metodoPago,
        detalle: form.detalle.map((d) => ({
          producto: d.producto,
          cantidad: Number(d.cantidad),
          precioUnitario: Number(d.precioUnitario),
        })),
      });
      setOk('Compra registrada e inventario actualizado');
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const anular = async (id) => {
    if (!window.confirm('¿Anular esta compra? Se revertirá el inventario.')) return;
    try {
      await api.post(`/compras/${id}/anular`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb">
        <h1>Compras</h1>
        <button className="btn btn-primary" onClick={abrirModal}>+ Nueva compra</button>
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="card">
        {compras.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Productos</th>
                  <th>Pago</th>
                  <th className="text-right">Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c._id}>
                    <td>{fecha(c.createdAt)}</td>
                    <td>{c.proveedor?.nombre}</td>
                    <td className="text-muted">{c.detalle.length} ítem(s)</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.metodoPago}</td>
                    <td className="text-right">{money(c.total)}</td>
                    <td>
                      <span className={`badge ${c.estado === 'anulada' ? 'badge-anulada' : 'badge-completada'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      {c.estado === 'registrada' && (
                        <button className="btn btn-danger btn-sm" onClick={() => anular(c._id)}>Anular</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Nueva compra"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Registrar compra</button>
            </>
          }
        >
          <div className="grid grid-2">
            <Field label="Proveedor">
              <select className="select" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })}>
                <option value="">— Selecciona —</option>
                {proveedores.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
              </select>
            </Field>
            <Field label="Método de pago">
              <select className="select" value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                <option value="efectivo">Efectivo</option>
                <option value="credito">Crédito</option>
              </select>
            </Field>
          </div>

          <div style={{ border: '1px solid var(--gris-borde)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <Field label="Producto">
                <select className="select" value={linea.producto} onChange={(e) => {
                  const prod = productos.find((p) => p._id === e.target.value);
                  setLinea({ ...linea, producto: e.target.value, precioUnitario: prod?.precioCompra || 0 });
                }}>
                  <option value="">—</option>
                  {productos.map((p) => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
              </Field>
              <Field label="Cant.">
                <input className="input" type="number" min="1" value={linea.cantidad} onChange={(e) => setLinea({ ...linea, cantidad: Number(e.target.value) })} />
              </Field>
              <Field label="P. Unit.">
                <input className="input" type="number" min="0" value={linea.precioUnitario} onChange={(e) => setLinea({ ...linea, precioUnitario: Number(e.target.value) })} />
              </Field>
              <button className="btn btn-secondary" onClick={agregarLinea} style={{ marginBottom: 14 }}>+</button>
            </div>

            {form.detalle.map((d, i) => (
              <div key={i} className="flex-between" style={{ padding: '6px 0', borderTop: '1px solid var(--gris-borde)' }}>
                <span>{d.cantidad}× {d.nombre}</span>
                <span className="flex items-center gap-sm">
                  {money(d.cantidad * d.precioUnitario)}
                  <button className="btn btn-danger btn-sm" onClick={() => quitarLinea(i)}>✕</button>
                </span>
              </div>
            ))}
          </div>

          <div className="flex-between">
            <strong>Total compra</strong>
            <strong style={{ color: 'var(--verde-esmeralda)', fontSize: 18 }}>{money(total)}</strong>
          </div>
        </Modal>
      )}
    </div>
  );
}
