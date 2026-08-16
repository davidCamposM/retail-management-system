import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDashboard, getErrorMessage, type DashboardData } from '../lib/api'
import ErrorState from '../components/ErrorState'
import Skeleton from '../components/Skeleton'

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`
}

function primerDiaDelMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [fechaDesde, setFechaDesde] = useState(primerDiaDelMes())
  const [fechaHasta, setFechaHasta] = useState(hoy())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [barraActiva, setBarraActiva] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    async function load() {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const result = await getDashboard(token, { fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
        if (cancelado) return
        setData(result)
      } catch (err) {
        if (!cancelado) {
          setError(getErrorMessage(err, 'Error inesperado al cargar el dashboard'))
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    load()
    return () => {
      cancelado = true
    }
  }, [token, fechaDesde, fechaHasta, reloadKey])

  if (loading) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-forest-900 border border-forest-800 rounded-md p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="bg-forest-900 border border-forest-800 rounded-md p-6 mb-6">
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-forest-900 border border-forest-800 rounded-md p-6">
              <Skeleton className="h-5 w-32 mb-5" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <ErrorState message={error ?? undefined} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    )
  }

  const KPIS = [
    { label: 'Ventas totales', value: formatCurrency(data.kpis.ventasTotales), delta: data.kpis.ventasTotalesDelta },
    { label: 'Ticket promedio', value: formatCurrency(data.kpis.ticketPromedio), delta: data.kpis.ticketPromedioDelta },
    { label: 'Ganancia neta', value: formatCurrency(data.kpis.gananciaNeta), delta: null },
    { label: 'Órdenes', value: data.kpis.ordenes.toLocaleString('es-CL'), delta: data.kpis.ordenesDelta },
  ]

  const maxVenta = Math.max(...data.ventasPorMes.map((v) => v.valor), 1)
  const maxTopProducto = Math.max(...data.topProductos.map((p) => p.monto), 1)

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-serif text-2xl text-cream-50">Dashboard</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 text-sm focus:outline-none focus:border-gold-500"
          />
          <span className="text-sage-400 text-sm">a</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="bg-forest-900 border border-forest-800 rounded-md px-3 py-2 text-cream-50 text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-forest-900 border border-forest-800 rounded-md p-5">
            <p className="text-sage-400 text-sm mb-2">{kpi.label}</p>
            <p className="text-cream-50 text-2xl font-semibold mb-1">{kpi.value}</p>
            {kpi.delta !== null && (
              <p className={`text-sm ${kpi.delta >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                {kpi.delta >= 0 ? '↑' : '↓'} {Math.abs(kpi.delta).toFixed(1)}% vs. período anterior
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-forest-900 border border-forest-800 rounded-md p-6 mb-6">
        <h2 className="font-serif text-lg text-cream-50 mb-6">Ventas por mes</h2>
        <div className="flex items-end justify-between gap-4 h-48">
          {data.ventasPorMes.map((v) => {
            const activa = barraActiva === v.mes
            return (
              <button
                key={v.mes}
                type="button"
                onMouseEnter={() => setBarraActiva(v.mes)}
                onMouseLeave={() => setBarraActiva(null)}
                onClick={() => setBarraActiva(activa ? null : v.mes)}
                aria-label={`Ventas de ${v.mes}: ${formatCurrency(v.valor)}`}
                className="flex-1 flex flex-col items-center gap-2 relative bg-transparent border-0 cursor-pointer"
              >
                <div className="relative w-full flex justify-center" style={{ height: '160px' }}>
                  <div
                    className={`absolute bottom-0 w-6 max-w-full rounded-t transition-colors ${
                      activa ? 'bg-gold-400' : 'bg-gold-500'
                    }`}
                    style={{ height: `${(v.valor / maxVenta) * 100}%` }}
                  />
                  <div
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-950 border border-forest-800 text-cream-50 text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity ${
                      activa ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {formatCurrency(v.valor)}
                  </div>
                </div>
                <span className="text-sage-400 text-sm">{v.mes}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Top productos</h2>
          <div className="space-y-4">
            {data.topProductos.map((p) => (
              <div key={p.nombre}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{p.nombre}</span>
                  <span className="text-sage-400">{formatCurrency(p.monto)}</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${(p.monto / maxTopProducto) * 100}%` }} />
                </div>
              </div>
            ))}
            {data.topProductos.length === 0 && <p className="text-sage-400 text-sm">Sin ventas en este período.</p>}
          </div>
        </div>

        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Ventas por región</h2>
          <div className="space-y-4">
            {data.ventasPorRegion.map((r) => (
              <div key={r.region}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{r.region}</span>
                  <span className="text-sage-400">{r.porcentaje}%</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${r.porcentaje}%` }} />
                </div>
              </div>
            ))}
            {data.ventasPorRegion.length === 0 && <p className="text-sage-400 text-sm">Sin ventas en este período.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Margen por categoría</h2>
          <div className="space-y-4">
            {data.margenPorCategoria.map((m) => (
              <div key={m.categoria}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{m.categoria}</span>
                  <span className="text-sage-400">{m.margen}%</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${m.margen}%` }} />
                </div>
              </div>
            ))}
            {data.margenPorCategoria.length === 0 && <p className="text-sage-400 text-sm">Sin ventas en este período.</p>}
          </div>
        </div>

        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Demografía de clientes (por edad)</h2>
          <div className="space-y-4">
            {data.demografiaClientes.map((d) => (
              <div key={d.rango}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{d.rango} años</span>
                  <span className="text-sage-400">{d.porcentaje}%</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${d.porcentaje}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}