import { useId, useState } from "react"
import { cn } from "cn"

interface PromoCodeFormProps {
  variant?: "desktop" | "mobile"
  onApply: (code: string) => void
  error?: string
  pending?: boolean
  className?: string
}

/**
 * Campo de cupom (Figma: Promo Code / Promo Input).
 * Renderizado como grupo (não <form>) para poder ficar dentro do formulário de pagamento.
 */
export function PromoCodeForm({ variant = "desktop", onApply, error, pending = false, className }: PromoCodeFormProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [code, setCode] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const message = localError ?? error

  function apply() {
    if (!code.trim()) {
      setLocalError("Digite um código promocional.")
      return
    }
    setLocalError(null)
    onApply(code.trim().toUpperCase())
  }

  const isMobile = variant === "mobile"

  return (
    <div role="group" aria-labelledby={`${inputId}-label`} className={cn("flex flex-col gap-2", className)}>
      <label
        id={`${inputId}-label`}
        htmlFor={inputId}
        className={cn(isMobile ? "sr-only" : "text-sm leading-4 font-bold text-cream")}
      >
        Código promocional
      </label>
      <div
        className={cn(
          "flex items-center overflow-hidden focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-text",
          isMobile
            ? "h-[50px] rounded-4xl border border-line bg-surface pl-4 shadow-[0_6px_10px_rgb(10_6_4/0.45)]"
            : "h-10 rounded-xs border border-brand pl-2",
          message && "border-coral"
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              apply()
            }
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-cream uppercase outline-none placeholder:normal-case placeholder:text-taupe",
            isMobile ? "text-[13px]" : "text-xs"
          )}
        />
        <button
          type="button"
          onClick={apply}
          disabled={pending}
          aria-busy={pending}
          className={cn(
            "h-full shrink-0 cursor-pointer font-bold leading-4 transition-[filter] hover:brightness-110 disabled:cursor-progress disabled:opacity-70",
            isMobile
              ? "w-[97px] rounded-4xl bg-[linear-gradient(96deg,rgb(210_138_76/0.54)_1%,#d28a4c_105%)] text-[15px] text-cream"
              : "w-[102px] rounded-r-xs bg-brand text-[15px] text-ink"
          )}
        >
          Aplicar
        </button>
      </div>
      {message ? (
        <p id={errorId} role="alert" className="text-[13px] text-coral">
          {message}
        </p>
      ) : null}
    </div>
  )
}
