import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getVentas, getUsuarios, getErrorMessage, type Venta, type Usuario } from '../lib/api'
import ErrorState from '../components/ErrorState'
import Skeleton from '../components/Skeleton'

const METODO_PAGO_LABEL: Record<string, string> = {
  COD: 'Efectivo',
  CARD: 'Tarjeta',
  WALLET: 'Transferencia',
}

const REGIONES = ['East', 'North', 'South', 'West', 'Metropolitana']
const PAGE_SIZE = 25

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CL')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL')
}

export default function Historial() {
  const { token, role } = useAuth()
  const isAdmin = role === 'ADMIN'

  const [ventas, setVentas] = useState<Venta[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce: espera 400ms sin escribir antes de disparar la búsqueda al backend.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Cualquier cambio de filtro vuelve a la página 1.
  useEffect(() => {
    setPage(1)
  }, [search, fechaDesde, fechaHasta, vendedorId, region])

  useEffect(() => {
    if (isAdmin && token) {
      getUsuarios(token).then(setUsuarios).catch(() => {})
    }
  }, [isAdmin, token])

  useEffect(() => {
    let cancelado = false

    async function load() {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const result = await getVentas(token, {
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          vendedorId: vendedorId ? Number(vendedorId) : undefined,
          region: region || undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
        // Si mientras esta petición estaba en vuelo se disparó un filtro nuevo,
        // esta respuesta ya está obsoleta — se descarta para no pisar el estado actual.
        if (cancelado) return
        setVentas(result.data)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } catch (err) {
        if (!cancelado) {
          setError(getErrorMessage(err, 'Error inesperado al cargar el historial'))
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    load()
    return () => {
      cancelado = true
    }
  }, [token, fechaDesde, fechaHasta, vendedorId, region, search, page, reloadKey])

  function handleExportar() {
    const header = ['Fecha', 'Cliente', 'Vendedor', 'Región', 'Pago', 'Total']
    const rows = ventas.map((v) => [
      formatDate(v.fecha),
      v.cliente?.nombre ?? 'Sin registrar',
      v.vendedor.email,
      v.region,
      METODO_PAGO_LABEL[v.metodoPago] ?? v.metodoPago,
      v.montoTotal.toString(),
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-ventas-pagina-${page}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-serif text-2xl text-cream-50">Historial de ventas</h1>
        <button
          onClick={handleExportar}
          disabled={ventas.length === 0}
          className="border border-forest-800 text-cream-50 rounded-md px-4 py-2 text-sm hover:border-gold-500 transition-colors disabled:opacity-40"
        >
          Exportar página
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar cliente o vendedor..."
          className="flex-1 min-w-[200px] bg-forest-900 border border-forest-800 rounded-md px-4 py-2 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
        />
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
        />
        {isAdmin && (
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
          >
            <option value="">Todos los vendedores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
        )}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
        >
          <option value="">Todas las regiones</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-forest-900 border border-forest-800 rounded-md p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1 max-w-[160px]" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <>
          <div className="bg-forest-900 border border-forest-800 rounded-md overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-800 text-left">
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Cliente</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Vendedor</th>
                  )}
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Región</th>
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Pago</th>
                  <th className="px-4 py-3 text-sage-400 font-normal uppercase text-xs tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sage-400">
                      No hay ventas que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-forest-800 last:border-0">
                    <td className="px-4 py-3 text-cream-50 whitespace-nowrap">{formatDate(v.fecha)}</td>
                    <td className="px-4 py-3 text-sage-400 whitespace-nowrap">{v.cliente?.nombre ?? 'Sin registrar'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sage-400 whitespace-nowrap">{v.vendedor.email}</td>
                    )}
                    <td className="px-4 py-3 text-sage-400 whitespace-nowrap">{v.region}</td>
                    <td className="px-4 py-3 text-sage-400 whitespace-nowrap">{METODO_PAGO_LABEL[v.metodoPago] ?? v.metodoPago}</td>
                    <td className="px-4 py-3 text-cream-50 whitespace-nowrap">{formatCurrency(v.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <p className="text-sage-400 text-sm">
                {total.toLocaleString('es-CL')} ventas — página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 flex items-center justify-center border border-forest-800 text-cream-50 rounded-md hover:border-gold-500 transition-colors disabled:opacity-30"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-9 h-9 flex items-center justify-center border border-forest-800 text-cream-50 rounded-md hover:border-gold-500 transition-colors disabled:opacity-30"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
