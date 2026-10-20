import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

/** Estado de erro de consultas com nova tentativa (sem duplicar operações: só refaz a leitura). */
export function QueryError({
  title = "Não foi possível carregar",
  message,
  onRetry,
  className,
}: {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-4 rounded-lg border border-dashed border-coral/50 px-6 py-14 text-center", className)}
    >
      <TriangleAlertIcon className="size-10 text-coral" aria-hidden="true" />
      <h3 className="text-lg font-bold text-cream">{title}</h3>
      <p className="max-w-[44ch] text-sm leading-6 text-sand">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
