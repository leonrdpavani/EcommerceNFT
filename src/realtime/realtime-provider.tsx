import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { Socket } from "socket.io-client"
import { toast } from "sonner"

import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeServerEvents } from "@/api/contracts"
import { useSession } from "@/features/session/use-session"
import { formatEth } from "@/lib/format"
import { applyNftUpdated, applyOrderUpdated, reconcileWithRest } from "@/realtime/apply-events"
import { REALTIME_URL } from "@/realtime/endpoint"
import { setRealtimeStatus } from "@/realtime/status"

const SEEN_EVENTS_LIMIT = 500

/**
 * Conexão Socket.IO do app. Uma conexão por identidade: ao trocar de usuário (login,
 * logout, expiração), a conexão anterior e todos os seus listeners são descartados —
 * eventos de uma sessão anterior nunca alcançam o cache do novo usuário.
 *
 * O socket.io-client é carregado sob demanda: o engine.io-client guarda a referência ao
 * WebSocket global ao ser avaliado, e precisa enxergar a versão interceptada pelo MSW.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()
  const { session, isPending } = useSession()
  const token = session?.token ?? null
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (isPending) return
    let socket: Socket<RealtimeServerEvents> | null = null
    let disposed = false

    const seen = new Set<string>()
    const remember = (id: string) => {
      if (seen.has(id)) return false
      seen.add(id)
      if (seen.size > SEEN_EVENTS_LIMIT) seen.delete(seen.values().next().value!)
      return true
    }
    // Maior versão já aplicada por recurso: eventos antigos ou repetidos não regridem o estado.
    const versions = new Map<string, number>()
    const isNewer = (resource: string, version: number) => {
      if ((versions.get(resource) ?? -1) >= version) return false
      versions.set(resource, version)
      return true
    }

    function onNftUpdated(event: NftUpdatedEvent) {
      if (!remember(event.id) || !isNewer(`nft:${event.resource.id}`, event.version)) return
      const change = applyNftUpdated(queryClient, event.data)
      if (!change?.inCart) return
      if (change.shortages.length > 0) {
        const shortage = change.shortages[0]
        toast.warning(
          shortage.available === 0
            ? `${change.name} (${shortage.editionLabel}) esgotou. Ajuste o carrinho para continuar.`
            : `${change.name} (${shortage.editionLabel}) agora tem só ${shortage.available} disponível(is).`,
          { id: `nft-${event.data.id}` }
        )
      } else if (change.previousPrice && change.previousPrice !== change.currentPrice) {
        toast.warning(
          `O preço de ${change.name} mudou de ${formatEth(change.previousPrice)} para ${formatEth(change.currentPrice)}. O resumo foi atualizado.`,
          { id: `nft-${event.data.id}` }
        )
      }
    }

    function onOrderUpdated(event: OrderUpdatedEvent) {
      // Eventos privados de outro usuário (ou de uma sessão anterior) são descartados.
      if (!userId || event.userId !== userId) return
      if (!remember(event.id) || !isNewer(`order:${event.resource.id}`, event.version)) return
      const result = applyOrderUpdated(queryClient, userId, event.data)
      if (!result || result.order.status === "pending") return
      if (result.order.status === "confirmed") {
        toast.success("Pagamento confirmado! Seus NFTs estão na sua carteira.", { id: `order-${event.data.id}` })
      } else {
        toast.error("Pagamento recusado pela carteira. Nenhum valor foi cobrado.", { id: `order-${event.data.id}` })
      }
    }

    setRealtimeStatus("connecting")
    void import("socket.io-client").then(({ io }) => {
      if (disposed) return
      const instance: Socket<RealtimeServerEvents> = io(REALTIME_URL, {
        transports: ["websocket"],
        auth: token ? { token } : {},
        reconnectionDelay: 500,
        reconnectionDelayMax: 4000,
        timeout: 8000,
      })
      socket = instance

      let hasConnected = false
      instance.on("connect", () => {
        setRealtimeStatus("connected")
        // Na primeira conexão os dados acabaram de ser buscados; após reconexões, reconcilia.
        if (hasConnected) {
          reconcileWithRest(queryClient, userId)
          toast.success("Conexão em tempo real restabelecida. Dados atualizados.", { id: "realtime-status" })
        }
        hasConnected = true
      })
      instance.on("disconnect", (reason) => {
        if (reason === "io client disconnect") return
        setRealtimeStatus("reconnecting")
        toast.warning("Conexão em tempo real perdida. Tentando reconectar…", { id: "realtime-status" })
      })
      instance.on("connect_error", () => setRealtimeStatus(hasConnected ? "reconnecting" : "offline"))
      instance.on("nft.updated", onNftUpdated)
      instance.on("order.updated", onOrderUpdated)
    })

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
      setRealtimeStatus("idle")
    }
  }, [queryClient, token, userId, isPending])

  return null
}
