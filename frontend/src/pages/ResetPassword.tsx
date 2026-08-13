import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordRequest, getErrorMessage } from '../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!token) {
      setError('El link de recuperación no es válido')
      return
    }

    setLoading(true)
    try {
      await resetPasswordRequest(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'Error inesperado'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
        <div className="w-full max-w-md bg-forest-900 border border-forest-800 rounded-2xl p-8 shadow-xl text-center">
          <h1 className="font-serif text-2xl text-cream-50 mb-2">Link inválido</h1>
          <p className="text-sage-400 text-sm mb-6">
            Este link de recuperación no es válido. Solicita uno nuevo.
          </p>
          <Link to="/forgot-password" className="text-gold-500 hover:text-gold-400 text-sm">
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
      <div className="w-full max-w-md bg-forest-900 border border-forest-800 rounded-2xl p-8 shadow-xl">
        <h1 className="font-serif text-2xl text-cream-50 mb-2">Nueva contraseña</h1>
        <p className="text-sage-400 text-sm mb-8">Ingresa tu nueva contraseña.</p>

        {success ? (
          <div className="bg-teal-500/10 border border-teal-500 text-teal-500 rounded-md px-4 py-3 text-sm">
            Contraseña actualizada. Redirigiendo al login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-cream-50 mb-2 text-sm">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-forest-950 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-cream-50 mb-2 text-sm">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-forest-950 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-gold-500 text-gold-500 rounded-md py-3 font-medium hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
