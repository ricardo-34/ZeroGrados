import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money } from '../utils/format.js';
import { Modal } from './UI.jsx';

// Estilos compartidos del ticket térmico (58mm / 80mm).
function estilosTicket(ancho) {
  const w = ancho === '58mm' ? '58mm' : '80mm';
  return `
    .ticket {
      width: ${w};
      margin: 0 auto;
      padding: 4px 6px;
      background: #fff;
      color: #000;
      font-family: 'Courier New', ui-monospace, monospace;
      font-size: 12px;
      line-height: 1.35;
    }
    .t-title { font-size: 15px; font-weight: 700; }
    .t-center { text-align: center; }
    .t-logo { max-width: 60%; max-height: 60px; margin: 0 auto 4px; display: block; }
    .t-sep { border-top: 1px dashed #000; margin: 6px 0; }
    .t-row { display: flex; justify-content: space-between; gap: 6px; }
    .t-item { margin-bottom: 3px; }
    .t-item-name { font-weight: 600; }
    .t-total { font-weight: 700; font-size: 14px; }
    .t-thanks { margin-top: 6px; }
    .t-feed { height: 24px; }
    @media print {
      @page { size: ${w} auto; margin: 0; }
      body * { visibility: hidden; }
      #ticket, #ticket * { visibility: visible; }
      #ticket { position: absolute; left: 0; top: 0; width: ${w}; margin: 0; padding: 0 2mm; }
    }
  `;
}

function useConfig() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api.get('/config').then((r) => setConfig(r.data.item)).catch(() => {});
  }, []);
  return config;
}

function Encabezado({ config }) {
  return (
    <div className="t-center">
      {config?.logoUrl ? <img src={config.logoUrl} alt="logo" className="t-logo" /> : null}
      <div className="t-title">{config?.nombreComercial || 'Zero Grados'}</div>
      {config?.nit ? <div>NIT: {config.nit}</div> : null}
      {config?.direccion ? <div>{config.direccion}</div> : null}
      {config?.telefono ? <div>Tel: {config.telefono}</div> : null}
    </div>
  );
}

// --- Factura tras cobrar (misma que el POS) ---
export function FacturaModal({ venta, onClose }) {
  const config = useConfig();
  const [ancho, setAncho] = useState(() => localStorage.getItem('ticket_ancho') || '80mm');
  useEffect(() => { localStorage.setItem('ticket_ancho', ancho); }, [ancho]);
  const imprimir = () => window.print();

  return (
    <Modal
      title={`Factura #${venta.numero}`}
      onClose={onClose}
      footer={
        <>
          <select className="select" value={ancho} onChange={(e) => setAncho(e.target.value)} style={{ maxWidth: 110 }}>
            <option value="58mm">58 mm</option>
            <option value="80mm">80 mm</option>
          </select>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={imprimir}>Imprimir</button>
        </>
      }
    >
      <div id="ticket" className="ticket">
        <Encabezado config={config} />
        <div className="t-sep" />
        <div>Factura #: {venta.numero}</div>
        <div>{new Date(venta.createdAt).toLocaleString('es-CO')}</div>
        <div>Cajero: {venta.usuario?.nombre || '-'}</div>
        <div>Pago: {venta.metodoPago}</div>
        <div className="t-sep" />
        {venta.detalle.map((d, i) => (
          <div className="t-item" key={i}>
            <div className="t-item-name">{d.nombre}</div>
            <div className="t-row">
              <span>{d.cantidad} x {money(d.precioUnitario)}</span>
              <span>{money(d.precioUnitario * d.cantidad)}</span>
            </div>
          </div>
        ))}
        <div className="t-sep" />
        <div className="t-row"><span>Subtotal</span><span>{money(venta.subtotal)}</span></div>
        <div className="t-row"><span>IVA</span><span>{money(venta.iva)}</span></div>
        <div className="t-row"><span>Descuento</span><span>-{money(venta.descuento)}</span></div>
        <div className="t-row t-total"><span>TOTAL</span><span>{money(venta.total)}</span></div>
        <div className="t-sep" />
        <div className="t-center t-thanks">Gracias por su compra</div>
        <div className="t-feed" />
      </div>
      <style>{estilosTicket(ancho)}</style>
    </Modal>
  );
}

// --- Pre-cuenta / comanda de un pedido (antes de cobrar) ---
export function TicketPedidoModal({ pedido, onClose }) {
  const config = useConfig();
  const [ancho, setAncho] = useState(() => localStorage.getItem('ticket_ancho') || '80mm');
  useEffect(() => { localStorage.setItem('ticket_ancho', ancho); }, [ancho]);
  const imprimir = () => window.print();

  const total = pedido.detalle.reduce((s, d) => s + (d.precioUnitario || 0) * d.cantidad, 0);

  return (
    <Modal
      title={`Pedido #${pedido.numero}`}
      onClose={onClose}
      footer={
        <>
          <select className="select" value={ancho} onChange={(e) => setAncho(e.target.value)} style={{ maxWidth: 110 }}>
            <option value="58mm">58 mm</option>
            <option value="80mm">80 mm</option>
          </select>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={imprimir}>Imprimir</button>
        </>
      }
    >
      <div id="ticket" className="ticket">
        <Encabezado config={config} />
        <div className="t-sep" />
        <div className="t-center" style={{ fontWeight: 700 }}>PRE-CUENTA</div>
        <div>Pedido #: {pedido.numero}</div>
        <div>{new Date(pedido.createdAt).toLocaleString('es-CO')}</div>
        {pedido.mesa ? <div>Mesa: {pedido.mesa}</div> : null}
        {pedido.mesero?.nombre ? <div>Mesero: {pedido.mesero.nombre}</div> : null}
        <div className="t-sep" />
        {pedido.detalle.map((d, i) => (
          <div className="t-item" key={i}>
            <div className="t-item-name">{d.nombre}</div>
            <div className="t-row">
              <span>{d.cantidad} x {money(d.precioUnitario || 0)}</span>
              <span>{money((d.precioUnitario || 0) * d.cantidad)}</span>
            </div>
          </div>
        ))}
        <div className="t-sep" />
        <div className="t-row t-total"><span>TOTAL</span><span>{money(total)}</span></div>
        <div className="t-sep" />
        <div className="t-center" style={{ fontSize: 11 }}>
          Documento no válido como factura
        </div>
        <div className="t-feed" />
      </div>
      <style>{estilosTicket(ancho)}</style>
    </Modal>
  );
}
