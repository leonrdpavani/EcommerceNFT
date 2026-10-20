import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cloneElement, isValidElement, useId, useState } from "react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FieldProps {
  label?: string
  /** Rótulo visível apenas para leitores de tela (campos sem label no layout). */
  srLabel?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean }>
}

/** Campo com label, marcador de obrigatório e mensagem de erro associada (aria-describedby). */
export function FormField({ label, srLabel, required, error, hint, className, children }: FieldProps) {
  const generatedId = useId()
  const id = children.props.id ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span aria-hidden="true" className="text-[22px] leading-[15px] text-coral">
              *
            </span>
          ) : null}
          {required ? <span className="sr-only">(obrigatório)</span> : null}
        </Label>
      ) : srLabel ? (
        <label htmlFor={id} className="sr-only">
          {srLabel}
        </label>
      ) : null}
      {isValidElement(children)
        ? cloneElement(children, {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
            "aria-required": required || undefined,
          })
        : children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-sand">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-[13px] leading-4 text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xs text-taupe transition-colors hover:text-brand-text"
      >
        {visible ? <EyeIcon className="size-5" aria-hidden="true" /> : <EyeOffIcon className="size-5" aria-hidden="true" />}
      </button>
    </div>
  )
}
