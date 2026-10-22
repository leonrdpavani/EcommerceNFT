import { toast } from "sonner"

import { useAddToCartAction } from "@/features/cart/use-add-to-cart-action"
import { useFavorites, useToggleFavorite } from "@/features/favorites/use-favorites"
import { defaultEdition } from "@/lib/editions"
import type { Nft } from "@/types/domain"

/**
 * Ações rápidas dos cards de NFT (favoritar e adicionar ao carrinho), iguais em todas as listas:
 * catálogo, favoritos e carrosséis. O carrinho recebe a edição padrão (`defaultEdition`: 1/50 ou a primeira com estoque).
 */
export function useNftCardActions() {
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const addToCart = useAddToCartAction()

  return {
    isFavorite: (nft: Nft) => favorites.ids.has(nft.id),
    toggleFavorite: (nft: Nft) => toggleFavorite.toggle(nft.id, nft.name, favorites.ids.has(nft.id)),
    addToCart: (nft: Nft) => {
      const edition = defaultEdition(nft)
      if (!edition) {
        toast.error(`Todas as edições de ${nft.name} estão esgotadas.`)
        return
      }
      addToCart.add({ nftId: nft.id, editionId: edition.id, quantity: 1, name: nft.name, editionLabel: edition.label })
    },
  }
}
