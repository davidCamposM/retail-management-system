import { useEffect, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ProductoForm from '../components/ProductoForm'
import ErrorState from '../components/ErrorState'
import Skeleton from '../components/Skeleton'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getErrorMessage,
  type Producto,
  type ProductoInput,
} from '../lib/api'

const CATEGORIAS = ['Todas', 'Electrónica', 'Ropa', 'Belleza', 'Hogar']

export default function Productos() {
  const { token, role } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isAdmin = role === 'ADMIN'
  const sinFiltros = !search && categoria === 'Todas'

  // Evita que una respuesta vieja (de una búsqueda/filtro ya reemplazado) pise el estado actual.
  const requestId = useRef(0)

  async function load() {
    if (!token) return
    const currentRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await getProductos(token, {
        search: search || undefined,
        categoria: categoria !== 'Todas' ? categoria : undefined,
      })
      if (currentRequest !== requestId.current) return
      setProductos(data)
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(getErrorMessage(err, 'Error inesperado al cargar los productos'))
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
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
    setToast('Producto creado correctamente.')
    load()
  }

  async function handleUpdate(data: ProductoInput) {
    if (!token || !editing) return
    await updateProducto(token, editing.id, data)
    setEditing(null)
    setToast('Producto actualizado correctamente.')
    load()
  }

  async function handleConfirmDelete() {
    if (!token || !deleteTarget) return
    await deleteProducto(token, deleteTarget.id)
    setDeleteTarget(null)
    setToast('Producto eliminado.')
    load()
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
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
        <div className="bg-forest-900 border border-forest-800 rounded-md p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 shrink-0" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-4 w-20 hidden sm:block" />
              <Skeleton className="h-4 w-16 hidden sm:block" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : productos.length === 0 && sinFiltros ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-forest-900 border border-forest-800 rounded-md">
          <div className="w-12 h-12 rounded-full bg-forest-800 flex items-center justify-center mb-4">
            <PackageSearch size={22} className="text-sage-400" />
          </div>
          <p className="text-cream-50 font-medium mb-1">Todavía no hay productos</p>
          <p className="text-sage-400 text-sm mb-5 max-w-sm">
            {isAdmin
              ? 'Crea tu primer producto para empezar a vender.'
              : 'Cuando el administrador agregue productos, van a aparecer aquí.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="border border-gold-500 text-gold-500 rounded-md px-4 py-2 text-sm hover:bg-gold-500 hover:text-forest-950 transition-colors"
            >
              + Agregar tu primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-forest-900 border border-forest-800 rounded-md overflow-hidden overflow-x-auto">
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
                  <td className="px-4 py-3 text-cream-50">
                    <div className="flex items-center gap-3">
                      <img src={p.imagenUrl ?? undefined} alt={p.nombre} className="w-10 h-10 rounded object-cover shrink-0" />
                      <span className="whitespace-nowrap">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sage-400 whitespace-nowrap">{p.categoria}</td>
                  <td className="px-4 py-3 text-cream-50 whitespace-nowrap">${p.precioUnitario.toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3 text-cream-50">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      p.stock > 0
                        ? 'bg-teal-500/10 text-teal-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {p.stock > 0 ? 'Disponible' : 'Sin stock'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-4">
                        <button
                          onClick={() => { setEditing(p); setShowForm(false) }}
                          className="text-gold-500 hover:text-gold-400 py-2"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="text-rose-500 hover:text-rose-400 py-2"
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

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Seguro que quieres eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
