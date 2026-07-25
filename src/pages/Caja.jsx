import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money, fecha } from '../utils/format.js';
import { Alert, Field, Badge, Empty } from '../components/UI.jsx';

export default function Caja() {
  const [caja, setCaja] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [montoApertura, setMontoApertura] = useState('');
  const [montoContado, setMontoContado] = useState('');
  const [mov, setMov] = useState({ tipo: 'ingreso', monto: '', concepto: '' });

  const cargar = async () => {
    try {
      const [c, h] = await Promise.all([api.get('/caja/actual'), api.get('/caja/historial')]);
      setCaja(c.data.item);
      setHistorial(h.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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
