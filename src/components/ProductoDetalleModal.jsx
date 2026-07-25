import { Modal } from './UI.jsx';
import { money } from '../utils/format.js';

// Modal de "Ver detalles" de un producto, pensado para que el mesero
// se lo muestre al cliente antes de tomar el pedido.
export default function ProductoDetalleModal({ producto, onClose, onAgregar }) {
  if (!producto) return null;
  const {
    nombre, descripcion, queIncluye, ingredientes, imagenUrl,
    mediaUrl, mediaTipo, precioVenta,
  } = producto;

  return (
    <Modal
      title={nombre}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          {onAgregar && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onAgregar(producto);
                onClose();
              }}
            >
              Agregar al pedido
            </button>
          )}
        </>
      }
    >
      {(mediaUrl || imagenUrl) && (
        <div
          className="mb"
          style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gris-borde)', background: '#000' }}
        >
          {mediaUrl && mediaTipo === 'video' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', maxHeight: 280, display: 'block' }}
            />
          ) : (
            <img
              src={mediaUrl || imagenUrl}
              alt={nombre}
              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      )}

      <div className="flex-between mb">
        <span className="text-muted">Precio</span>
        <strong style={{ color: 'var(--verde-esmeralda)', fontSize: 20 }}>{money(precioVenta)}</strong>
      </div>

      {descripcion && (
        <div className="mb">
          <h3 style={{ marginBottom: 4 }}>Descripción</h3>
          <div style={{ fontSize: 14, color: 'var(--gris-texto)' }}>{descripcion}</div>
        </div>
      )}

      {queIncluye && (
        <div className="mb">
          <h3 style={{ marginBottom: 4 }}>Qué incluye</h3>
          <div style={{ fontSize: 14, color: 'var(--gris-texto)' }}>{queIncluye}</div>
        </div>
      )}

      {ingredientes && ingredientes.length > 0 && (
        <div className="mb">
          <h3 style={{ marginBottom: 6 }}>Ingredientes / características</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ingredientes.map((ing, i) => (
              <span
                key={i}
                style={{
                  fontSize: 13,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--gris-fondo)',
                  border: '1px solid var(--gris-borde)',
                  color: 'var(--verde-oscuro)',
                }}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {!descripcion && !queIncluye && (!ingredientes || ingredientes.length === 0) && (
        <div className="text-muted">Este producto aún no tiene información adicional.</div>
      )}
    </Modal>
  );
}
