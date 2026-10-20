import { useRouterState } from "@tanstack/react-router"
import { useEffect, useRef } from "react"

/**
 * Em navegações da SPA, move o foco para o conteúdo principal (como numa troca de página
 * real), para que leitores de tela anunciem a nova tela e o teclado recomece dali.
 * Mudanças só de search params (filtros, paginação) mantêm o foco onde está.
 */
export function RouteFocus() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    const frame = requestAnimationFrame(() => {
      // Diálogos abertos pela rota (ex.: login) gerenciam o próprio foco.
      if (document.querySelector('[role="dialog"]')) return
      document.getElementById("conteudo")?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return null
}
