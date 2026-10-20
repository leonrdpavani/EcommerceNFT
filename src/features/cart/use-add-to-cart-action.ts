import { toast } from "sonner"

import { isApiError } from "@/api/http"
import { useAddToCart } from "@/features/cart/use-cart"

/** Adiciona ao carrinho com feedback acessível (toast) de sucesso ou do motivo da recusa. */
export function useAddToCartAction() {
  const mutation = useAddToCart()
  return {
    isPending: mutation.isPending,
    add(params: { nftId: string; editionId: string; quantity: number; name: string; editionLabel: string }, options?: { onSuccess?: () => void }) {
      mutation.mutate(
        { nftId: params.nftId, editionId: params.editionId, quantity: params.quantity },
        {
          onSuccess: () => {
            toast.success(`${params.name} (${params.editionLabel}) adicionado ao carrinho.`)
            options?.onSuccess?.()
          },
          onError: (error) => {
            toast.error(isApiError(error) ? error.message : "Não foi possível adicionar ao carrinho.")
          },
        }
      )
    },
  }
}
