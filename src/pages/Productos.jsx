import { useState, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../utils/format.js';
import { Alert, Modal, Field, Empty } from '../components/UI.jsx';

const VACIO = {
  nombre: '', descripcion: '', categoria: '', codigoBarras: '',
  precioCompra: 0, precioVenta: 0, iva: 0, stock: 0, stockMinimo: 5, activo: true,
  imagenUrl: '', observaciones: '', queIncluye: '', ingredientes: [],
  mediaUrl: '', mediaTipo: '',
};

// Convierte el textarea de ingredientes (uno por línea o separados por coma) en array
const parseIngredientes = (texto) =>
  texto
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter(Boolean);

export default function Productos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [modalCat, setModalCat] = useState(false);
  const [nuevaCat, setNuevaCat] = useState('');

  const cargar = async () => {
    try {
      const [p, c] = await Promise.all([api.get('/productos'), api.get('/categorias')]);
      setProductos(p.data.items);
      setCategorias(c.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = productos.filter(
    (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.codigoBarras || '').includes(busqueda)
  );

  const guardar = async () => {
    setError('');
    try {
      const payload = { ...modal };
      if (!payload.categoria) delete payload.categoria;
      if (modal._id) await api.put(`/productos/${modal._id}`, payload);
      else await api.post('/productos', payload);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const crearCategoria = async () => {
    if (!nuevaCat) return;
    try {
      await api.post('/categorias', { nombre: nuevaCat });
      setNuevaCat('');
      setModalCat(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between mb flex-wrap gap-sm">
        <h1>Productos</h1>
        {esAdmin && (
          <div className="flex gap-sm">
            <button className="btn btn-outline" onClick={() => setModalCat(true)}>+ Categoría</button>
            <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>+ Producto</button>
          </div>
        )}
      </div>
      <Alert type="error">{error}</Alert>

      <div className="card">
        <input
          className="input mb"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {filtrados.length === 0 ? (
          <Empty />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Código</th>
                  <th className="text-right">P. Compra</th>
                  <th className="text-right">P. Venta</th>
                  <th className="text-right">Stock</th>
                  <th>Estado</th>
                  {esAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria?.nombre || '—'}</td>
                    <td className="text-muted">{p.codigoBarras || '—'}</td>
                    <td className="text-right">{money(p.precioCompra)}</td>
                    <td className="text-right">{money(p.precioVenta)}</td>
                    <td className={`text-right ${p.stock <= p.stockMinimo ? 'text-danger' : ''}`}>
                      {p.stock}
                    </td>
                    <td>
                      <span className={`badge ${p.activo ? 'badge-completada' : 'badge-cancelado'}`}>
                        {p.activo ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    {esAdmin && (
                      <td>
                        <div className="flex gap-sm">
                          <button className="btn btn-outline btn-sm" onClick={() => setModal({ ...p, categoria: p.categoria?._id || '' })}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => eliminar(p._id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal._id ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <Field label="Nombre">
            <input className="input" value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} />
          </Field>
          <Field label="Descripción detallada">
            <textarea
              className="input"
              style={{ minHeight: 70, resize: 'vertical' }}
              placeholder="Describe el producto para que el mesero pueda explicarlo al cliente..."
              value={modal.descripcion}
              onChange={(e) => setModal({ ...modal, descripcion: e.target.value })}
            />
          </Field>
          <Field label="Qué incluye">
            <textarea
              className="input"
              style={{ minHeight: 50, resize: 'vertical' }}
              placeholder="Ej: 2 bolas de helado, topping y galleta"
              value={modal.queIncluye}
              onChange={(e) => setModal({ ...modal, queIncluye: e.target.value })}
            />
          </Field>
          <Field label="Ingredientes / características (uno por línea o separados por coma)">
            <textarea
              className="input"
              style={{ minHeight: 50, resize: 'vertical' }}
              placeholder="Ej: Leche, fresa, chocolate, nueces"
              value={(modal.ingredientes || []).join('\n')}
              onChange={(e) => setModal({ ...modal, ingredientes: parseIngredientes(e.target.value) })}
            />
          </Field>
          <Field label="Observaciones">
            <textarea
              className="input"
              style={{ minHeight: 50, resize: 'vertical' }}
              placeholder="Notas internas o recomendaciones (ej: contiene frutos secos)"
              value={modal.observaciones}
              onChange={(e) => setModal({ ...modal, observaciones: e.target.value })}
            />
          </Field>
          <div className="grid grid-2">
            <Field label="Imagen (URL)">
              <input className="input" value={modal.imagenUrl} onChange={(e) => setModal({ ...modal, imagenUrl: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="GIF / animación / video (URL)">
              <input className="input" value={modal.mediaUrl} onChange={(e) => setModal({ ...modal, mediaUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </div>
          {modal.mediaUrl && (
            <Field label="Tipo de media">
              <select className="select" value={modal.mediaTipo} onChange={(e) => setModal({ ...modal, mediaTipo: e.target.value })}>
                <option value="">— Selecciona —</option>
                <option value="imagen">Imagen</option>
                <option value="gif">GIF / animación</option>
                <option value="video">Video corto</option>
              </select>
            </Field>
          )}
          {modal.mediaUrl && (
            <div className="mb" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--gris-borde)' }}>
              {modal.mediaTipo === 'video' ? (
                <video src={modal.mediaUrl} controls style={{ width: '100%', maxHeight: 220, display: 'block' }} />
              ) : (
                <img src={modal.mediaUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              )}
            </div>
          )}
          <div className="grid grid-2">
            <Field label="Categoría">
              <select className="select" value={modal.categoria} onChange={(e) => setModal({ ...modal, categoria: e.target.value })}>
                <option value="">— Ninguna —</option>
                {categorias.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Código de barras">
              <input className="input" value={modal.codigoBarras} onChange={(e) => setModal({ ...modal, codigoBarras: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-2">
            <Field label="Precio compra">
              <input className="input" type="number" value={modal.precioCompra} onChange={(e) => setModal({ ...modal, precioCompra: Number(e.target.value) })} />
            </Field>
            <Field label="Precio venta">
              <input className="input" type="number" value={modal.precioVenta} onChange={(e) => setModal({ ...modal, precioVenta: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="grid grid-3">
            <Field label="IVA %">
              <input className="input" type="number" value={modal.iva} onChange={(e) => setModal({ ...modal, iva: Number(e.target.value) })} />
            </Field>
            <Field label="Stock inicial">
              <input className="input" type="number" value={modal.stock} onChange={(e) => setModal({ ...modal, stock: Number(e.target.value) })} disabled={!!modal._id} />
            </Field>
            <Field label="Stock mínimo">
              <input className="input" type="number" value={modal.stockMinimo} onChange={(e) => setModal({ ...modal, stockMinimo: Number(e.target.value) })} />
            </Field>
          </div>
          {modal._id && (
            <Field label="Estado">
              <select className="select" value={modal.activo} onChange={(e) => setModal({ ...modal, activo: e.target.value === 'true' })}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
          )}
        </Modal>
      )}

      {modalCat && (
        <Modal
          title="Nueva categoría"
          onClose={() => setModalCat(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModalCat(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearCategoria}>Crear</button>
            </>
          }
        >
          <Field label="Nombre de la categoría">
            <input className="input" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} autoFocus />
          </Field>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Existentes: {categorias.map((c) => c.nombre).join(', ') || '—'}
          </div>
        </Modal>
      )}
    </div>
  );
}
