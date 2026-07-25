const ESTADOS = {
  disponible: { label: 'Disponible', color: 'var(--verde-esmeralda)' },
  ocupada: { label: 'Ocupada', color: 'var(--rojo)' },
  reservada: { label: 'Reservada', color: 'var(--ambar)' },
  limpieza: { label: 'En limpieza', color: 'var(--azul)' },
};

// Selector de mesas para el mesero: solo son "clickeables" las mesas
// disponibles (para iniciar un pedido nuevo) o las ocupadas (para
// consultar/continuar el pedido abierto). Reservada y en limpieza no
// se pueden seleccionar desde aquí.
export default function MesaSelector({ mesas, onSeleccionar }) {
  if (mesas.length === 0) {
    return <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>No hay mesas registradas. Pide al administrador que las cree en el módulo "Mesas".</div>;
  }

  return (
    <div className="mesa-selector-grid">
      {mesas.map((m) => {
        const meta = ESTADOS[m.estado] || ESTADOS.disponible;
        const seleccionable = m.estado === 'disponible' || (m.estado === 'ocupada' && m.pedidoActivo);
        return (
          <button
            key={m._id}
            className="mesa-selector-card"
            disabled={!seleccionable}
            onClick={() => onSeleccionar(m)}
            style={{ borderColor: meta.color }}
          >
            <div className="mesa-selector-numero">Mesa {m.numero}</div>
            {m.nombre && <div className="mesa-selector-nombre">{m.nombre}</div>}
            <span className="badge" style={{ background: meta.color, marginTop: 6 }}>{meta.label}</span>
            {m.estado === 'ocupada' && seleccionable && (
              <div className="mesa-selector-hint">Toca para ver / continuar</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
