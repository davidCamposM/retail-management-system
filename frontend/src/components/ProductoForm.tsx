import { useState, type FormEvent } from 'react'
import type { Producto, ProductoInput } from '../lib/api'

interface Props {
  initial?: Producto
  onSubmit: (data: ProductoInput) => Promise<void>
  onCancel: () => void
}

export default function ProductoForm({ initial, onSubmit, onCancel }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [categoria, setCategoria] = useState(initial?.categoria ?? '')
  const [precioUnitario, setPrecioUnitario] = useState(initial?.precioUnitario ?? 0)
  const [stock, setStock] = useState(initial?.stock ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ nombre, categoria, precioUnitario, stock })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-forest-900 border border-forest-800 rounded-md p-6 space-y-4">
      <h2 className="font-serif text-xl text-cream-50">
        {initial ? 'Editar producto' : 'Nuevo producto'}
      </h2>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-cream-50 mb-1 text-sm">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
        />
      </div>

      <div>
        <label className="block text-cream-50 mb-1 text-sm">Categoría</label>
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
          placeholder="Electrónica, Ropa, Belleza, Hogar"
          className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-cream-50 mb-1 text-sm">Precio unitario</label>
          <input
            type="number"
            value={precioUnitario}
            onChange={(e) => setPrecioUnitario(Number(e.target.value))}
            required
            min={0}
            className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
          />
        </div>
        <div>
          <label className="block text-cream-50 mb-1 text-sm">Stock</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
            min={0}
            className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 border border-gold-500 text-gold-500 rounded-md py-2 hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-forest-800 text-cream-50 rounded-md py-2 hover:border-sage-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}