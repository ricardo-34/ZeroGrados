import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { money, fecha } from '../utils/format.js';
import { Alert, Field, Badge } from '../components/UI.jsx';

export default function Mesero() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesa, setMesa] = useState('');
  const [misPedidos, setMisPedidos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = async () => {
    try {
      const [p, mp] = await Promise.all([
        api.get('/productos?activo=true'),
        api.get('/pedidos/mis-pedidos'),
      ]);
      setProductos(p.data.items);
      setMisPedidos(mp.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Cuando un pedido cambia de estado, actualizar la lista
  useSocketEvent('pedido:actualizado', (pedido) => {
    setMisPedidos((prev) => prev.map((p) => (p._id === pedido._id ? pedido : p)));
  });
  useSocketEvent('pedido:listo', (pedido) => {
    setOk(`¡Pedido #${pedido.numero} está LISTO para entregar!`);
  });

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregar = (prod) => {
    setCarrito((prev) => {
      const e = prev.find((i) => i.producto === prod._id);
      if (e) return prev.map((i) => (i.producto === prod._id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { producto: prod._id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, observaciones: '' }];
    });
  };

  const setObs = (id, obs) =>
    setCarrito((prev) => prev.map((i) => (i.producto === id ? { ...i, observaciones: obs } : i)));

  const setCant = (id, delta) =>
    setCarrito((prev) =>
      prev.map((i) => (i.producto === id ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0)
    );

  const enviar = async () => {
    setError('');
    setOk('');
    if (carrito.length === 0) return setError('Agrega productos al pedido');
    try {
      const res = await api.post('/pedidos', {
        mesa,
        detalle: carrito.map((i) => ({
          producto: i.producto,
          cantidad: i.cantidad,
          observaciones: i.observaciones,
        })),
      });
      setOk(`Pedido #${res.data.item.numero} enviado a cocina`);
      setCarrito([]);
      setMesa('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="mb">Tomar Pedido</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <input
            className="input mb"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {filtrados.map((p) => (
              <button
                key={p._id}
                onClick={() => agregar(p)}
                style={{
                  border: '1px solid var(--gris-borde)',
                  borderRadius: 10,
                  padding: 12,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 44,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                <div style={{ color: 'var(--verde-esmeralda)', fontWeight: 700 }}>{money(p.precioVenta)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb">Pedido actual</h2>
          <Field label="Mesa / Referencia">
            <input className="input" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej: Mesa 4" />
          </Field>

          {carrito.length === 0 ? (
            <div className="text-muted mb">Sin productos...</div>
          ) : (
            carrito.map((i) => (
              <div key={i.producto} style={{ padding: '8px 0', borderBottom: '1px solid var(--gris-borde)' }}>
                <div className="flex-between">
                  <strong style={{ fontSize: 14 }}>{i.nombre}</strong>
                  <div className="flex items-center gap-sm">
                    <button className="btn btn-outline btn-sm" onClick={() => setCant(i.producto, -1)}>−</button>
                    <span>{i.cantidad}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => setCant(i.producto, 1)}>+</button>
                  </div>
                </div>
                <input
                  className="input"
                  style={{ marginTop: 6, minHeight: 36 }}
                  placeholder="Observaciones (ej: sin azúcar)"
                  value={i.observaciones}
                  onChange={(e) => setObs(i.producto, e.target.value)}
                />
              </div>
            ))
          )}

          <button className="btn btn-primary btn-block mt" onClick={enviar} disabled={carrito.length === 0}>
            Enviar pedido a cocina
          </button>
        </div>
      </div>

      <div className="card mt">
        <h2 className="mb">Mis pedidos recientes</h2>
        {misPedidos.length === 0 ? (
          <div className="text-muted">Aún no has enviado pedidos.</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mesa</th>
                  <th>Productos</th>
                  <th>Enviado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misPedidos.map((p) => (
                  <tr key={p._id}>
                    <td>#{p.numero}</td>
                    <td>{p.mesa || '—'}</td>
                    <td>{p.detalle.map((d) => `${d.cantidad}× ${d.nombre}`).join(', ')}</td>
                    <td>{fecha(p.createdAt)}</td>
                    <td><Badge estado={p.estado} /></td>
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
