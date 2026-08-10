import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginRequest } from '../lib/api'
import { DEFAULT_ROUTE_BY_ROLE } from '../lib/permissions'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { token } = await loginRequest(email, password)
      login(token)

      const payload = JSON.parse(atob(token.split('.')[1]))
      navigate(DEFAULT_ROUTE_BY_ROLE[payload.role as 'ADMIN' | 'VENDEDOR'])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border border-gold-500 flex items-center justify-center mb-4">
            <span className="font-serif text-gold-500 text-xl">R</span>
          </div>
          <h1 className="font-serif text-3xl text-cream-50">RetailOps</h1>
          <p className="text-sage-400 mt-2">Gestión de ventas para pymes retail</p>
        </div>

        <div className="border-t border-forest-800 mb-8" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-cream-50 mb-2 text-sm">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nombre@tuempresa.cl"
              className="w-full bg-forest-900 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-cream-50 mb-2 text-sm">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-forest-900 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-cream-50">
              <input type="checkbox" className="accent-gold-500" />
              Recordarme
            </label>
            <a href="#" className="text-gold-500 hover:text-gold-400">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-gold-500 text-gold-500 rounded-md py-3 font-medium hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}