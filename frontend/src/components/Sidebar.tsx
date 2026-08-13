import { NavLink } from 'react-router-dom'
import { LayoutGrid, Package, ShoppingCart, Clock, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROUTES_BY_ROLE } from '../lib/permissions'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: '/productos', label: 'Productos', icon: Package },
  { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { path: '/historial', label: 'Historial', icon: Clock },
]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { role, logout } = useAuth()
  const allowedPaths = role ? ROUTES_BY_ROLE[role] : []
  const visibleItems = NAV_ITEMS.filter((item) => allowedPaths.includes(item.path))

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-forest-950 border-r border-forest-800 flex flex-col justify-between py-6 transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          <div className="px-6 mb-8 flex items-center justify-between">
            <span className="font-serif text-gold-500 text-xl">RetailOps</span>
            <button
              onClick={onClose}
              className="lg:hidden text-sage-400 hover:text-cream-50"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {visibleItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-forest-800 text-gold-500'
                      : 'text-cream-50 hover:bg-forest-900'
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-6 pt-4 border-t border-forest-800">
          <p className="text-sage-400 text-xs uppercase tracking-wide mb-3">
            {role ? ROLE_LABEL[role] : ''}
          </p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sage-400 hover:text-gold-500 text-sm transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
