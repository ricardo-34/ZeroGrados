import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Alert, Modal, Field, Empty } from '../components/UI.jsx';

const VACIO = { nombre: '', telefono: '', email: '', direccion: '' };

export default function Clientes() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = async () => {
    try {
      const res = await api.get('/clientes');
      setItems(res.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = items.filter(
    (c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (c.telefono || '').includes(busqueda)
  );

  const guardar = async () => {
    setError('');
    try {
      if (modal._id) await api.put(`/clientes/${modal._id}`, modal);
      else await api.post('/clientes', modal);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>+ Cliente</button>
      </div>
      <Alert type="error">{error}</Alert>

      <div className="card">
        <input className="input mb" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {filtrados.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th></th></tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c._id}>
                    <td>{c.nombre}</td>
                    <td>{c.telefono || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td className="text-muted">{c.direccion || '—'}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-outline btn-sm" onClick={() => setModal({ ...c })}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(c._id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal._id ? 'Editar cliente' : 'Nuevo cliente'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <Field label="Nombre"><input className="input" value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input" value={modal.telefono} onChange={(e) => setModal({ ...modal, telefono: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></Field>
          <Field label="Dirección"><input className="input" value={modal.direccion} onChange={(e) => setModal({ ...modal, direccion: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
