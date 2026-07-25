import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { Alert, Modal, Field, Empty } from '../components/UI.jsx';

const VACIO = { numero: '', nombre: '', observaciones: '', estado: 'disponible' };

const ESTADOS = [
  { value: 'disponible', label: 'Disponible', color: 'var(--verde-esmeralda)' },
  { value: 'ocupada', label: 'Ocupada', color: 'var(--rojo)' },
  { value: 'reservada', label: 'Reservada', color: 'var(--ambar)' },
  { value: 'limpieza', label: 'En limpieza', color: 'var(--azul)' },
];
const colorDe = (estado) => ESTADOS.find((e) => e.value === estado)?.color || 'var(--gris-estado)';
const labelDe = (estado) => ESTADOS.find((e) => e.value === estado)?.label || estado;

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState(null);
  const [verInactivas, setVerInactivas] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get(`/mesas?activo=${verInactivas ? 'false' : 'true'}`);
      setMesas(res.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verInactivas]);

  // Sincronización en tiempo real: cualquier cambio de estado de cualquier
  // mesa (por un mesero, un pago en caja, u otro admin) se refleja al instante.
  useSocketEvent('mesa:actualizada', (mesa) => {
    setMesas((prev) => {
      const existe = prev.some((m) => m._id === mesa._id);
      if (!mesa.activo && !verInactivas) return prev.filter((m) => m._id !== mesa._id);
      if (!existe) return verInactivas === !mesa.activo ? [...prev, mesa].sort((a, b) => a.numero - b.numero) : prev;
      return prev.map((m) => (m._id === mesa._id ? mesa : m)).sort((a, b) => a.numero - b.numero);
    });
  });

  const guardar = async () => {
    setError('');
    try {
      const payload = { ...modal, numero: Number(modal.numero) };
      if (modal._id) await api.put(`/mesas/${modal._id}`, payload);
      else await api.post('/mesas', payload);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const desactivar = async (mesa) => {
    if (!window.confirm(`¿Desactivar la mesa ${mesa.numero}?`)) return;
    try {
      await api.delete(`/mesas/${mesa._id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const activar = async (mesa) => {
    try {
      await api.patch(`/mesas/${mesa._id}/activar`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarDefinitivo = async (mesa) => {
    if (!window.confirm(`Esto eliminará la mesa ${mesa.numero} de forma PERMANENTE. ¿Continuar?`)) return;
    try {
      await api.delete(`/mesas/${mesa._id}/definitivo`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const liberar = async (mesa) => {
    if (!window.confirm(`¿Liberar la mesa ${mesa.numero}? Se desvinculará su pedido activo sin facturarlo.`)) return;
    try {
      await api.post(`/mesas/${mesa._id}/liberar`);
      setOk(`Mesa ${mesa.numero} liberada`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarEstadoManual = async (mesa, estado) => {
    try {
      await api.put(`/mesas/${mesa._id}`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb flex-wrap gap-sm">
        <h1>Mesas</h1>
        <div className="flex gap-sm">
          <button className="btn btn-outline" onClick={() => setVerInactivas((v) => !v)}>
            {verInactivas ? 'Ver activas' : 'Ver inactivas'}
          </button>
          <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>+ Mesa</button>
        </div>
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-sm mb" style={{ fontSize: 13 }}>
        {ESTADOS.map((e) => (
          <span key={e.value} className="flex items-center gap-sm">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, display: 'inline-block' }} />
            {e.label}
          </span>
        ))}
      </div>

      {mesas.length === 0 ? (
        <Empty text={verInactivas ? 'No hay mesas inactivas.' : 'No hay mesas registradas todavía.'} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {mesas.map((m) => (
            <div key={m._id} className="card" style={{ borderTop: `5px solid ${colorDe(m.estado)}` }}>
              <div className="flex-between mb">
                <strong style={{ fontSize: 20 }}>Mesa {m.numero}</strong>
                <span className="badge" style={{ background: colorDe(m.estado) }}>{labelDe(m.estado)}</span>
              </div>
              {m.nombre && <div className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>{m.nombre}</div>}
              {m.observaciones && (
                <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--gris-texto)', marginBottom: 8 }}>
                  ▸ {m.observaciones}
                </div>
              )}
              {m.pedidoActivo && (
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  Pedido activo: #{m.pedidoActivo.numero}
                </div>
              )}

              <div className="flex flex-wrap gap-sm mb">
                {ESTADOS.filter((e) => e.value !== m.estado && !(e.value === 'disponible' && m.pedidoActivo)).map((e) => (
                  <button key={e.value} className="btn btn-outline btn-sm" onClick={() => cambiarEstadoManual(m, e.value)}>
                    {e.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-sm">
                <button className="btn btn-outline btn-sm" onClick={() => setModal({ ...m })}>Editar</button>
                {m.pedidoActivo && (
                  <button className="btn btn-secondary btn-sm" onClick={() => liberar(m)}>Liberar</button>
                )}
                {m.activo ? (
                  <button className="btn btn-danger btn-sm" onClick={() => desactivar(m)} disabled={!!m.pedidoActivo}>
                    Desactivar
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => activar(m)}>Activar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminarDefinitivo(m)}>Eliminar def.</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal._id ? `Editar mesa ${modal.numero}` : 'Nueva mesa'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <div className="grid grid-2">
            <Field label="Número de mesa">
              <input
                className="input"
                type="number"
                value={modal.numero}
                onChange={(e) => setModal({ ...modal, numero: e.target.value })}
              />
            </Field>
            <Field label="Nombre (opcional)">
              <input
                className="input"
                placeholder="Ej: Terraza 1"
                value={modal.nombre}
                onChange={(e) => setModal({ ...modal, nombre: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea
              className="input"
              style={{ minHeight: 60, resize: 'vertical' }}
              placeholder="Ej: mesa junto a la ventana, capacidad 4 personas..."
              value={modal.observaciones}
              onChange={(e) => setModal({ ...modal, observaciones: e.target.value })}
            />
          </Field>
          {modal._id && (
            <Field label="Estado">
              <select
                className="select"
                value={modal.estado}
                onChange={(e) => setModal({ ...modal, estado: e.target.value })}
                disabled={!!modal.pedidoActivo}
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              {modal.pedidoActivo && (
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Esta mesa tiene un pedido activo; usa "Liberar" para cambiar su estado manualmente.
                </div>
              )}
            </Field>
          )}
        </Modal>
      )}
    </div>
  );
}
