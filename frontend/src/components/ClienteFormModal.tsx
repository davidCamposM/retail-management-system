import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { createCliente, getErrorMessage, type Cliente } from '../lib/api'

interface Props {
  nombreInicial?: string
  onCreated: (cliente: Cliente) => void
  onCancel: () => void
}

export default function ClienteFormModal({ nombreInicial = '', onCreated, onCancel }: Props) {
  const { token } = useAuth()
  const [nombre, setNombre] = useState(nombreInicial)
  const [edad, setEdad] = useState('')
  const [genero, setGenero] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const cliente = await createCliente(token, {
        nombre: nombre.trim(),
        edad: Number(edad),
        genero,
        region: region || undefined,
      })
      onCreated(cliente)
    } catch (err) {
      setError(getErrorMessage(err, 'Error al crear cliente'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative bg-forest-900 border border-forest-800 rounded-xl p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="font-serif text-lg text-cream-50 mb-1">Nuevo cliente</h2>
        <p className="text-sage-400 text-sm mb-5">
          Nombre, edad y género son obligatorios — la región es opcional.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-cream-50 mb-1 text-sm">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
              placeholder="Nombre completo"
              className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 placeholder-sage-400 text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-cream-50 mb-1 text-sm">Edad</label>
              <input
                type="number"
                min={0}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                required
                placeholder="Edad"
                className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 placeholder-sage-400 text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-cream-50 mb-1 text-sm">Género</label>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                required
                className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 text-sm focus:outline-none focus:border-gold-500"
              >
                <option value="" disabled>Selecciona</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-cream-50 mb-1 text-sm">Región</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-forest-950 border border-forest-800 rounded-md px-3 py-2 text-cream-50 placeholder-sage-400 text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !nombre.trim() || !edad || !genero}
            className="flex-1 border border-gold-500 text-gold-500 rounded-md py-2.5 text-sm font-medium hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear cliente'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-forest-800 text-cream-50 rounded-md py-2.5 text-sm hover:border-sage-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
