import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { haceMinutos } from '../utils/format.js';
import { Alert } from '../components/UI.jsx';

const SIGUIENTE = {
  pendiente: { estado: 'preparando', label: 'Empezar a preparar' },
  preparando: { estado: 'listo', label: 'Marcar como listo' },
  listo: { estado: 'entregado', label: 'Marcar entregado' },
};

export default function Cocina() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [, forzar] = useState(0);

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
    // Re-render cada 30s para actualizar los cronómetros de demora
    const t = setInterval(() => forzar((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Nuevos pedidos entran en tiempo real + alerta sonora
  useSocketEvent('pedido:nuevo', (pedido) => {
    setPedidos((prev) => [pedido, ...prev]);
    reproducirAlerta();
  });
  useSocketEvent('pedido:actualizado', (pedido) => {
    setPedidos((prev) => {
      const activo = ['pendiente', 'preparando', 'listo'].includes(pedido.estado);
      const existe = prev.some((p) => p._id === pedido._id);
      if (!activo) return prev.filter((p) => p._id !== pedido._id);
      if (existe) return prev.map((p) => (p._id === pedido._id ? pedido : p));
      return [pedido, ...prev];
    });
  });

  const cambiar = async (id, estado) => {
    try {
      await api.patch(`/pedidos/${id}/estado`, { estado });
      if (estado === 'entregado') {
        setPedidos((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const colorEstado = { pendiente: 'var(--ambar)', preparando: 'var(--azul)', listo: 'var(--verde-esmeralda)' };

  return (
    <div>
      <div className="flex-between mb">
        <h1>Cocina — Pedidos activos</h1>
        <span className="text-muted">{pedidos.length} en curso</span>
      </div>
      <Alert type="error">{error}</Alert>

      {pedidos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40 }}>🍦</div>
          <div className="text-muted">No hay pedidos pendientes.</div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {pedidos.map((p) => {
            const mins = haceMinutos(p.createdAt);
            const demorado = mins >= 10 && p.estado !== 'listo';
            const sig = SIGUIENTE[p.estado];
            return (
              <div
                key={p._id}
                className="card"
                style={{
                  borderTop: `5px solid ${colorEstado[p.estado]}`,
                  boxShadow: demorado ? '0 0 0 2px var(--rojo)' : undefined,
                }}
              >
                <div className="flex-between mb">
                  <strong style={{ fontSize: 20 }}>#{p.numero}</strong>
                  <span
                    style={{
                      color: demorado ? 'var(--rojo)' : 'var(--gris-texto)',
                      fontWeight: demorado ? 700 : 400,
                      fontSize: 14,
                    }}
                  >
                    {mins} min {demorado ? '⚠' : ''}
                  </span>
                </div>
                <div className="text-muted mb" style={{ fontSize: 14 }}>
                  {p.mesa ? `Mesa: ${p.mesa}` : 'Sin mesa'} · {p.mesero?.nombre}
                </div>
                <div style={{ marginBottom: 12 }}>
                  {p.detalle.map((d, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>
                        {d.cantidad}× {d.nombre}
                      </div>
                      {d.observaciones && (
                        <div style={{ fontSize: 13, color: 'var(--verde-bosque)', fontStyle: 'italic' }}>
                          ▸ {d.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {sig && (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => cambiar(p._id, sig.estado)}
                    style={p.estado === 'listo' ? { background: 'var(--verde-bosque)' } : undefined}
                  >
                    {sig.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Beep con Web Audio API (sin archivos externos)
function reproducirAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {
    // navegador sin soporte o sin interacción previa
  }
}
