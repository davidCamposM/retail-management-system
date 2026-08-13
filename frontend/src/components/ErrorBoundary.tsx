import { Component, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Error no controlado:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-forest-950 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-5">
            <AlertOctagon size={26} className="text-rose-500" />
          </div>
          <h1 className="font-serif text-2xl text-cream-50 mb-2">Algo salió mal</h1>
          <p className="text-sage-400 text-sm mb-6 max-w-sm">
            Ocurrió un error inesperado. Intenta recargar la página; si el problema persiste, contacta a soporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="border border-gold-500 text-gold-500 rounded-md px-5 py-2.5 text-sm hover:bg-gold-500 hover:text-forest-950 transition-colors"
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
