export function Modal({ title, children, onClose, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between mb">
          <h2>{title}</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="flex mt" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Badge({ estado }) {
  return <span className={`badge badge-${estado}`}>{estado}</span>;
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Loading({ text = 'Cargando...' }) {
  return <div className="text-muted" style={{ padding: 20 }}>{text}</div>;
}

export function Empty({ text = 'Sin registros' }) {
  return <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>{text}</div>;
}
