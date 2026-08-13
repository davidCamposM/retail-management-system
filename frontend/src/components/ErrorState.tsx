import { AlertTriangle } from 'lucide-react'

interface Props {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertTriangle size={22} className="text-rose-500" />
      </div>
      <p className="text-cream-50 font-medium mb-1">No se pudo completar la solicitud</p>
      <p className="text-sage-400 text-sm mb-5 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="border border-gold-500 text-gold-500 rounded-md px-4 py-2 text-sm hover:bg-gold-500 hover:text-forest-950 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
