import { useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';
import { money } from '../utils/format.js';
import { Alert } from '../components/UI.jsx';
import { useSocketEvent } from '../hooks/useSocket.js';

function fecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ESTADO_LABEL = {
  activa: 'En juego',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

export default function JuegosRegistro() {
  const [items, setItems] = useState([]);
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const url = estado ? `/juegos?estado=${estado}` : '/juegos';
      const res = await api.get(url);
      setItems(res.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refrescar en vivo cuando algo cambie
  useSocketEvent('juego:creada', cargar);
  useSocketEvent('juego:actualizada', cargar);
  useSocketEvent('juego:finalizada', cargar);

  const totalCobrado = items
    .filter((s) => s.estado === 'finalizada')
    .reduce((sum, s) => sum + (s.valorTotal || 0), 0);

  return (
    <div>
      <div className="flex-between mb">
        <h1>Registro de juegos</h1>
        <select className="select" style={{ maxWidth: 200 }} value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="activa">En juego</option>
          <option value="finalizada">Finalizadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card mb">
        <div className="flex-between">
          <span className="text-muted">Total cobrado (finalizadas mostradas)</span>
          <strong style={{ fontSize: 20, color: 'var(--verde-esmeralda)' }}>{money(totalCobrado)}</strong>
        </div>
      </div>

      <div className="card">
        {cargando ? (
          <div className="text-muted">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-muted">No hay registros.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Niño</th>
                <th>WhatsApp</th>
                <th className="text-right">Min</th>
                <th className="text-right">Valor</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td>{s.numero}</td>
                  <td>{s.nombreNino}</td>
                  <td>{s.whatsappPadre}</td>
                  <td className="text-right">{s.minutosTotales}</td>
                  <td className="text-right">{money(s.valorTotal)}</td>
                  <td>{ESTADO_LABEL[s.estado] || s.estado}</td>
                  <td>{fecha(s.inicio)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setDetalle(s)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalle && <DetalleModal sesion={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
}

function DetalleModal({ sesion, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
      }}
    >
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex-between mb">
          <h2>Juego #{sesion.numero}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="mb">
          <div><strong>Niño:</strong> {sesion.nombreNino}</div>
          <div><strong>WhatsApp:</strong> {sesion.whatsappPadre}</div>
          <div><strong>Estado:</strong> {ESTADO_LABEL[sesion.estado] || sesion.estado}</div>
          <div><strong>Inicio:</strong> {fecha(sesion.inicio)}</div>
          {sesion.finalizadaEn && <div><strong>Fin:</strong> {fecha(sesion.finalizadaEn)}</div>}
          <div><strong>Cajero:</strong> {sesion.usuario?.nombre || '—'}</div>
          <div><strong>Método de pago:</strong> {sesion.metodoPago}</div>
        </div>

        <div className="card mb" style={{ background: '#f9fafb' }}>
          <div className="flex-between"><span className="text-muted">Tarifa inicial</span><span>{sesion.minutosIniciales} min · {money(sesion.valorInicial)}</span></div>
          <div className="flex-between"><span className="text-muted">Minutos totales</span><span>{sesion.minutosTotales} min</span></div>
          <div className="flex-between"><strong>Valor total</strong><strong>{money(sesion.valorTotal)}</strong></div>
        </div>

        {sesion.ampliaciones?.length > 0 && (
          <>
            <h4 className="mb">Ampliaciones</h4>
            <table className="tbl mb">
              <thead><tr><th>Fecha</th><th className="text-right">Min</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {sesion.ampliaciones.map((a, i) => (
                  <tr key={i}>
                    <td>{fecha(a.fecha)}</td>
                    <td className="text-right">+{a.minutos}</td>
                    <td className="text-right">{money(a.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {sesion.notificaciones?.length > 0 && (
          <>
            <h4 className="mb">Notificaciones WhatsApp</h4>
            <ul style={{ fontSize: 13, paddingLeft: 18 }}>
              {sesion.notificaciones.map((n, i) => (
                <li key={i}>
                  {fecha(n.fecha)} — {n.tipo} — <em>{n.canal}</em>
                  {n.canal !== 'whatsapp-api' && n.detalle ? ` (${n.detalle})` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
