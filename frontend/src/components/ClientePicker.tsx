import { useEffect, useRef, useState } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { searchClientes, type Cliente } from '../lib/api'
import ClienteFormModal from './ClienteFormModal'

interface Props {
  value: Cliente | null
  onChange: (cliente: Cliente | null) => void
}

export default function ClientePicker({ value, onChange }: Props) {
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [abierto, setAbierto] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  useEffect(() => {
    if (!token || !abierto) return
    let cancelado = false
    const timer = setTimeout(async () => {
      try {
        const data = await searchClientes(token, query)
        if (!cancelado) setResultados(data)
      } catch {
        if (!cancelado) setResultados([])
      }
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [token, query, abierto])

  if (value) {
    return (
      <div className="flex items-center justify-between bg-forest-950 border border-forest-800 rounded-md px-3 py-2">
        <span className="text-cream-50 text-sm truncate">{value.nombre}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar cliente"
          className="text-sage-400 hover:text-rose-500 shrink-0 ml-2"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1" ref={contenedorRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setAbierto(true)}
            placeholder="Buscar cliente (opcional)"
            className="w-full bg-forest-950 border border-forest-800 rounded-md pl-8 pr-3 py-2 text-cream-50 placeholder-sage-400 text-sm focus:outline-none focus:border-gold-500"
          />

          {abierto && (
            <div className="absolute z-10 mt-1 w-full bg-forest-900 border border-forest-800 rounded-md shadow-xl max-h-48 overflow-y-auto">
              {resultados.length > 0 ? (
                resultados.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => {
                      onChange(cliente)
                      setAbierto(false)
                      setQuery('')
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-cream-50 hover:bg-forest-800 transition-colors"
                  >
                    {cliente.nombre}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-sage-400">
                  {query.trim() ? 'Sin coincidencias.' : 'Escribe para buscar...'}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMostrarModal(true)}
          aria-label="Crear cliente nuevo"
          title="Crear cliente nuevo"
          className="w-10 h-10 shrink-0 flex items-center justify-center border border-gold-500 text-gold-500 rounded-md hover:bg-gold-500 hover:text-forest-950 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {mostrarModal && (
        <ClienteFormModal
          nombreInicial={query.trim()}
          onCreated={(cliente) => {
            onChange(cliente)
            setMostrarModal(false)
            setQuery('')
            setAbierto(false)
          }}
          onCancel={() => setMostrarModal(false)}
        />
      )}
    </>
  )
}
