import * as React from "react"

type FocusHandler = (event: Event) => void

/**
 * Devolve o foco ao elemento que abriu o diálogo ao fechá-lo. O Radix só faz isso
 * quando o diálogo é aberto por um `Trigger`; aqui também funciona com diálogos
 * controlados (abertos por estado, rota ou atalho).
 */
export function useReturnFocus(onOpenAutoFocus?: FocusHandler, onCloseAutoFocus?: FocusHandler) {
  const returnTo = React.useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: (event: Event) => {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      if (event.defaultPrevented) return
      const target = returnTo.current
      if (target && target.isConnected && target !== document.body) {
        event.preventDefault()
        target.focus()
      }
    },
  }
}
