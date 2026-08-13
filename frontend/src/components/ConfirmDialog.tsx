interface Props {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-forest-900 border border-forest-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-serif text-lg text-cream-50 mb-2">{title}</h2>
        <p className="text-sage-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
              danger
                ? 'border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-forest-950'
                : 'border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-forest-950'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-forest-800 text-cream-50 rounded-md py-2.5 text-sm hover:border-sage-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
