import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProductoForm from '../components/ProductoForm'
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  type Producto,
  type ProductoInput,
} from '../lib/api'

const CATEGORIAS = ['Todas', 'Electronics', 'Clothing', 'Beauty', 'Home']

export default function Productos() {
  const { token, role } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [showForm, setShowForm] = useState(false)

  const isAdmin = role === 'ADMIN'

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const data = await getProductos(token, {
        search: search || undefined,
        categoria: categoria !== 'Todas' ? categoria : undefined,
      })
      setProductos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoria])

  async function handleCreate(data: ProductoInput) {
    if (!token) return
    await createProducto(token, data)
    setShowForm(false)
    load()
  }

  async function handleUpdate(data: ProductoInput) {
    if (!token || !editing) return
    await updateProducto(token, editing.id, data)
    setEditing(null)
    load()
  }

  async function handleDelete(id: number) {
    if (!token) return
    if (!confirm('¿Eliminar este producto?')) return
    await deleteProducto(token, id)
    load()
  }

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cream-50">Productos</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setEditing(null) }}
            className="border border-gold-500 text-gold-500 rounded-md px-4 py-2 text-sm hover:bg-gold-500 hover:text-forest-950 transition-colors"
          >
            + Nuevo producto
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 bg-forest-900 border border-forest-800 rounded-md px-4 py-2 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                categoria === c
                  ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                  : 'border-forest-800 text-sage-400 hover:border-sage-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {(showForm || editing) && isAdmin && (
        <div className="mb-6">
          <ProductoForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sage-400">Cargando...</p>
      ) : (
        <div className="bg-forest-900 border border-forest-800 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-800 text-left">
                <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Producto</th>
                <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Categoría</th>
                <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Precio</th>
                <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Stock</th>
                <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Estado</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sage-400">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-forest-800 last:border-0">
                  <td className="px-4 py-3 text-cream-50 flex items-center gap-3">
                    <img src={p.imagenUrl ?? undefined} alt={p.nombre} className="w-10 h-10 rounded object-cover" />
                    {p.nombre}
                  </td>
                  <td className="px-4 py-3 text-sage-400">{p.categoria}</td>
                  <td className="px-4 py-3 text-cream-50">${p.precioUnitario.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3 text-cream-50">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.stock > 0
                        ? 'bg-teal-500/10 text-teal-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {p.stock > 0 ? 'Disponible' : 'Sin stock'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setEditing(p); setShowForm(false) }}
                          className="text-gold-500 hover:text-gold-400"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-rose-500 hover:text-rose-400"
                        >
                          Eliminar
                        </button>
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
  )
}