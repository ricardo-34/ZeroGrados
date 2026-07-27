import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client.js';
import { money } from '../utils/format.js';
import { Alert, Modal, Field } from '../components/UI.jsx';
import { useSocketEvent } from '../hooks/useSocket.js';

// Cuenta atrás en vivo de una sesión. Devuelve ms restantes y helpers.
function useContador(finISO) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const restanteMs = new Date(finISO).getTime() - ahora;
  return restanteMs;
}

function fmtReloj(ms) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${neg ? '-' : ''}${mm}:${ss}`;
}

export default function Juegos() {
  const [tarifas, setTarifas] = useState([]);
  const [activas, setActivas] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(true);

  // Alertas de fin de tiempo ya mostradas (para no repetir el modal)
  const alertadas = useRef(new Set());
  const [finModal, setFinModal] = useState(null); // sesión cuyo tiempo terminó

  const cargar = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([
        api.get('/juegos/tarifas'),
        api.get('/juegos/activas'),
      ]);
      setTarifas(t.data.items);
      setActivas(a.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Sincronía en tiempo real con administración / otros cajeros
  const upsert = useCallback((sesion) => {
    setActivas((prev) => {
      const fuera = prev.filter((s) => s._id !== sesion._id);
      // Solo mantener en el tablero las que siguen activas
      return sesion.estado === 'activa' ? [...fuera, sesion] : fuera;
    });
  }, []);

  useSocketEvent('juego:creada', upsert);
  useSocketEvent('juego:actualizada', upsert);
  useSocketEvent('juego:finalizada', (s) =>
    setActivas((prev) => prev.filter((x) => x._id !== s._id))
  );

  const dispararFin = useCallback((sesion) => {
    if (alertadas.current.has(sesion._id)) return;
    alertadas.current.add(sesion._id);
    setFinModal(sesion);
    // Aviso sonoro simple
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), 500);
    } catch (_) {}
  }, []);

  if (cargando) return <div>Cargando…</div>;

  return (
    <div>
      <div className="flex-between mb">
        <h1>Juegos</h1>
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      {tarifas.length === 0 && (
        <Alert type="warn">
          No hay tarifas de tiempo configuradas. Ve a <strong>Configuración → Tarifas de juego</strong> para crearlas.
        </Alert>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        <RegistroNino
          tarifas={tarifas}
          onCreada={(s) => {
            upsert(s);
            setOk(`Juego #${s.numero} iniciado para ${s.nombreNino}`);
            setTimeout(() => setOk(''), 3000);
          }}
          onError={setError}
        />

        <div className="card">
          <h2 className="mb">En juego ahora ({activas.length})</h2>
          {activas.length === 0 ? (
            <div className="text-muted">No hay niños jugando en este momento.</div>
          ) : (
            <div className="grid" style={{ gap: 12 }}>
              {activas
                .slice()
                .sort((a, b) => new Date(a.fin) - new Date(b.fin))
                .map((s) => (
                  <TarjetaJuego
                    key={s._id}
                    sesion={s}
                    tarifas={tarifas}
                    onFinTiempo={dispararFin}
                    onCambio={(res) => {
                      if (res) upsert(res);
                    }}
                    onError={setError}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {finModal && (
        <FinTiempoModal
          sesion={finModal}
          tarifas={tarifas}
          onClose={() => setFinModal(null)}
          onError={setError}
          onResuelto={(res) => {
            if (res?.estado === 'activa') upsert(res);
            else setActivas((prev) => prev.filter((x) => x._id !== finModal._id));
            setFinModal(null);
          }}
        />
      )}
    </div>
  );
}

// --- Formulario de registro del niño ---
function RegistroNino({ tarifas, onCreada, onError }) {
  const [nombreNino, setNombreNino] = useState('');
  const [whatsappPadre, setWhatsappPadre] = useState('');
  const [tarifaId, setTarifaId] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [enviando, setEnviando] = useState(false);

  const tarifaSel = tarifas.find((t) => t._id === tarifaId);

  const registrar = async () => {
    onError('');
    if (!nombreNino.trim()) return onError('Ingresa el nombre del niño');
    if (!whatsappPadre.trim()) return onError('Ingresa el WhatsApp del acudiente');
    if (!tarifaId) return onError('Selecciona el tiempo de juego');
    setEnviando(true);
    try {
      const res = await api.post('/juegos', {
        nombreNino: nombreNino.trim(),
        whatsappPadre: whatsappPadre.trim(),
        tarifaId,
        metodoPago,
      });
      onCreada(res.data.item);
      setNombreNino('');
      setWhatsappPadre('');
      setTarifaId('');
    } catch (err) {
      onError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card">
      <h2 className="mb">Registrar niño</h2>
      <Field label="Nombre del niño">
        <input
          className="input"
          value={nombreNino}
          onChange={(e) => setNombreNino(e.target.value)}
          placeholder="Ej: Samuel"
        />
      </Field>
      <Field label="WhatsApp del padre/madre">
        <input
          className="input"
          value={whatsappPadre}
          onChange={(e) => setWhatsappPadre(e.target.value)}
          placeholder="Ej: 3101234567"
        />
      </Field>
      <Field label="Tiempo de juego">
        <select className="select" value={tarifaId} onChange={(e) => setTarifaId(e.target.value)}>
          <option value="">— Selecciona —</option>
          {tarifas.map((t) => (
            <option key={t._id} value={t._id}>
              {(t.nombre ? t.nombre + ' · ' : '') + `${t.minutos} min — ${money(t.valor)}`}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Método de pago">
        <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </Field>

      {tarifaSel && (
        <div className="flex-between" style={{ margin: '8px 0' }}>
          <span className="text-muted">Valor</span>
          <strong style={{ fontSize: 20, color: 'var(--verde-esmeralda)' }}>{money(tarifaSel.valor)}</strong>
        </div>
      )}

      <button className="btn btn-primary btn-block mt" onClick={registrar} disabled={enviando}>
        {enviando ? 'Iniciando…' : 'Iniciar juego'}
      </button>
    </div>
  );
}

// --- Tarjeta de una sesión activa con contador ---
function TarjetaJuego({ sesion, tarifas, onFinTiempo, onCambio, onError }) {
  const restanteMs = useContador(sesion.fin);
  const disparado = useRef(false);

  useEffect(() => {
    if (restanteMs <= 0 && !disparado.current) {
      disparado.current = true;
      onFinTiempo(sesion);
    }
    if (restanteMs > 0) disparado.current = false;
  }, [restanteMs, sesion, onFinTiempo]);

  const [ampMenu, setAmpMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  const ampliar = async (tarifaId) => {
    setBusy(true);
    onError('');
    try {
      const res = await api.post(`/juegos/${sesion._id}/ampliar`, { tarifaId });
      onCambio(res.data.item);
      setAmpMenu(false);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const finalizar = async () => {
    setBusy(true);
    onError('');
    try {
      const res = await api.post(`/juegos/${sesion._id}/finalizar`);
      onCambio(res.data.item);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const agotado = restanteMs <= 0;

  return (
    <div
      style={{
        border: `2px solid ${agotado ? 'var(--rojo, #dc2626)' : 'var(--gris-borde)'}`,
        borderRadius: 12,
        padding: 14,
        background: agotado ? '#fef2f2' : '#fff',
      }}
    >
      <div className="flex-between">
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{sesion.nombreNino}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            #{sesion.numero} · {sesion.minutosTotales} min · {money(sesion.valorTotal)}
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: agotado ? 'var(--rojo, #dc2626)' : 'var(--verde-esmeralda)',
          }}
        >
          {fmtReloj(restanteMs)}
        </div>
      </div>

      <div className="flex gap-sm mt" style={{ position: 'relative' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setAmpMenu((v) => !v)} disabled={busy}>
          + Minutos
        </button>
        <button className="btn btn-primary btn-sm" onClick={finalizar} disabled={busy}>
          Finalizar
        </button>

        {ampMenu && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              zIndex: 20,
              background: '#fff',
              border: '1px solid var(--gris-borde)',
              borderRadius: 8,
              padding: 6,
              minWidth: 220,
              boxShadow: '0 4px 12px rgba(0,0,0,.12)',
            }}
          >
            {tarifas.map((t) => (
              <button
                key={t._id}
                className="btn btn-outline btn-sm btn-block"
                style={{ marginBottom: 4, textAlign: 'left' }}
                onClick={() => ampliar(t._id)}
                disabled={busy}
              >
                +{t.minutos} min — {money(t.valor)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Modal cuando se agota el tiempo ---
function FinTiempoModal({ sesion, tarifas, onClose, onResuelto, onError }) {
  const [busy, setBusy] = useState(false);
  const [tarifaId, setTarifaId] = useState(tarifas[0]?._id || '');

  const agregar = async () => {
    if (!tarifaId) return onError('Selecciona una tarifa para agregar');
    setBusy(true);
    onError('');
    try {
      const res = await api.post(`/juegos/${sesion._id}/ampliar`, { tarifaId });
      onResuelto(res.data.item);
    } catch (err) {
      onError(err.message);
      setBusy(false);
    }
  };

  const finalizar = async () => {
    setBusy(true);
    onError('');
    try {
      const res = await api.post(`/juegos/${sesion._id}/finalizar`);
      onResuelto(res.data.item);
    } catch (err) {
      onError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`⏰ Tiempo finalizado — ${sesion.nombreNino}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-primary" onClick={finalizar} disabled={busy}>
            Finalizar y cobrar
          </button>
        </>
      }
    >
      <p className="mb">
        El tiempo de juego de <strong>{sesion.nombreNino}</strong> ha terminado.
        <br />
        Tiempo usado: <strong>{sesion.minutosTotales} min</strong> · Total actual:{' '}
        <strong>{money(sesion.valorTotal)}</strong>
      </p>

      <div className="card" style={{ background: '#f9fafb' }}>
        <Field label="Agregar más minutos">
          <select className="select" value={tarifaId} onChange={(e) => setTarifaId(e.target.value)}>
            {tarifas.map((t) => (
              <option key={t._id} value={t._id}>
                +{t.minutos} min — {money(t.valor)}
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-outline btn-block" onClick={agregar} disabled={busy}>
          Agregar minutos
        </button>
      </div>
    </Modal>
  );
}
