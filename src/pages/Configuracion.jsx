import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Alert, Field, Loading } from '../components/UI.jsx';

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

      <div className="card mt" style={{ maxWidth: 620 }}>
        <h3 className="mb">Impresión</h3>
        <p className="text-muted" style={{ fontSize: 14 }}>
          La factura se imprime desde el navegador (Ctrl/Cmd + P o botón “Imprimir” en el POS).
          Es compatible con impresoras térmicas configuradas como impresora del sistema.
        </p>
      </div>
    </div>
  );
}
