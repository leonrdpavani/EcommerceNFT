import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { AddCartItemRequest } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { cartOwner, cartQuery, queryKeys } from "@/api/queries"
import { useSession } from "@/features/session/use-session"

export function useCartOwner() {
  const { user, isPending } = useSession()
  return { owner: cartOwner(user?.id), ready: !isPending }
}

export function useCart() {
  const { owner, ready } = useCartOwner()
  return useQuery({ ...cartQuery(owner), enabled: ready })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { owner } = useCartOwner()
  return useMutation({
    mutationFn: (body: AddCartItemRequest) => api.addCartItem(body),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart(owner), cart),
  })
}
