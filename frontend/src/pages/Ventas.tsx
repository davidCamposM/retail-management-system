import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProductos, createVenta, type Producto, type MetodoPago } from '../lib/api'

const CATEGORIAS = ['Todas', 'Electronics', 'Clothing', 'Beauty', 'Home']
const STORE_REGION = 'Metropolitana'

const DESCUENTOS = [0, 0.05, 0.1]

const METODOS_PAGO: { label: string; value: MetodoPago }[] = [
  { label: 'Efectivo', value: 'COD' },
  { label: 'Tarjeta', value: 'CARD' },
  { label: 'Transferencia', value: 'WALLET' },
]

interface CartItem {
  producto: Producto
  cantidad: number
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CL')}`
}

export default function Ventas() {
  const { token } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [categoria, setCategoria] = useState('Todas')
  const [cart, setCart] = useState<CartItem[]>([])
  const [descuento, setDescuento] = useState(0)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('CARD')
  const [loading, setLoading] = useState(true)
  const [cobrando, setCobrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!token) return
      setLoading(true)
      try {
        const data = await getProductos(token, {
          categoria: categoria !== 'Todas' ? categoria : undefined,
        })
        setProductos(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, categoria])

  function addToCart(producto: Producto) {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id)
      if (existing) {
        if (existing.cantidad >= producto.stock) return prev
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function removeFromCart(productoId: number) {
    setCart((prev) => prev.filter((item) => item.producto.id !== productoId))
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.producto.precioUnitario * item.cantidad,
    0
  )
  const total = subtotal * (1 - descuento)

  async function handleCobrar() {
    if (!token || cart.length === 0) return
    setError(null)
    setCobrando(true)
    try {
      for (const item of cart) {
        await createVenta(token, {
          productoId: item.producto.id,
          cantidad: item.cantidad,
          descuento,
          metodoPago,
          region: STORE_REGION,
        })
      }
      setCart([])
      setDescuento(0)
      const data = await getProductos(token, {
        categoria: categoria !== 'Todas' ? categoria : undefined,
      })
      setProductos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la venta')
    } finally {
      setCobrando(false)
    }
  }

  return (
    <div className="px-8 py-8 flex gap-6">
      <div className="flex-1">
        <h1 className="font-serif text-2xl text-cream-50 mb-6">Nueva venta</h1>

        <div className="flex gap-2 flex-wrap mb-6">
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

        {loading ? (
          <p className="text-sage-400">Cargando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {productos.map((p) => {
              const enCarrito = cart.find((item) => item.producto.id === p.id)
              const disponible = p.stock - (enCarrito?.cantidad ?? 0)
              return (
                <div key={p.id} className="bg-forest-900 border border-forest-800 rounded-md p-4">
                  <img src={p.imagenUrl ?? undefined} alt={p.nombre} className="w-full h-28 object-cover rounded mb-3" />
                  <p className="text-cream-50 text-sm font-medium mb-1">{p.nombre}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-400 text-sm">{formatCurrency(p.precioUnitario)}</span>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={disponible <= 0}
                      className="w-7 h-7 flex items-center justify-center border border-gold-500 text-gold-500 rounded-md hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold-500"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="w-80 shrink-0 bg-forest-900 border border-forest-800 rounded-md p-5 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-cream-50">Venta actual</h2>
          <span className="text-sage-400 text-sm">{cart.length} items</span>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-sage-400 text-sm mb-4">Agrega productos del catálogo para comenzar.</p>
        ) : (
          <div className="space-y-3 mb-5">
            {cart.map((item) => (
              <div key={item.producto.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-cream-50">{item.producto.nombre}</p>
                  <p className="text-sage-400">
                    {item.cantidad} × {formatCurrency(item.producto.precioUnitario)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.producto.id)}
                  className="text-rose-500 hover:text-rose-400 text-xs"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <p className="text-sage-400 text-sm mb-2">Descuento</p>
          <div className="flex gap-2">
            {DESCUENTOS.map((d) => (
              <button
                key={d}
                onClick={() => setDescuento(d)}
                className={`flex-1 py-1.5 rounded-full text-sm border transition-colors ${
                  descuento === d
                    ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                    : 'border-forest-800 text-sage-400 hover:border-sage-400'
                }`}
              >
                {d * 100}%
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sage-400 text-sm mb-2">Pago</p>
          <div className="flex gap-2 flex-wrap">
            {METODOS_PAGO.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetodoPago(m.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  metodoPago === m.value
                    ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                    : 'border-forest-800 text-sage-400 hover:border-sage-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-forest-800 pt-4 mb-4">
          <div className="flex items-center justify-between text-sm text-sage-400 mb-1">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-cream-50 text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          onClick={handleCobrar}
          disabled={cart.length === 0 || cobrando}
          className="w-full border border-gold-500 text-gold-500 rounded-md py-3 hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold-500"
        >
          {cobrando ? 'Procesando...' : `Cobrar ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  )
}
