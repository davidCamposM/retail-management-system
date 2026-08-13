import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest, getErrorMessage } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPasswordRequest(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Error inesperado'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
      <div className="w-full max-w-md bg-forest-900 border border-forest-800 rounded-2xl p-8 shadow-xl">
        <h1 className="font-serif text-2xl text-cream-50 mb-2">Recuperar contraseña</h1>
        <p className="text-sage-400 text-sm mb-8">
          Ingresa tu correo y te enviamos un link para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="bg-teal-500/10 border border-teal-500 text-teal-500 rounded-md px-4 py-3 text-sm mb-6">
            Si el correo existe en nuestro sistema, revisa tu bandeja de entrada — te enviamos un link
            de recuperación válido por 1 hora.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500 text-rose-500 rounded-md px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-cream-50 mb-2 text-sm">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nombre@tuempresa.cl"
                className="w-full bg-forest-950 border border-forest-800 rounded-md px-4 py-3 text-cream-50 placeholder-sage-400 focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-gold-500 text-gold-500 rounded-md py-3 font-medium hover:bg-gold-500 hover:text-forest-950 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-sage-400 hover:text-gold-500 text-sm mt-6">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  )
}
