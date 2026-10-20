import { TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

/** Erro geral do formulário (ex.: credenciais inválidas), anunciado a leitores de tela. */
export function FormAlert({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null
  return (
    <p role="alert" className={cn("flex items-start gap-2 rounded-xs border border-coral/60 bg-coral/10 px-3 py-2 text-[13px] leading-5 text-cream", className)}>
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden="true" />
      {message}
    </p>
  )
}
