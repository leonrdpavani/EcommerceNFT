import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { whenMocksReady } from "@/api/mocks-gate"
import { useSession } from "@/features/session/use-session"
import { setRealtimeStatus } from "@/realtime/status"

/**
 * Conexão Socket.IO do app. Uma conexão por identidade: ao trocar de usuário (login,
 * logout, expiração), a conexão anterior e todos os seus listeners são descartados —
 * eventos de uma sessão anterior nunca alcançam o cache do novo usuário.
 *
 * A lógica de conexão (socket.io-client, aplicação de eventos) é carregada sob demanda,
 * depois que os mocks estão prontos, e fica fora do bundle inicial.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()
  const { session, isPending } = useSession()
  const token = session?.token ?? null
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (isPending) return
    let disconnect: (() => void) | null = null
    let disposed = false

    setRealtimeStatus("connecting")
    void whenMocksReady()
      .then(() => import("@/realtime/connection"))
      .then(({ connectRealtime }) => {
        if (disposed) return
        disconnect = connectRealtime(queryClient, token, userId)
      })

    return () => {
      disposed = true
      disconnect?.()
      setRealtimeStatus("idle")
    }
  }, [queryClient, token, userId, isPending])

  return null
}
