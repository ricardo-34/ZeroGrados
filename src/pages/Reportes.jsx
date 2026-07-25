import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money, hoyISO, fechaCorta } from '../utils/format.js';
import { Alert, Loading, Empty } from '../components/UI.jsx';

const TABS = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'mas-vendidos', label: 'Más vendidos' },
  { id: 'cajero', label: 'Por cajero' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'utilidad', label: 'Utilidad/Pérdida' },
  { id: 'flujo', label: 'Flujo de caja' },
];

export default function Reportes() {
  const [tab, setTab] = useState('ventas');
  const [desde, setDesde] = useState(hoyISO().slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoyISO());
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    setData(null);
    const rango = `desde=${desde}&hasta=${hasta}`;
    try {
      let res;
      if (tab === 'ventas') res = await api.get(`/reportes/ventas?${rango}`);
      else if (tab === 'mas-vendidos') res = await api.get(`/reportes/mas-vendidos?${rango}`);
      else if (tab === 'cajero') res = await api.get(`/reportes/ventas-cajero?${rango}`);
      else if (tab === 'inventario') res = await api.get('/reportes/inventario');
      else if (tab === 'utilidad') res = await api.get(`/reportes/utilidad?${rango}`);
      else if (tab === 'flujo') res = await api.get('/reportes/flujo-caja');
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <h1 className="mb">Reportes</h1>
      <Alert type="error">{error}</Alert>

      <div className="card mb">
        <div className="flex flex-wrap gap-sm mb">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {['ventas', 'mas-vendidos', 'cajero', 'utilidad'].includes(tab) && (
          <div className="flex flex-wrap gap-sm items-center">
            <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ maxWidth: 170 }} />
            <span className="text-muted">a</span>
            <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ maxWidth: 170 }} />
            <button className="btn btn-secondary" onClick={cargar}>Aplicar</button>
          </div>
        )}
      </div>

      {cargando ? <Loading /> : <Contenido tab={tab} data={data} />}
    </div>
  );
}

function Contenido({ tab, data }) {
  if (!data) return <Empty text="Sin datos" />;

  if (tab === 'ventas') {
    return (
      <div className="card">
        <div className="grid grid-2 mb">
          <div><div className="text-muted">Total ventas</div><div className="big-number">{money(data.data.total)}</div></div>
          <div><div className="text-muted">N.º ventas</div><div className="big-number">{data.data.cantidad}</div></div>
        </div>
        <table className="tbl">
          <thead><tr><th>Fecha</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {data.data.porDia.map((d) => (
              <tr key={d.fecha}><td>{fechaCorta(d.fecha)}</td><td className="text-right">{money(d.monto)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'mas-vendidos') {
    return (
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Producto</th><th className="text-right">Cantidad</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i._id}><td>{i.nombre}</td><td className="text-right">{i.cantidad}</td><td className="text-right">{money(i.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'cajero') {
    return (
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Cajero</th><th className="text-right">N.º ventas</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i._id}><td>{i.nombre}</td><td className="text-right">{i.cantidad}</td><td className="text-right">{money(i.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'inventario') {
    return (
      <div className="card">
        <div className="text-muted mb">Valor total del inventario: <strong>{money(data.totalValor)}</strong></div>
        <table className="tbl">
          <thead><tr><th>Producto</th><th>Categoría</th><th className="text-right">Stock</th><th className="text-right">Valor</th></tr></thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i._id}>
                <td>{i.nombre}</td>
                <td>{i.categoria || '—'}</td>
                <td className={`text-right ${i.stockBajo ? 'text-danger' : ''}`}>{i.stock}</td>
                <td className="text-right">{money(i.valorInventario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'utilidad') {
    const d = data.data;
    return (
      <div className="card">
        <div className="grid grid-3 mb">
          <div><div className="text-muted">Ventas</div><div className="big-number">{money(d.totalVentas)}</div></div>
          <div><div className="text-muted">Costo de ventas</div><div className="big-number">{money(d.costoVentas)}</div></div>
          <div>
            <div className="text-muted">Utilidad bruta</div>
            <div className="big-number" style={{ color: d.utilidadBruta >= 0 ? 'var(--verde-bosque)' : 'var(--rojo)' }}>
              {money(d.utilidadBruta)}
            </div>
          </div>
        </div>
        <div className="text-muted">Compras del periodo: {money(d.totalCompras)}</div>
      </div>
    );
  }

  if (tab === 'flujo') {
    return (
      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Fecha cierre</th><th className="text-right">Ventas efectivo</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Diferencia</th></tr>
          </thead>
          <tbody>
            {data.items.map((c, i) => (
              <tr key={i}>
                <td>{fechaCorta(c.fecha)}</td>
                <td className="text-right">{money(c.ventasEfectivo)}</td>
                <td className="text-right">{money(c.ingresos)}</td>
                <td className="text-right">{money(c.egresos)}</td>
                <td className={`text-right ${c.diferencia < 0 ? 'text-danger' : ''}`}>{money(c.diferencia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
