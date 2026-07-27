import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Alert, Field, Loading } from '../components/UI.jsx';
import { money } from '../utils/format.js';

export default function Configuracion() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get('/config')
      .then((r) => setConfig(r.data.item))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const guardar = async () => {
    setError('');
    setOk('');
    try {
      const res = await api.put('/config', config);
      setConfig(res.data.item);
      setOk('Configuración guardada');
    } catch (err) {
      setError(err.message);
    }
  };

  if (cargando) return <Loading />;
  if (!config) return <Alert type="error">{error}</Alert>;

  const set = (k, v) => setConfig({ ...config, [k]: v });

  // --- Helpers de tarifas de juego ---
  const tarifas = config.tarifasJuego || [];
  const setTarifas = (arr) => setConfig({ ...config, tarifasJuego: arr });

  const agregarTarifa = () =>
    setTarifas([...tarifas, { nombre: '', minutos: 10, valor: 5000, activo: true }]);

  const cambiarTarifa = (i, campo, valor) =>
    setTarifas(tarifas.map((t, idx) => (idx === i ? { ...t, [campo]: valor } : t)));

  const quitarTarifa = (i) => setTarifas(tarifas.filter((_, idx) => idx !== i));

  return (
    <div>
      <h1 className="mb">Configuración de empresa</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="card" style={{ maxWidth: 620 }}>
        <div className="grid grid-2">
          <Field label="Nombre comercial">
            <input className="input" value={config.nombreComercial} onChange={(e) => set('nombreComercial', e.target.value)} />
          </Field>
          <Field label="NIT">
            <input className="input" value={config.nit} onChange={(e) => set('nit', e.target.value)} />
          </Field>
        </div>
        <Field label="Dirección">
          <input className="input" value={config.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </Field>
        <div className="grid grid-3">
          <Field label="Teléfono">
            <input className="input" value={config.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </Field>
          <Field label="Moneda">
            <input className="input" value={config.moneda} onChange={(e) => set('moneda', e.target.value)} />
          </Field>
          <Field label="IVA por defecto %">
            <input className="input" type="number" value={config.ivaPorDefecto} onChange={(e) => set('ivaPorDefecto', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="URL del logo">
          <input className="input" value={config.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
        </Field>
        {config.logoUrl && (
          <img src={config.logoUrl} alt="logo" style={{ maxHeight: 60, marginBottom: 12 }} onError={(e) => (e.target.style.display = 'none')} />
        )}
        <button className="btn btn-primary" onClick={guardar}>Guardar cambios</button>
      </div>

      {/* --- Tarifas de juego --- */}
      <div className="card mt" style={{ maxWidth: 720 }}>
        <div className="flex-between mb">
          <h3>Tarifas de juego</h3>
          <button className="btn btn-outline btn-sm" onClick={agregarTarifa}>+ Agregar tarifa</button>
        </div>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Define las opciones de tiempo y su valor (ej: 10 minutos = $5.000). Estas aparecen en el módulo <strong>Juegos</strong>.
        </p>

        <Field label="Indicativo de país para WhatsApp (ej: 57 Colombia)">
          <input
            className="input"
            style={{ maxWidth: 120 }}
            value={config.indicativoPaisWhatsapp || '57'}
            onChange={(e) => set('indicativoPaisWhatsapp', e.target.value.replace(/\D/g, ''))}
          />
        </Field>

        {tarifas.length === 0 ? (
          <div className="text-muted mb">Aún no hay tarifas. Agrega la primera.</div>
        ) : (
          <div className="mb">
            {tarifas.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-sm"
                style={{ padding: '8px 0', borderBottom: '1px solid var(--gris-borde)', flexWrap: 'wrap' }}
              >
                <input
                  className="input"
                  style={{ flex: '2 1 140px' }}
                  placeholder="Nombre (opcional)"
                  value={t.nombre || ''}
                  onChange={(e) => cambiarTarifa(i, 'nombre', e.target.value)}
                />
                <input
                  className="input"
                  style={{ flex: '1 1 90px' }}
                  type="number"
                  min="1"
                  placeholder="Min"
                  value={t.minutos}
                  onChange={(e) => cambiarTarifa(i, 'minutos', Number(e.target.value))}
                />
                <input
                  className="input"
                  style={{ flex: '1 1 110px' }}
                  type="number"
                  min="0"
                  placeholder="Valor"
                  value={t.valor}
                  onChange={(e) => cambiarTarifa(i, 'valor', Number(e.target.value))}
                />
                <label className="flex items-center gap-sm" style={{ fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={t.activo !== false}
                    onChange={(e) => cambiarTarifa(i, 'activo', e.target.checked)}
                  />
                  Activa
                </label>
                <button className="btn btn-danger btn-sm" onClick={() => quitarTarifa(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" onClick={guardar}>Guardar tarifas</button>
      </div>

      <div className="card mt" style={{ maxWidth: 620 }}>
        <h3 className="mb">Impresión</h3>
        <p className="text-muted" style={{ fontSize: 14 }}>
          La factura se imprime desde el navegador (Ctrl/Cmd + P o botón “Imprimir” en el POS).
          Es compatible con impresoras térmicas configuradas como impresora del sistema.
        </p>
      </div>

      <div className="card mt" style={{ maxWidth: 620 }}>
        <h3 className="mb">WhatsApp (notificaciones de juegos)</h3>
        <p className="text-muted" style={{ fontSize: 14 }}>
          El envío automático usa Meta WhatsApp Cloud API o Twilio, según las variables de entorno
          del servidor. Si no hay credenciales, se genera un enlace de respaldo para envío manual.
        </p>
      </div>
    </div>
  );
}
