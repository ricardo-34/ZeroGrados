import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money, fecha, haceMinutos } from '../utils/format.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { Alert, Field, Badge, Empty } from '../components/UI.jsx';

export default function Caja() {
  const [caja, setCaja] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [montoApertura, setMontoApertura] = useState('');
  const [montoContado, setMontoContado] = useState('');
  const [mov, setMov] = useState({ tipo: 'ingreso', monto: '', concepto: '' });
  const [cobrandoId, setCobrandoId] = useState(null);
  const [metodoPorPedido, setMetodoPorPedido] = useState({});

  const cargar = async () => {
    try {
      const [c, h, p] = await Promise.all([
        api.get('/caja/actual'),
        api.get('/caja/historial'),
        api.get('/pedidos?activos=true'),
      ]);
      setCaja(c.data.item);
      setHistorial(h.data.items);
      setPedidos(p.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Tiempo real: los pedidos que crean los meseros llegan a la sala de caja.
  useSocketEvent('pedido:nuevo', (p) => {
    setPedidos((prev) => (prev.some((x) => x._id === p._id) ? prev : [p, ...prev]));
  });
  useSocketEvent('pedido:actualizado', (p) => {
    setPedidos((prev) => {
      const activo = ['pendiente', 'preparando', 'listo'].includes(p.estado);
      // Si el pedido dejó de estar activo (facturado/entregado/cancelado), sale de la lista.
      if (!activo || p.facturado) return prev.filter((x) => x._id !== p._id);
      return prev.some((x) => x._id === p._id)
        ? prev.map((x) => (x._id === p._id ? p : x))
        : [p, ...prev];
    });
  });

  const abrir = async () => {
    setError('');
    try {
      await api.post('/caja/abrir', { montoApertura: Number(montoApertura || 0) });
      setOk('Caja abierta');
      setMontoApertura('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const registrarMov = async () => {
    setError('');
    try {
      await api.post('/caja/movimiento', {
        tipo: mov.tipo,
        monto: Number(mov.monto),
        concepto: mov.concepto,
      });
      setOk('Movimiento registrado');
      setMov({ tipo: 'ingreso', monto: '', concepto: '' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const cerrar = async () => {
    setError('');
    if (!window.confirm('¿Cerrar la caja? No podrás vender hasta abrir una nueva.')) return;
    try {
      const res = await api.post('/caja/cerrar', { montoContado: Number(montoContado || 0) });
      setOk(`Caja cerrada. Diferencia: ${money(res.data.item.diferencia)}`);
      setMontoContado('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cobra el pedido creando la venta desde el pedido. El backend marca el
  // pedido como pagado/facturado, lo guarda en el historial de ventas y
  // libera automáticamente la mesa asociada.
  const cobrarPedido = async (pedido) => {
    setError('');
    setOk('');
    const metodoPago = metodoPorPedido[pedido._id] || 'efectivo';
    setCobrandoId(pedido._id);
    try {
      const res = await api.post('/ventas', {
        detalle: pedido.detalle.map((d) => ({ producto: d.producto, cantidad: d.cantidad })),
        metodoPago,
        pedidoId: pedido._id,
      });
      setOk(`Pedido #${pedido.numero} cobrado · Venta #${res.data.item.numero} registrada`);
      // Quitar de la lista de inmediato (además del evento de socket).
      setPedidos((prev) => prev.filter((x) => x._id !== pedido._id));
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCobrandoId(null);
    }
  };

  const totalPedido = (p) =>
    p.detalle.reduce((s, d) => s + (d.precioUnitario || 0) * d.cantidad, 0);

  const ingresos = caja?.movimientos?.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) || 0;
  const egresos = caja?.movimientos?.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) || 0;
  const esperado = caja ? caja.montoApertura + caja.totalVentasEfectivo + ingresos - egresos : 0;

  return (
    <div>
      <h1 className="mb">Caja</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      {!caja ? (
        <div className="card" style={{ maxWidth: 420 }}>
          <h2 className="mb">Abrir caja</h2>
          <Field label="Monto de apertura (base)">
            <input
              className="input"
              type="number"
              min="0"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
            />
          </Field>
          <button className="btn btn-primary btn-block" onClick={abrir}>
            Abrir caja
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h2 className="mb">Caja abierta</h2>
            <div className="flex-between mb"><span className="text-muted">Apertura</span><span>{money(caja.montoApertura)}</span></div>
            <div className="flex-between mb"><span className="text-muted">Ventas en efectivo</span><span>{money(caja.totalVentasEfectivo)}</span></div>
            <div className="flex-between mb"><span className="text-muted">Ingresos extra</span><span>{money(ingresos)}</span></div>
            <div className="flex-between mb"><span className="text-muted">Egresos</span><span>−{money(egresos)}</span></div>
            <div className="flex-between" style={{ borderTop: '2px solid var(--gris-borde)', paddingTop: 8 }}>
              <strong>Efectivo esperado</strong>
              <strong style={{ color: 'var(--verde-esmeralda)', fontSize: 18 }}>{money(esperado)}</strong>
            </div>

            <div style={{ marginTop: 16, borderTop: '1px solid var(--gris-borde)', paddingTop: 12 }}>
              <h3 className="mb">Cerrar caja (arqueo)</h3>
              <Field label="Efectivo contado">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={montoContado}
                  onChange={(e) => setMontoContado(e.target.value)}
                />
              </Field>
              <button className="btn btn-danger btn-block" onClick={cerrar}>
                Cerrar caja
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="mb">Registrar movimiento</h3>
            <Field label="Tipo">
              <select className="select" value={mov.tipo} onChange={(e) => setMov({ ...mov, tipo: e.target.value })}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso / Gasto</option>
              </select>
            </Field>
            <Field label="Monto">
              <input className="input" type="number" min="0" value={mov.monto} onChange={(e) => setMov({ ...mov, monto: e.target.value })} />
            </Field>
            <Field label="Concepto">
              <input className="input" value={mov.concepto} onChange={(e) => setMov({ ...mov, concepto: e.target.value })} />
            </Field>
            <button className="btn btn-secondary btn-block" onClick={registrarMov} disabled={!mov.monto}>
              Registrar
            </button>

            <h3 style={{ marginTop: 16 }} className="mb">Movimientos</h3>
            {caja.movimientos?.length ? (
              <div className="table-wrap">
                <table className="tbl">
                  <tbody>
                    {caja.movimientos.map((m, i) => (
                      <tr key={i}>
                        <td>{m.concepto || '—'}</td>
                        <td className={m.tipo === 'egreso' ? 'text-danger text-right' : 'text-success text-right'}>
                          {m.tipo === 'egreso' ? '−' : '+'}{money(m.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="Sin movimientos" />
            )}
          </div>
        </div>
      )}

      {/* Pedidos de la caja: los que generan los meseros llegan aquí para cobrarse */}
      {caja && (
        <div className="card mt">
          <div className="flex-between mb">
            <h2>Pedidos por cobrar</h2>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>

          {pedidos.length === 0 ? (
            <Empty text="No hay pedidos pendientes de cobro." />
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {pedidos.map((p) => (
                <div key={p._id} className="card" style={{ background: '#fff' }}>
                  <div className="flex-between mb">
                    <strong style={{ fontSize: 18 }}>#{p.numero}</strong>
                    <Badge estado={p.estado} />
                  </div>
                  <div className="text-muted mb" style={{ fontSize: 13 }}>
                    {p.mesa || 'Sin mesa'} · {p.mesero?.nombre || '—'} · {haceMinutos(p.createdAt)} min
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {p.detalle.map((d, i) => (
                      <div key={i} className="flex-between" style={{ fontSize: 14 }}>
                        <span>{d.cantidad}× {d.nombre}</span>
                        <span>{money((d.precioUnitario || 0) * d.cantidad)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--gris-borde)', paddingTop: 8 }}>
                    <strong>Total</strong>
                    <strong style={{ color: 'var(--verde-esmeralda)' }}>{money(totalPedido(p))}</strong>
                  </div>

                  <Field label="Método de pago">
                    <select
                      className="select"
                      value={metodoPorPedido[p._id] || 'efectivo'}
                      onChange={(e) =>
                        setMetodoPorPedido((prev) => ({ ...prev, [p._id]: e.target.value }))
                      }
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </Field>

                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => cobrarPedido(p)}
                    disabled={cobrandoId === p._id}
                  >
                    {cobrandoId === p._id ? 'Cobrando...' : 'Registrar pago'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card mt">
        <h2 className="mb">Historial de cajas</h2>
        {historial.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cajero</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th className="text-right">Esperado</th>
                  <th className="text-right">Contado</th>
                  <th className="text-right">Diferencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((c) => (
                  <tr key={c._id}>
                    <td>{c.usuario?.nombre}</td>
                    <td>{fecha(c.fechaApertura)}</td>
                    <td>{c.fechaCierre ? fecha(c.fechaCierre) : '—'}</td>
                    <td className="text-right">{c.montoEsperado != null ? money(c.montoEsperado) : '—'}</td>
                    <td className="text-right">{c.montoContado != null ? money(c.montoContado) : '—'}</td>
                    <td className={`text-right ${c.diferencia < 0 ? 'text-danger' : ''}`}>
                      {c.diferencia != null ? money(c.diferencia) : '—'}
                    </td>
                    <td><Badge estado={c.estado} /></td>
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