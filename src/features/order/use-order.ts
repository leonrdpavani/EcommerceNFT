import { queryOptions, useQuery } from "@tanstack/react-query"

import { api } from "@/api/endpoints"
import { queryKeys } from "@/api/queries"

export const orderQuery = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: queryKeys.order(userId, orderId),
    queryFn: ({ signal }) => api.getOrder(orderId, { signal }),
    // Enquanto pendente, consulta o estado; confirmado/recusado são terminais.
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 1500 : false),
    staleTime: (query) => (query.state.data?.status === "pending" ? 0 : Infinity),
  })

export function useOrder(userId: string, orderId: string) {
  return useQuery(orderQuery(userId, orderId))
}
