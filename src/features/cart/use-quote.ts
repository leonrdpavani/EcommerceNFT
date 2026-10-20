import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { api } from "@/api/endpoints"
import { queryKeys } from "@/api/queries"
import { useCart, useCartOwner } from "@/features/cart/use-cart"

const COUPON_KEY = "kurio:coupon"

function readCoupon() {
  try {
    return sessionStorage.getItem(COUPON_KEY)
  } catch {
    return null
  }
}

function writeCoupon(code: string | null) {
  try {
    if (code) sessionStorage.setItem(COUPON_KEY, code)
    else sessionStorage.removeItem(COUPON_KEY)
  } catch {
    // sem sessionStorage: o cupom vale só nesta tela
  }
}

/**
 * Cotação do carrinho atual. A chave inclui a versão do carrinho e o cupom: qualquer
 * mudança no carrinho gera uma nova cotação, coerente com a resposta da API.
 */
export function useQuote() {
  const cart = useCart()
  const { owner } = useCartOwner()
  const queryClient = useQueryClient()
  const [coupon, setCouponState] = useState<string | null>(readCoupon)

  const setCoupon = (code: string | null) => {
    writeCoupon(code)
    setCouponState(code)
  }

  const version = cart.data?.version ?? 0
  const quote = useQuery({
    queryKey: queryKeys.quote(owner, version, coupon),
    queryFn: async ({ signal }) => {
      try {
        return await api.createQuote({ couponCode: coupon ?? undefined }, { signal })
      } catch (error) {
        // Cupom deixou de valer (ex.: subtotal abaixo do mínimo): segue sem ele.
        if (coupon) {
          setCoupon(null)
          return api.createQuote({}, { signal })
        }
        throw error
      }
    },
    enabled: Boolean(cart.data && cart.data.items.length > 0),
    staleTime: 60_000,
  })

  const applyCoupon = useMutation({
    mutationFn: (code: string) => api.createQuote({ couponCode: code }),
    onSuccess: (data, code) => {
      queryClient.setQueryData(queryKeys.quote(owner, version, code), data)
      setCoupon(code)
    },
  })

  return {
    cart,
    quote,
    coupon,
    applyCoupon,
    removeCoupon: () => setCoupon(null),
  }
}
