import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginRequest, getErrorMessage } from '../lib/api'
import { DEFAULT_ROUTE_BY_ROLE } from '../lib/permissions'

const CUENTAS_DEMO = [
  { label: 'Admin', email: 'demo.admin@retailops.com', password: 'Demo2026!' },
  { label: 'Vendedor', email: 'vendedor@retailops.com', password: 'vendedor123' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  function usarCuentaDemo(cuenta: typeof CUENTAS_DEMO[number]) {
    setEmail(cuenta.email)
    setPassword(cuenta.password)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { token } = await loginRequest(email, password, remember)
      login(token, remember)

      const payload = JSON.parse(atob(token.split('.')[1]))
      navigate(DEFAULT_ROUTE_BY_ROLE[payload.role as 'ADMIN' | 'VENDEDOR'])

    } catch (err) {
      setError(getErrorMessage(err, 'Error inesperado'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
      <div className="w-full max-w-md bg-forest-900 border border-forest-800 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border border-gold-500 flex items-center justify-center mb-4">
            <span className="font-serif text-gold-500 text-xl">R</span>
          </div>
          <h1 className="font-serif text-3xl text-cream-50">RetailOps</h1>
          <p className="text-sage-400 mt-2">Gestión de Ventas - Pymes Retail</p>
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
              className="w-full bg-forest-950 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
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
              className="w-full bg-forest-950 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-cream-50">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-gold-500"
              />
              Mantener sesión iniciada
            </label>
            <Link to="/forgot-password" className="text-gold-500 hover:text-gold-400">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-gold-500 text-gold-500 rounded-md py-3 font-medium hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="border-t border-forest-800 mt-8 pt-6">
          <p className="text-sage-400 text-xs uppercase tracking-wide text-center">
            Cuentas de demostración
          </p>
          <p className="text-sage-400/70 text-xs text-center mb-3">
            Toca una para completar el formulario
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CUENTAS_DEMO.map((cuenta) => (
              <button
                key={cuenta.email}
                type="button"
                onClick={() => usarCuentaDemo(cuenta)}
                className="text-left bg-forest-950 border border-gold-500/40 rounded-md px-3 py-2.5 shadow-sm hover:border-gold-500 hover:bg-gold-500/10 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-gold-500 text-sm font-medium">{cuenta.label}</p>
                  <LogIn size={14} className="text-gold-500 shrink-0" />
                </div>
                <p className="text-sage-400 text-xs truncate mt-0.5">{cuenta.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
