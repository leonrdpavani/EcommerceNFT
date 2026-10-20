import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { toast } from "sonner"

import { onSessionRejected } from "@/api/http"
import { clearSession } from "@/features/session/use-session"

/**
 * Reage à sessão rejeitada pela API durante a navegação: limpa dados privados e
 * leva ao login preservando a tela atual para retomada.
 */
export function SessionSync() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(
    () =>
      onSessionRejected((reason) => {
        clearSession(queryClient)
        const { pathname, href } = router.state.location
        if (pathname === "/entrar" || pathname === "/cadastro") return
        toast.warning(reason === "expired" ? "Sua sessão expirou. Entre novamente para continuar." : "Entre na sua conta para continuar.")
        void router.navigate({ to: "/entrar", search: { redirect: href } })
      }),
    [queryClient, router]
  )

  return null
}
