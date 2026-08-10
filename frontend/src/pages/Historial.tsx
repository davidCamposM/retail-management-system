import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getVentas, getUsuarios, type Venta, type Usuario } from '../lib/api'

const METODO_PAGO_LABEL: Record<string, string> = {
  COD: 'Efectivo',
  CARD: 'Tarjeta',
  WALLET: 'Transferencia',
}

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
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [search, setSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin && token) {
      getUsuarios(token).then(setUsuarios).catch(() => {})
    }
  }, [isAdmin, token])

  useEffect(() => {
    async function load() {
      if (!token) return
      setLoading(true)
      try {
        const data = await getVentas(token, {
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          vendedorId: vendedorId ? Number(vendedorId) : undefined,
          region: region || undefined,
        })
        setVentas(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, fechaDesde, fechaHasta, vendedorId, region])

  const regionesDisponibles = useMemo(
    () => Array.from(new Set(ventas.map((v) => v.region))).sort(),
    [ventas]
  )

  const ventasFiltradas = useMemo(() => {
    if (!search.trim()) return ventas
    const term = search.toLowerCase()
    return ventas.filter(
      (v) =>
        v.cliente?.nombre.toLowerCase().includes(term) ||
        v.vendedor.email.toLowerCase().includes(term)
    )
  }, [ventas, search])

  function handleExportar() {
    const header = ['Fecha', 'Cliente', 'Vendedor', 'Región', 'Pago', 'Total']
    const rows = ventasFiltradas.map((v) => [
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
    link.download = `historial-ventas-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-cream-50">Historial de ventas</h1>
        <button
          onClick={handleExportar}
          disabled={ventasFiltradas.length === 0}
          className="border border-forest-800 text-cream-50 rounded-md px-4 py-2 text-sm hover:border-gold-500 transition-colors disabled:opacity-40"
        >
          Exportar
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          {regionesDisponibles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sage-400">Cargando...</p>
      ) : (
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
              {ventasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sage-400">
                    No hay ventas que coincidan con los filtros.
                  </td>
                </tr>
              )}
              {ventasFiltradas.map((v) => (
                <tr key={v.id} className="border-b border-forest-800 last:border-0">
                  <td className="px-4 py-3 text-cream-50">{formatDate(v.fecha)}</td>
                  <td className="px-4 py-3 text-sage-400">{v.cliente?.nombre ?? 'Sin registrar'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sage-400">{v.vendedor.email}</td>
                  )}
                  <td className="px-4 py-3 text-sage-400">{v.region}</td>
                  <td className="px-4 py-3 text-sage-400">{METODO_PAGO_LABEL[v.metodoPago] ?? v.metodoPago}</td>
                  <td className="px-4 py-3 text-cream-50">{formatCurrency(v.montoTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
