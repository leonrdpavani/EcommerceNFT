import { useMutation, useQueryClient } from "@tanstack/react-query"
import Decimal from "decimal.js"

import type { Cart } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { queryKeys } from "@/api/queries"
import { useCartOwner } from "@/features/cart/use-cart"

function recalculate(cart: Cart, itemId: string, quantity: number | null): Cart {
  const items = cart.items
    .map((item) =>
      item.id === itemId && quantity !== null
        ? { ...item, quantity, lineTotal: new Decimal(item.unitPrice).times(quantity).toFixed() }
        : item
    )
    .filter((item) => !(item.id === itemId && quantity === null))
  return {
    ...cart,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total.plus(item.lineTotal), new Decimal(0)).toFixed(),
  }
}

/**
 * Alteração de quantidade/remoção com atualização otimista: a UI responde na hora
 * e, se a API recusar, o snapshot anterior é restaurado (rollback).
 */
export function useCartItemMutation() {
  const queryClient = useQueryClient()
  const { owner } = useCartOwner()
  const key = queryKeys.cart(owner)

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number | null }) =>
      quantity === null ? api.removeCartItem(itemId) : api.updateCartItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      const previous = queryClient.getQueryData<Cart>(key)
      if (previous) queryClient.setQueryData(key, recalculate(previous, itemId, quantity))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
