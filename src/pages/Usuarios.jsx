import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { Alert, Modal, Field, Empty } from '../components/UI.jsx';

const VACIO = { nombre: '', email: '', password: '', rol: 'cajero', activo: true };
const ROLES = ['admin', 'cajero', 'mesero', 'cocina'];

export default function Usuarios() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const cargar = async () => {
    try {
      const res = await api.get('/usuarios');
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
      const payload = { ...modal };
      if (modal._id && !payload.password) delete payload.password;
      if (modal._id) await api.put(`/usuarios/${modal._id}`, payload);
      else await api.post('/usuarios', payload);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Desactivar usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb">
        <h1>Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>+ Usuario</button>
      </div>
      <Alert type="error">{error}</Alert>

      <div className="card">
        {items.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.rol}</td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-completada' : 'badge-cancelado'}`}>
                        {u.activo ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-outline btn-sm" onClick={() => setModal({ ...u, password: '' })}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => eliminar(u._id)}>✕</button>
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
          title={modal._id ? 'Editar usuario' : 'Nuevo usuario'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <Field label="Nombre"><input className="input" value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></Field>
          <Field label={modal._id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}>
            <input className="input" type="password" value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} />
          </Field>
          <div className="grid grid-2">
            <Field label="Rol">
              <select className="select" value={modal.rol} onChange={(e) => setModal({ ...modal, rol: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select className="select" value={modal.activo} onChange={(e) => setModal({ ...modal, activo: e.target.value === 'true' })}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
