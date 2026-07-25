import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { money, fecha } from '../utils/format.js';
import { Alert, Field, Badge } from '../components/UI.jsx';
import ProductoDetalleModal from '../components/ProductoDetalleModal.jsx';
import ResumenPedidoModal from '../components/ResumenPedidoModal.jsx';
import MesaSelector from '../components/MesaSelector.jsx';

export default function Mesero() {
  const [productos, setProductos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [pedidoExistente, setPedidoExistente] = useState(null); // pedido abierto de la mesa (si aplica)
  const [carrito, setCarrito] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [detalleProducto, setDetalleProducto] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    try {
      const [p, mp, m] = await Promise.all([
        api.get('/productos?activo=true'),
        api.get('/pedidos/mis-pedidos'),
        api.get('/mesas'),
      ]);
      setProductos(p.data.items);
      setMisPedidos(mp.data.items);
      setMesas(m.data.items);
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
    reproducirAlertaListo();
  });

  // Sincronización en tiempo real del estado de las mesas: si otro mesero
  // toma una mesa mientras la estás viendo, se refleja al instante y, si
  // era justo la que tenías seleccionada para un pedido nuevo, se avisa.
  useSocketEvent('mesa:actualizada', (mesa) => {
    setMesas((prev) => {
      const existe = prev.some((m) => m._id === mesa._id);
      return existe ? prev.map((m) => (m._id === mesa._id ? mesa : m)) : [...prev, mesa];
    });
    if (
      mesaSeleccionada &&
      mesa._id === mesaSeleccionada._id &&
      !pedidoExistente &&
      mesa.estado !== 'disponible'
    ) {
      setError(`La mesa ${mesa.numero} acaba de ser tomada por otro mesero. Elige otra mesa.`);
      volverAMesas();
    }
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

  // --- Selección de mesa ---

  const seleccionarMesa = async (mesa) => {
    setError('');
    setOk('');
    setCarrito([]);
    setMesaSeleccionada(mesa);
    if (mesa.estado === 'ocupada' && mesa.pedidoActivo) {
      try {
        const res = await api.get(`/mesas/${mesa._id}/pedido`);
        setPedidoExistente(res.data.item);
      } catch (err) {
        setError(err.message);
        setPedidoExistente(null);
      }
    } else {
      setPedidoExistente(null);
    }
  };

  const volverAMesas = () => {
    setMesaSeleccionada(null);
    setPedidoExistente(null);
    setCarrito([]);
    setBusqueda('');
  };

  // --- Envío del pedido (nuevo o adición a cuenta existente) ---

  const abrirResumen = () => {
    setError('');
    setOk('');
    if (carrito.length === 0) return setError('Agrega productos al pedido');
    setMostrarResumen(true);
  };

  const confirmarEnvio = async () => {
    setError('');
    setOk('');
    setEnviando(true);
    try {
      const detalle = carrito.map((i) => ({
        producto: i.producto,
        cantidad: i.cantidad,
        observaciones: i.observaciones,
      }));

      if (pedidoExistente) {
        const res = await api.patch(`/pedidos/${pedidoExistente._id}/agregar`, { detalle });
        setOk(`Productos agregados a la mesa ${mesaSeleccionada.numero} (pedido #${res.data.item.numero})`);
      } else {
        const res = await api.post('/pedidos', { mesaId: mesaSeleccionada._id, detalle });
        setOk(`Pedido #${res.data.item.numero} enviado a cocina — Mesa ${mesaSeleccionada.numero}`);
      }

      setMostrarResumen(false);
      volverAMesas();
      cargar();
    } catch (err) {
      setError(err.message);
      // Si la mesa dejó de estar disponible (409) u ocurrió otro conflicto,
      // refrescamos y regresamos a la selección de mesa.
      if (!pedidoExistente) {
        volverAMesas();
        cargar();
      }
    } finally {
      setEnviando(false);
    }
  };

  const mesaLabel = mesaSeleccionada
    ? `${mesaSeleccionada.numero}${mesaSeleccionada.nombre ? ' — ' + mesaSeleccionada.nombre : ''}`
    : '';

  return (
    <div>
      <h1 className="mb">Tomar Pedido</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      {!mesaSeleccionada ? (
        <div className="card">
          <h2 className="mb">Selecciona una mesa</h2>
          <MesaSelector mesas={mesas} onSeleccionar={seleccionarMesa} />
        </div>
      ) : (
        <>
          <div className="card mb">
            <div className="flex-between flex-wrap gap-sm">
              <div>
                <strong style={{ fontSize: 18 }}>Mesa {mesaSeleccionada.numero}</strong>
                {mesaSeleccionada.nombre && <span className="text-muted"> — {mesaSeleccionada.nombre}</span>}
                {pedidoExistente && (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Cuenta abierta — pedido #{pedidoExistente.numero} · <Badge estado={pedidoExistente.estado} />
                  </div>
                )}
              </div>
              <button className="btn btn-outline btn-sm" onClick={volverAMesas}>Cambiar de mesa</button>
            </div>

            {pedidoExistente && (
              <div className="mt" style={{ paddingTop: 10, borderTop: '1px solid var(--gris-borde)' }}>
                <div className="text-muted mb" style={{ fontSize: 13 }}>Ya está en la cuenta:</div>
                {pedidoExistente.detalle.map((d, i) => (
                  <div key={i} className="flex-between" style={{ fontSize: 14, marginBottom: 4 }}>
                    <span>{d.cantidad}× {d.nombre}</span>
                    <span className="text-muted">{money((d.precioUnitario || 0) * d.cantidad)}</span>
                  </div>
                ))}
                <div className="flex-between mt" style={{ paddingTop: 8, borderTop: '1px solid var(--gris-borde)' }}>
                  <span className="text-muted">Total en cuenta</span>
                  <strong>{money(pedidoExistente.detalle.reduce((s, d) => s + (d.precioUnitario || 0) * d.cantidad, 0))}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="mesero-grid">
            <div className="card">
              <input
                className="input mb"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <div className="mesero-productos-grid">
                {filtrados.map((p) => (
                  <div key={p._id} className="mesero-producto-card">
                    <button className="mesero-producto-main" onClick={() => agregar(p)}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                      <div style={{ color: 'var(--verde-esmeralda)', fontWeight: 700 }}>{money(p.precioVenta)}</div>
                    </button>
                    <button
                      className="btn btn-outline btn-sm mesero-producto-detalle-btn"
                      onClick={() => setDetalleProducto(p)}
                    >
                      Ver detalles
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="mb">{pedidoExistente ? 'Agregar a la cuenta' : 'Pedido nuevo'}</h2>

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

              {carrito.length > 0 && (
                <div className="flex-between mt" style={{ paddingTop: 10, borderTop: '1px solid var(--gris-borde)' }}>
                  <span className="text-muted">Total a agregar</span>
                  <strong style={{ fontSize: 18, color: 'var(--verde-esmeralda)' }}>
                    {money(carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0))}
                  </strong>
                </div>
              )}

              <button className="btn btn-primary btn-block mt" onClick={abrirResumen} disabled={carrito.length === 0}>
                {pedidoExistente ? 'Revisar y agregar a cocina' : 'Revisar y enviar pedido'}
              </button>
            </div>
          </div>
        </>
      )}

      {detalleProducto && (
        <ProductoDetalleModal
          producto={detalleProducto}
          onClose={() => setDetalleProducto(null)}
          onAgregar={agregar}
        />
      )}

      {mostrarResumen && (
        <ResumenPedidoModal
          mesaLabel={mesaLabel}
          carrito={carrito}
          enviando={enviando}
          modoAgregar={!!pedidoExistente}
          onClose={() => setMostrarResumen(false)}
          onConfirmar={confirmarEnvio}
        />
      )}

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

// Sonido de notificación cuando un pedido está listo para entregar
// (misma técnica que usa Cocina.jsx, sin archivos de audio externos)
function reproducirAlertaListo() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tocar = (freq, inicio, duracion) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + inicio);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + duracion);
    };
    tocar(700, 0, 0.15);
    tocar(1000, 0.18, 0.2);
  } catch (_) {
    // navegador sin soporte o sin interacción previa del usuario
  }
}
