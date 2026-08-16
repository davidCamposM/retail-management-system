import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-forest-950 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 border-b border-forest-800 bg-forest-950">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-cream-50 hover:text-gold-500"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="font-serif text-gold-500 text-lg">RetailOps</span>
        </header>

        <main className="flex-1 overflow-y-auto min-w-0 min-h-0">{children}</main>
      </div>
    </div>
  )
}
