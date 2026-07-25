import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { money } from '../utils/format.js';
import { Alert, Modal, Field, Empty } from '../components/UI.jsx';

const VACIO = { nombre: '', nit: '', telefono: '', direccion: '' };

export default function Proveedores() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = async () => {
    try {
      const res = await api.get('/proveedores');
      setItems(res.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    setError('');
    try {
      if (modal._id) await api.put(`/proveedores/${modal._id}`, modal);
      else await api.post('/proveedores', modal);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar proveedor?')) return;
    try {
      await api.delete(`/proveedores/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb">
        <h1>Proveedores</h1>
        <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>+ Proveedor</button>
      </div>
      <Alert type="error">{error}</Alert>

      <div className="card">
        {items.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Nombre</th><th>NIT</th><th>Teléfono</th><th className="text-right">Estado de cuenta</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td>{p.nit || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td className={`text-right ${p.estadoCuenta > 0 ? 'text-danger' : ''}`}>
                      {money(p.estadoCuenta)}
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-outline btn-sm" onClick={() => setModal({ ...p })}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(p._id)}>✕</button>
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
          title={modal._id ? 'Editar proveedor' : 'Nuevo proveedor'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <Field label="Nombre"><input className="input" value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} /></Field>
          <Field label="NIT"><input className="input" value={modal.nit} onChange={(e) => setModal({ ...modal, nit: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input" value={modal.telefono} onChange={(e) => setModal({ ...modal, telefono: e.target.value })} /></Field>
          <Field label="Dirección"><input className="input" value={modal.direccion} onChange={(e) => setModal({ ...modal, direccion: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
