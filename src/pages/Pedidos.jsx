import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { money, fecha, haceMinutos } from '../utils/format.js';
import { Alert, Badge, Empty } from '../components/UI.jsx';
import { TicketPedidoModal } from '../components/TicketTermico.jsx';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | activos | facturados
  const [pedidoImprimir, setPedidoImprimir] = useState(null);
  const navigate = useNavigate();

  // Trae TODOS los pedidos (historial completo). No se filtran en el backend.
  const cargar = async () => {
    try {
      const res = await api.get('/pedidos');
      setPedidos(res.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // En este historial los pedidos NUNCA se quitan: al llegar un cambio,
  // se actualiza el que ya existe o se agrega si es nuevo, pero no se elimina.
  const upsert = (p) => {
    setPedidos((prev) =>
      prev.some((x) => x._id === p._id)
        ? prev.map((x) => (x._id === p._id ? p : x))
        : [p, ...prev]
    );
  };
  useSocketEvent('pedido:nuevo', upsert);
  useSocketEvent('pedido:actualizado', upsert);
  useSocketEvent('pedido:listo', (p) => {
    upsert(p);
    setAviso(`🔔 Pedido #${p.numero} (${p.mesa || 'sin mesa'}) está LISTO`);
    reproducirAlerta();
  });

  const totalPedido = (p) => p.detalle.reduce((s, d) => s + (d.precioUnitario || 0) * d.cantidad, 0);

  const activos = (p) => ['pendiente', 'preparando', 'listo'].includes(p.estado);
  const visibles = pedidos.filter((p) => {
    if (filtro === 'activos') return activos(p);
    if (filtro === 'facturados') return p.facturado;
    return true; // todos
  });

  return (
    <div>
      <div className="flex-between mb">
        <h1>Pedidos</h1>
        <div className="flex items-center gap-sm">
          <select className="select" style={{ maxWidth: 170 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="facturados">Facturados</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/pos')}>
            Ir al POS
          </button>
        </div>
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{aviso}</Alert>

      {visibles.length === 0 ? (
        <Empty text="No hay pedidos para mostrar." />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {visibles.map((p) => (
            <div key={p._id} className="card">
              <div className="flex-between mb">
                <strong style={{ fontSize: 18 }}>#{p.numero}</strong>
                <div className="flex items-center gap-sm">
                  {p.facturado && <span className="text-muted" style={{ fontSize: 12 }}>✔ Cobrado</span>}
                  <Badge estado={p.estado} />
                </div>
              </div>
              <div className="text-muted mb" style={{ fontSize: 13 }}>
                {p.mesa || 'Sin mesa'} · {p.mesero?.nombre} · {fecha(p.createdAt)}
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

              <button
                className="btn btn-outline btn-block mt"
                onClick={() => setPedidoImprimir(p)}
              >
                Imprimir pedido
              </button>
            </div>
          ))}
        </div>
      )}

      {pedidoImprimir && (
        <TicketPedidoModal pedido={pedidoImprimir} onClose={() => setPedidoImprimir(null)} />
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
