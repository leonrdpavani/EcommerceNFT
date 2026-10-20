import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CreateOrderRequest } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { queryKeys } from "@/api/queries"
import { useSession } from "@/features/session/use-session"

const ATTEMPT_PREFIX = "kurio:order-attempt:"

/**
 * Uma chave de idempotência por tentativa (cotação). Reenvios da mesma tentativa — clique
 * repetido, retry após timeout ou refresh — reutilizam a chave e recuperam o mesmo pedido.
 */
export function idempotencyKeyFor(quoteId: string) {
  const storageKey = `${ATTEMPT_PREFIX}${quoteId}`
  try {
    const existing = sessionStorage.getItem(storageKey)
    if (existing) return existing
    const key = crypto.randomUUID()
    sessionStorage.setItem(storageKey, key)
    return key
  } catch {
    return `attempt-${quoteId}`
  }
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationKey: ["create-order"],
    mutationFn: (body: CreateOrderRequest) => api.createOrder(body, idempotencyKeyFor(body.quoteId)),
    onSuccess: (order) => {
      if (user) queryClient.setQueryData(queryKeys.order(user.id, order.id), order)
    },
  })
}
