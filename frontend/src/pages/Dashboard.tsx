const KPIS = [
  { label: 'Ventas totales (mes)', value: '$48.750.000', delta: '+12,4%', positive: true },
  { label: 'Ticket promedio', value: '$38.900', delta: '-1,8%', positive: false },
  { label: 'Ganancia neta', value: '$14.230.000', delta: '+8,7%', positive: true },
  { label: 'Órdenes', value: '1.253', delta: '+5,2%', positive: true },
]

const VENTAS_POR_MES = [
  { mes: 'Mar', valor: 38200000 },
  { mes: 'Abr', valor: 41500000 },
  { mes: 'May', valor: 36800000 },
  { mes: 'Jun', valor: 44100000 },
  { mes: 'Jul', valor: 42300000 },
  { mes: 'Ago', valor: 48750000 },
]

const TOP_PRODUCTOS = [
  { nombre: 'Smartwatch FitPulse 2', monto: 18400000 },
  { nombre: 'Silla Gamer ProSeat', monto: 14200000 },
  { nombre: 'Chaqueta Impermeable TrailTech', monto: 11100000 },
  { nombre: 'Zapatillas Urban Runner', monto: 9800000 },
]

const VENTAS_POR_REGION = [
  { region: 'Metropolitana', porcentaje: 52 },
  { region: 'Valparaíso', porcentaje: 18 },
  { region: 'Biobío', porcentaje: 14 },
  { region: 'Antofagasta', porcentaje: 9 },
  { region: 'Araucanía', porcentaje: 7 },
]

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CL')}`
}

export default function Dashboard() {
  const maxVenta = Math.max(...VENTAS_POR_MES.map((v) => v.valor))
  const maxTopProducto = Math.max(...TOP_PRODUCTOS.map((p) => p.monto))

  return (
    <div className="px-8 py-8">
      <h1 className="font-serif text-2xl text-cream-50 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-forest-900 border border-forest-800 rounded-md p-5">
            <p className="text-sage-400 text-sm mb-2">{kpi.label}</p>
            <p className="text-cream-50 text-2xl font-semibold mb-1">{kpi.value}</p>
            <p className={`text-sm ${kpi.positive ? 'text-teal-500' : 'text-rose-500'}`}>
              {kpi.positive ? '↑' : '↓'} {kpi.delta} vs. mes anterior
            </p>
          </div>
        ))}
      </div>

      <div className="bg-forest-900 border border-forest-800 rounded-md p-6 mb-6">
        <h2 className="font-serif text-lg text-cream-50 mb-6">Ventas por mes</h2>
        <div className="flex items-end justify-between gap-4 h-48">
          {VENTAS_POR_MES.map((v) => (
            <div key={v.mes} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="relative w-full flex justify-center" style={{ height: '160px' }}>
                <div
                  className="absolute bottom-0 w-6 max-w-full rounded-t bg-gold-500 group-hover:bg-gold-400 transition-colors"
                  style={{ height: `${(v.valor / maxVenta) * 100}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-950 border border-forest-800 text-cream-50 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {formatCurrency(v.valor)}
                </div>
              </div>
              <span className="text-sage-400 text-sm">{v.mes}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Top productos</h2>
          <div className="space-y-4">
            {TOP_PRODUCTOS.map((p) => (
              <div key={p.nombre}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{p.nombre}</span>
                  <span className="text-sage-400">{formatCurrency(p.monto)}</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold-500"
                    style={{ width: `${(p.monto / maxTopProducto) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forest-900 border border-forest-800 rounded-md p-6">
          <h2 className="font-serif text-lg text-cream-50 mb-5">Ventas por región</h2>
          <div className="space-y-4">
            {VENTAS_POR_REGION.map((r) => (
              <div key={r.region}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-cream-50">{r.region}</span>
                  <span className="text-sage-400">{r.porcentaje}%</span>
                </div>
                <div className="h-2 rounded-full bg-forest-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold-500"
                    style={{ width: `${r.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
