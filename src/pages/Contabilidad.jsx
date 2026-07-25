import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money, hoyISO, fecha } from '../utils/format.js';
import { Alert, Loading, Empty } from '../components/UI.jsx';

export default function Contabilidad() {
  const [cuentas, setCuentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [resultados, setResultados] = useState(null);
  const [desde, setDesde] = useState(hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    setError('');
    const rango = `desde=${desde}&hasta=${hasta}`;
    try {
      const [c, m, r] = await Promise.all([
        api.get('/contabilidad/cuentas'),
        api.get(`/contabilidad/movimientos?${rango}`),
        api.get(`/contabilidad/estado-resultados?${rango}`),
      ]);
      setCuentas(c.data.items);
      setMovimientos(m.data.items);
      setResultados(r.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) return <Loading />;

  return (
    <div>
      <h1 className="mb">Contabilidad básica</h1>
      <Alert type="error">{error}</Alert>

      <div className="card mb">
        <div className="flex flex-wrap gap-sm items-center">
          <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ maxWidth: 170 }} />
          <span className="text-muted">a</span>
          <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ maxWidth: 170 }} />
          <button className="btn btn-secondary" onClick={cargar}>Aplicar</button>
        </div>
      </div>

      {resultados && (
        <div className="grid grid-3 mb">
          <div className="card"><div className="text-muted">Ingresos</div><div className="big-number text-success">{money(resultados.ingresos)}</div></div>
          <div className="card"><div className="text-muted">Gastos</div><div className="big-number text-danger">{money(resultados.gastos)}</div></div>
          <div className="card">
            <div className="text-muted">Utilidad / Pérdida</div>
            <div className="big-number" style={{ color: resultados.utilidad >= 0 ? 'var(--verde-bosque)' : 'var(--rojo)' }}>
              {money(resultados.utilidad)}
            </div>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        <div className="card">
          <h3 className="mb">Catálogo de cuentas</h3>
          <table className="tbl">
            <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th></tr></thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c._id}><td>{c.codigo}</td><td>{c.nombre}</td><td className="text-muted">{c.tipo}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="mb">Movimientos contables</h3>
          {movimientos.length === 0 ? (
            <Empty />
          ) : (
            <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Tipo</th><th className="text-right">Monto</th></tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m._id}>
                      <td>{fecha(m.fecha)}</td>
                      <td>{m.cuenta?.codigo} · {m.cuenta?.nombre}</td>
                      <td className="text-muted">{m.concepto || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{m.tipo}</td>
                      <td className="text-right">{money(m.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
