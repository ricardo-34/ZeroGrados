import { useState } from 'react';

const ESTADOS = {
  disponible: { label: 'Disponible', color: 'var(--verde-esmeralda)' },
  ocupada: { label: 'Ocupada', color: 'var(--rojo)' },
  reservada: { label: 'Reservada', color: 'var(--ambar)' },
  limpieza: { label: 'En limpieza', color: 'var(--azul)' },
};

// Selector de mesas para el mesero como LISTA DESPLEGABLE.
// Solo son seleccionables las mesas disponibles (para iniciar un pedido
// nuevo) o las ocupadas con pedido activo (para consultar/continuar la
// cuenta abierta). Reservada y en limpieza aparecen deshabilitadas.
export default function MesaSelector({ mesas, onSeleccionar }) {
  const [seleccion, setSeleccion] = useState('');

  if (mesas.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 24, textAlign: 'center' }}>
        No hay mesas registradas. Pide al administrador que las cree en el módulo "Mesas".
      </div>
    );
  }

  const esSeleccionable = (m) =>
    m.estado === 'disponible' || (m.estado === 'ocupada' && m.pedidoActivo);

  const confirmar = () => {
    const mesa = mesas.find((m) => m._id === seleccion);
    if (mesa && esSeleccionable(mesa)) onSeleccionar(mesa);
  };

  const mesaElegida = mesas.find((m) => m._id === seleccion);
  const meta = mesaElegida ? ESTADOS[mesaElegida.estado] || ESTADOS.disponible : null;

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="field">
        <label>Mesa</label>
        <select
          className="select"
          value={seleccion}
          onChange={(e) => setSeleccion(e.target.value)}
        >
          <option value="">— Selecciona una mesa —</option>
          {mesas.map((m) => {
            const info = ESTADOS[m.estado] || ESTADOS.disponible;
            const seleccionable = esSeleccionable(m);
            const nombre = m.nombre ? ` — ${m.nombre}` : '';
            return (
              <option key={m._id} value={m._id} disabled={!seleccionable}>
                Mesa {m.numero}{nombre} · {info.label}
                {m.estado === 'ocupada' && seleccionable ? ' (continuar cuenta)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {mesaElegida && (
        <div className="flex items-center gap-sm mb" style={{ fontSize: 13 }}>
          <span className="badge" style={{ background: meta.color }}>{meta.label}</span>
          {mesaElegida.estado === 'ocupada' && esSeleccionable(mesaElegida) && (
            <span className="text-muted">Tiene una cuenta abierta — podrás continuarla.</span>
          )}
        </div>
      )}

      <button
        className="btn btn-primary btn-block"
        onClick={confirmar}
        disabled={!mesaElegida || !esSeleccionable(mesaElegida)}
      >
        {mesaElegida && mesaElegida.estado === 'ocupada'
          ? 'Ver / continuar cuenta'
          : 'Seleccionar mesa'}
      </button>
    </div>
  );
}