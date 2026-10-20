import { queryOptions, useQuery } from "@tanstack/react-query"

import { api } from "@/api/endpoints"
import { queryKeys } from "@/api/queries"
import { getRealtimeStatus } from "@/realtime/status"

/**
 * Pedido por id. O estado chega por order.updated (Socket.IO); a consulta periódica é só
 * um fallback enquanto o tempo real estiver desconectado. Confirmado/recusado são terminais.
 */
export const orderQuery = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: queryKeys.order(userId, orderId),
    queryFn: ({ signal }) => api.getOrder(orderId, { signal }),
    refetchInterval: (query) => {
      if (query.state.data?.status !== "pending") return false
      return getRealtimeStatus() === "connected" ? 15_000 : 3_000
    },
    staleTime: (query) => (query.state.data?.status === "pending" ? 0 : Infinity),
  })

export function useOrder(userId: string, orderId: string) {
  return useQuery(orderQuery(userId, orderId))
}
