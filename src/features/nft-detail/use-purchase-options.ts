import { useState } from "react"

import { defaultEdition } from "@/lib/editions"
import type { Nft } from "@/types/domain"

export const MAX_PER_ORDER = 10

/** Estado local de compra no detalhe: edição selecionada e quantidade limitada à disponibilidade. */
export function usePurchaseOptions(nft: Nft, favorite: { favorite: boolean; onToggleFavorite: () => void }) {
  const firstAvailable = defaultEdition(nft)
  const [editionId, setEditionId] = useState(firstAvailable?.id ?? nft.editions[0].id)
  const [quantity, setQuantity] = useState(1)

  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const maxQuantity = Math.max(1, Math.min(edition.available, MAX_PER_ORDER))

  return {
    edition,
    editionId,
    selectEdition: setEditionId,
    // A quantidade nunca passa da disponibilidade atual (inclusive após atualizações em tempo real).
    quantity: Math.min(quantity, maxQuantity),
    setQuantity,
    maxQuantity,
    soldOut: edition.available === 0,
    allSoldOut: !firstAvailable,
    favorite: favorite.favorite,
    toggleFavorite: favorite.onToggleFavorite,
  }
}
