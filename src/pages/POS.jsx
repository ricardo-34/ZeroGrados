import { useState, useEffect, useRef } from 'react';
import api from '../api/client.js';
import { money } from '../utils/format.js';
import { Alert, Modal, Field } from '../components/UI.jsx';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [caja, setCaja] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [ventaImprimir, setVentaImprimir] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const codigoRef = useRef();

  const cargar = async () => {
    try {
      const [p, c, cj] = await Promise.all([
        api.get('/productos?activo=true'),
        api.get('/clientes'),
        api.get('/caja/actual'),
      ]);
      setProductos(p.data.items);
      setClientes(c.data.items);
      setCaja(cj.data.item);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoBarras || '').includes(busqueda)
  );

  const agregar = (prod) => {
    setError('');
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto === prod._id);
      if (existe) {
        if (existe.cantidad >= prod.stock) {
          setError(`Stock insuficiente de ${prod.nombre}`);
          return prev;
        }
        return prev.map((i) =>
          i.producto === prod._id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      if (prod.stock < 1) {
        setError(`${prod.nombre} sin stock`);
        return prev;
      }
      return [
        ...prev,
        {
          producto: prod._id,
          nombre: prod.nombre,
          precio: prod.precioVenta,
          iva: prod.iva || 0,
          cantidad: 1,
          stock: prod.stock,
        },
      ];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) => {
          if (i.producto !== id) return i;
          const nueva = i.cantidad + delta;
          if (nueva > i.stock) {
            setError(`Stock máximo de ${i.nombre}: ${i.stock}`);
            return i;
          }
          return { ...i, cantidad: nueva };
        })
        .filter((i) => i.cantidad > 0)
    );
  };

  const quitar = (id) => setCarrito((prev) => prev.filter((i) => i.producto !== id));

  const buscarPorCodigo = async (e) => {
    e.preventDefault();
    if (!busqueda) return;
    // Coincidencia exacta por código de barras -> agregar directo
    const exacto = productos.find((p) => p.codigoBarras === busqueda);
    if (exacto) {
      agregar(exacto);
      setBusqueda('');
      codigoRef.current?.focus();
    }
  };

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const ivaTotal = carrito.reduce((s, i) => s + (i.precio * i.cantidad * i.iva) / 100, 0);
  const total = Math.max(0, subtotal - Number(descuento || 0) + ivaTotal);

  const cobrar = async () => {
    setError('');
    setOk('');
    if (carrito.length === 0) return setError('El carrito está vacío');
    setProcesando(true);
    try {
      const res = await api.post('/ventas', {
        cliente: cliente || undefined,
        detalle: carrito.map((i) => ({ producto: i.producto, cantidad: i.cantidad })),
        descuento: Number(descuento || 0),
        metodoPago,
      });
      setOk(`Venta #${res.data.item.numero} registrada`);
      setVentaImprimir(res.data.item);
      setCarrito([]);
      setDescuento(0);
      setCliente('');
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (!caja) {
    return (
      <div>
        <h1 className="mb">Punto de Venta</h1>
        <Alert type="warn">
          No tienes una caja abierta. Ve al módulo <strong>Caja</strong> y ábrela antes de vender.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb">Punto de Venta</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Productos */}
        <div className="card">
          <form onSubmit={buscarPorCodigo}>
            <input
              ref={codigoRef}
              className="input mb"
              placeholder="Buscar por nombre o escanear código de barras..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />
          </form>
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}
          >
            {filtrados.map((p) => (
              <button
                key={p._id}
                onClick={() => agregar(p)}
                disabled={p.stock < 1}
                style={{
                  border: '1px solid var(--gris-borde)',
                  borderRadius: 10,
                  padding: 12,
                  background: p.stock < 1 ? '#f3f4f6' : '#fff',
                  cursor: p.stock < 1 ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  minHeight: 44,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                <div style={{ color: 'var(--verde-esmeralda)', fontWeight: 700 }}>
                  {money(p.precioVenta)}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Stock: {p.stock}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="card">
          <h2 className="mb">Carrito</h2>
          {carrito.length === 0 ? (
            <div className="text-muted mb">Agrega productos...</div>
          ) : (
            <div className="mb">
              {carrito.map((i) => (
                <div
                  key={i.producto}
                  className="flex-between"
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--gris-borde)' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{i.nombre}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {money(i.precio)} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    <button className="btn btn-outline btn-sm" onClick={() => cambiarCantidad(i.producto, -1)}>
                      −
                    </button>
                    <span style={{ minWidth: 20, textAlign: 'center' }}>{i.cantidad}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => cambiarCantidad(i.producto, 1)}>
                      +
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => quitar(i.producto)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Field label="Cliente (opcional)">
            <select className="select" value={cliente} onChange={(e) => setCliente(e.target.value)}>
              <option value="">— Sin cliente —</option>
              {clientes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-2">
            <Field label="Descuento">
              <input
                className="input"
                type="number"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
              />
            </Field>
            <Field label="Método de pago">
              <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </Field>
          </div>

          <div style={{ borderTop: '2px solid var(--gris-borde)', paddingTop: 10, marginTop: 6 }}>
            <div className="flex-between">
              <span className="text-muted">Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">IVA</span>
              <span>{money(ivaTotal)}</span>
            </div>
            <div className="flex-between">
              <span className="text-muted">Descuento</span>
              <span>−{money(descuento)}</span>
            </div>
            <div className="flex-between" style={{ marginTop: 6 }}>
              <strong style={{ fontSize: 18 }}>Total</strong>
              <strong style={{ fontSize: 22, color: 'var(--verde-esmeralda)' }}>{money(total)}</strong>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block mt"
            onClick={cobrar}
            disabled={procesando || carrito.length === 0}
          >
            {procesando ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>

      {ventaImprimir && (
        <FacturaModal venta={ventaImprimir} onClose={() => setVentaImprimir(null)} />
      )}
    </div>
  );
}

function FacturaModal({ venta, onClose }) {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api.get('/config').then((r) => setConfig(r.data.item)).catch(() => {});
  }, []);

  const imprimir = () => window.print();

  return (
    <Modal
      title={`Factura #${venta.numero}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn-primary" onClick={imprimir}>
            Imprimir
          </button>
        </>
      }
    >
      <div id="factura-print" style={{ fontSize: 14 }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 18 }}>{config?.nombreComercial || 'Zero Grados'}</strong>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {config?.nit && <>NIT: {config.nit}<br /></>}
            {config?.direccion}<br />
            {config?.telefono}
          </div>
        </div>
        <div className="text-muted" style={{ fontSize: 12 }}>
          Factura #{venta.numero} · {new Date(venta.createdAt).toLocaleString('es-CO')}
        </div>
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
          Cajero: {venta.usuario?.nombre} · Pago: {venta.metodoPago}
        </div>
        <table className="tbl" style={{ marginBottom: 8 }}>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-right">Cant</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalle.map((d, i) => (
              <tr key={i}>
                <td>{d.nombre}</td>
                <td className="text-right">{d.cantidad}</td>
                <td className="text-right">{money(d.precioUnitario * d.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex-between"><span>Subtotal</span><span>{money(venta.subtotal)}</span></div>
        <div className="flex-between"><span>IVA</span><span>{money(venta.iva)}</span></div>
        <div className="flex-between"><span>Descuento</span><span>−{money(venta.descuento)}</span></div>
        <div className="flex-between" style={{ marginTop: 6, fontSize: 16 }}>
          <strong>TOTAL</strong>
          <strong>{money(venta.total)}</strong>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }} className="text-muted">
          ¡Gracias por su compra!
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #factura-print, #factura-print * { visibility: visible; }
          #factura-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </Modal>
  );
}
