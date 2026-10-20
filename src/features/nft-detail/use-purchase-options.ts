import { useState } from "react"

import type { Nft } from "@/types/domain"

/** Estado local de compra no detalhe: edição selecionada, quantidade limitada à disponibilidade e favorito. */
export function usePurchaseOptions(nft: Nft) {
  const firstAvailable =
    nft.editions.find((edition) => edition.id === "1-50" && edition.available > 0) ??
    nft.editions.find((edition) => edition.available > 0)

  const [editionId, setEditionId] = useState(firstAvailable?.id ?? nft.editions[0].id)
  const [quantity, setQuantity] = useState(1)
  const [favorite, setFavorite] = useState(false)

  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const maxQuantity = Math.max(1, Math.min(edition.available, 10))
  const soldOut = edition.available === 0

  return {
    edition,
    editionId,
    selectEdition(id: string) {
      setEditionId(id)
      const next = nft.editions.find((item) => item.id === id)
      if (next) setQuantity((current) => Math.min(current, Math.max(1, Math.min(next.available, 10))))
    },
    quantity,
    setQuantity,
    maxQuantity,
    soldOut,
    allSoldOut: !firstAvailable,
    favorite,
    toggleFavorite: () => setFavorite((value) => !value),
  }
}
