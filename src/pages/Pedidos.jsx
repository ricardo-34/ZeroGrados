import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { money, fecha, haceMinutos } from '../utils/format.js';
import { Alert, Badge, Empty } from '../components/UI.jsx';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const res = await api.get('/pedidos?activos=true');
      setPedidos(res.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useSocketEvent('pedido:nuevo', (p) => setPedidos((prev) => [p, ...prev]));
  useSocketEvent('pedido:actualizado', (p) => {
    setPedidos((prev) => {
      const activo = ['pendiente', 'preparando', 'listo'].includes(p.estado);
      if (!activo) return prev.filter((x) => x._id !== p._id);
      return prev.some((x) => x._id === p._id)
        ? prev.map((x) => (x._id === p._id ? p : x))
        : [p, ...prev];
    });
  });
  useSocketEvent('pedido:listo', (p) => {
    setAviso(`🔔 Pedido #${p.numero} (${p.mesa || 'sin mesa'}) está LISTO`);
    reproducirAlerta();
  });

  // Cobra el pedido: lleva su detalle al POS pre-cargado sería ideal;
  // aquí facturamos directamente creando la venta desde el pedido.
  const facturar = async (pedido) => {
    setError('');
    try {
      await api.post('/ventas', {
        detalle: pedido.detalle.map((d) => ({ producto: d.producto, cantidad: d.cantidad })),
        metodoPago: 'efectivo',
        pedidoId: pedido._id,
      });
      setAviso(`Pedido #${pedido.numero} facturado`);
      cargar();
    } catch (err) {
      setError(err.message + ' — puedes cobrarlo manualmente en el POS.');
    }
  };

  const totalPedido = (p) => p.detalle.reduce((s, d) => s + (d.precioUnitario || 0) * d.cantidad, 0);

  return (
    <div>
      <div className="flex-between mb">
        <h1>Pedidos</h1>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/pos')}>
          Ir al POS
        </button>
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{aviso}</Alert>

      {pedidos.length === 0 ? (
        <Empty text="No hay pedidos activos." />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {pedidos.map((p) => (
            <div key={p._id} className="card">
              <div className="flex-between mb">
                <strong style={{ fontSize: 18 }}>#{p.numero}</strong>
                <Badge estado={p.estado} />
              </div>
              <div className="text-muted mb" style={{ fontSize: 13 }}>
                {p.mesa || 'Sin mesa'} · {p.mesero?.nombre} · {haceMinutos(p.createdAt)} min
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
              {p.estado === 'listo' && (
                <button className="btn btn-primary btn-block mt" onClick={() => facturar(p)}>
                  Cobrar y facturar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function reproducirAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}
