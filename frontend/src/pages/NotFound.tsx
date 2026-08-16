import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_ROUTE_BY_ROLE } from '../lib/permissions'

export default function NotFound() {
  const { isAuthenticated, role } = useAuth()
  const backTo = isAuthenticated && role ? DEFAULT_ROUTE_BY_ROLE[role] : '/login'

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4">
      <div className="w-full max-w-md bg-forest-900 border border-forest-800 rounded-2xl p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-full bg-forest-800 flex items-center justify-center mx-auto mb-5">
          <Compass size={26} className="text-gold-500" />
        </div>
        <h1 className="font-serif text-2xl text-cream-50 mb-2">Página no encontrada</h1>
        <p className="text-sage-400 text-sm mb-6">
          La página que buscas no existe o la URL está mal escrita.
        </p>
        <Link
          to={backTo}
          className="inline-block border border-gold-500 text-gold-500 rounded-md px-5 py-2.5 text-sm hover:bg-gold-500 hover:text-forest-950 transition-colors"
        >
          {isAuthenticated ? 'Volver a RetailOps' : 'Ir al login'}
        </Link>
      </div>
    </div>
  )
}
