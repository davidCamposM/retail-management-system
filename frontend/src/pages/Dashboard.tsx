import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-forest-950 flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-3xl text-cream-50 mb-4">
        Bienvenido a RetailOps
      </h1>
      <p className="text-sage-400 mb-8">Sesión iniciada correctamente.</p>
      <button
        onClick={logout}
        className="border border-gold-500 text-gold-500 rounded-md px-6 py-3 hover:bg-gold-500 hover:text-forest-950 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  )
}