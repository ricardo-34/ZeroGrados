import { Modal } from './UI.jsx';
import { money } from '../utils/format.js';

// Resumen del pedido para que el mesero confirme antes de enviarlo a cocina.
// modoAgregar=true cuando se están sumando productos a una cuenta de mesa
// ya abierta, en vez de crear un pedido nuevo.
export default function ResumenPedidoModal({ mesaLabel, carrito, onClose, onConfirmar, enviando, modoAgregar }) {
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <Modal
      title={modoAgregar ? 'Agregar productos a la cuenta' : 'Confirmar pedido'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={enviando}>
            Seguir editando
          </button>
          <button className="btn btn-primary" onClick={onConfirmar} disabled={enviando}>
            {enviando ? 'Enviando...' : modoAgregar ? 'Confirmar y enviar a cocina' : 'Confirmar y enviar a cocina'}
          </button>
        </>
      }
    >
      <div className="mb" style={{ fontSize: 14 }}>
        <span className="text-muted">Mesa: </span>
        <strong>{mesaLabel || 'Sin especificar'}</strong>
      </div>
      {modoAgregar && (
        <div className="alert alert-warn" style={{ marginBottom: 14 }}>
          Estos productos se sumarán a la cuenta que ya está abierta en esta mesa.
        </div>
      )}

      <div className="table-wrap mb">
        <table className="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-right">Cant.</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((i) => (
              <tr key={i.producto}>
                <td>
                  {i.nombre}
                  {i.observaciones && (
                    <div style={{ fontSize: 12, color: 'var(--verde-bosque)', fontStyle: 'italic' }}>
                      ▸ {i.observaciones}
                    </div>
                  )}
                </td>
                <td className="text-right">{i.cantidad}</td>
                <td className="text-right">{money(i.precio)}</td>
                <td className="text-right">{money(i.precio * i.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-between" style={{ paddingTop: 10, borderTop: '2px solid var(--gris-borde)' }}>
        <span className="text-muted">{totalItems} producto{totalItems !== 1 ? 's' : ''}</span>
        <strong style={{ fontSize: 22, color: 'var(--verde-esmeralda)' }}>{money(total)}</strong>
      </div>
    </Modal>
  );
}
