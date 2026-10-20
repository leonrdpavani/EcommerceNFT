/**
 * Dados de pré-visualização da fase visual.
 *
 * TEMPORÁRIO: na integração, estes valores passam a vir da API simulada (MSW) via
 * TanStack Query. Nenhum componente deve depender deste módulo depois disso —
 * por isso ele fica isolado aqui, em um único ponto fácil de remover.
 */
import Decimal from "decimal.js"

import { NFT_FIXTURES } from "@/mocks/fixtures/nfts"
import type { CartLine, Nft, SavedWallet } from "@/types/domain"

export const PREVIEW_NETWORK_FEE = "0.016"

export const PREVIEW_CART: CartLine[] = [
  { nftId: "emerald-ape-042", editionId: "1-50", quantity: 2 },
  { nftId: "violet-nomad-314", editionId: "1-10", quantity: 6 },
  { nftId: "ivory-baron-088", editionId: "1-50", quantity: 9 },
]

export const PREVIEW_WALLETS: SavedWallet[] = [
  { id: "reserva", label: "Reserva", address: "nova.kurio.eth", network: "polygon" },
  { id: "principal", label: "Principal", address: "0xA91F3c5D7e21B4a09f8E3d6C2b17E5a4F0c9E82C", network: "ethereum" },
]

export function findNft(id: string): Nft | undefined {
  return NFT_FIXTURES.find((nft) => nft.id === id)
}

export interface PreviewCartItem extends CartLine {
  nft: Nft
  editionLabel: string
  lineTotal: Decimal
}

export function getPreviewCart() {
  return buildCart(PREVIEW_CART)
}

export type PreviewCart = ReturnType<typeof buildCart>

export function buildCart(lines: CartLine[]) {
  const items: PreviewCartItem[] = lines.flatMap((line) => {
    const nft = findNft(line.nftId)
    if (!nft) return []
    const edition = nft.editions.find((item) => item.id === line.editionId)
    return [
      {
        ...line,
        nft,
        editionLabel: edition?.label ?? "",
        lineTotal: new Decimal(nft.price).times(line.quantity),
      },
    ]
  })
  const subtotal = items.reduce((total, item) => total.plus(item.lineTotal), new Decimal(0))
  const discount = new Decimal(0)
  const fee = new Decimal(PREVIEW_NETWORK_FEE)
  return {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    discount,
    fee,
    total: subtotal.minus(discount).plus(fee),
  }
}

export function relatedNfts(excludeId?: string, limit = 10) {
  return NFT_FIXTURES.filter((nft) => nft.id !== excludeId).slice(3, 3 + limit)
}
