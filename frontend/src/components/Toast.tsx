import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-forest-900 border border-teal-500 text-cream-50 rounded-md px-4 py-3 shadow-xl animate-[fadeIn_0.15s_ease-out]">
      <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
