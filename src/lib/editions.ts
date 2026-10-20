import type { Nft } from "@/types/domain"

/** Edição sugerida ao comprar direto do card: 1/50 se disponível, senão a primeira com estoque. */
export function defaultEdition(nft: Nft) {
  return (
    nft.editions.find((edition) => edition.id === "1-50" && edition.available > 0) ??
    nft.editions.find((edition) => edition.available > 0) ??
    null
  )
}
