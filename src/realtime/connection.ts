import type { QueryClient } from "@tanstack/react-query"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeServerEvents } from "@/api/contracts"
import { formatEth } from "@/lib/format"
import { applyNftUpdated, applyOrderUpdated, reconcileWithRest } from "@/realtime/apply-events"
import { REALTIME_URL } from "@/realtime/endpoint"
import { setRealtimeStatus } from "@/realtime/status"

const SEEN_EVENTS_LIMIT = 500

/**
 * Abre a conexão Socket.IO de uma identidade (visitante ou usuário) e registra os handlers.
 * Carregado sob demanda pelo RealtimeProvider, depois que os mocks assumem a rede:
 * o engine.io-client guarda a referência ao WebSocket global ao ser avaliado e precisa
 * enxergar a versão interceptada pelo MSW. Retorna a função que encerra a conexão.
 */
export function connectRealtime(queryClient: QueryClient, token: string | null, userId: string | null) {
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

  const socket: Socket<RealtimeServerEvents> = io(REALTIME_URL, {
    transports: ["websocket"],
    auth: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    timeout: 8000,
  })

  let hasConnected = false
  socket.on("connect", () => {
    setRealtimeStatus("connected")
    // Na primeira conexão os dados acabaram de ser buscados; após reconexões, reconcilia.
    if (hasConnected) {
      reconcileWithRest(queryClient, userId)
      toast.success("Conexão em tempo real restabelecida. Dados atualizados.", { id: "realtime-status" })
    }
    hasConnected = true
  })
  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") return
    setRealtimeStatus("reconnecting")
    toast.warning("Conexão em tempo real perdida. Tentando reconectar…", { id: "realtime-status" })
  })
  socket.on("connect_error", () => setRealtimeStatus(hasConnected ? "reconnecting" : "offline"))
  socket.on("nft.updated", onNftUpdated)
  socket.on("order.updated", onOrderUpdated)

  return () => {
    socket.removeAllListeners()
    socket.disconnect()
  }
}
