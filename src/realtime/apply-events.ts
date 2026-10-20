import type { QueryClient } from "@tanstack/react-query"

import type { Cart, NftListResponse, Order, RelatedNftsResponse } from "@/api/contracts"
import { queryKeys } from "@/api/queries"
import type { Nft } from "@/types/domain"

/** Mantém o NFT mais recente: um evento só substitui dados de versão menor. */
function newer(current: Nft, incoming: Nft) {
  return current.id === incoming.id && current.version < incoming.version ? incoming : current
}

export interface NftChange {
  inCart: boolean
  name: string
  previousPrice?: string
  currentPrice: string
  /** Edições do carrinho cuja disponibilidade ficou abaixo da quantidade escolhida. */
  shortages: { editionLabel: string; available: number; quantity: number }[]
}

/**
 * Aplica nft.updated ao cache: detalhe, listas do catálogo, relacionados e carrinho.
 * Retorna o que mudou (para o feedback acessível) ou null quando o evento é antigo
 * em relação a qualquer dado já conhecido — nesse caso nada é alterado.
 */
export function applyNftUpdated(queryClient: QueryClient, nft: Nft): NftChange | null {
  const detailKey = queryKeys.nft(nft.id)
  const cached = queryClient.getQueryData<Nft>(detailKey)
  const listItems = queryClient
    .getQueriesData<NftListResponse>({ queryKey: ["nfts", "list"] })
    .flatMap(([, list]) => list?.items.filter((item) => item.id === nft.id) ?? [])
  const cartLines = queryClient
    .getQueriesData<Cart>({ queryKey: ["cart"], predicate: (query) => query.queryKey.length === 2 })
    .flatMap(([, cart]) => cart?.items.filter((item) => item.nftId === nft.id) ?? [])

  const knownVersion = Math.max(
    cached?.version ?? -1,
    ...listItems.map((item) => item.version),
    ...cartLines.map((line) => line.nftVersion)
  )
  if (knownVersion >= nft.version) return null

  const previousPrice = cached?.price ?? listItems[0]?.price ?? cartLines[0]?.unitPrice

  if (cached) queryClient.setQueryData(detailKey, nft)
  queryClient.setQueriesData<NftListResponse>({ queryKey: ["nfts", "list"] }, (list) =>
    list ? { ...list, items: list.items.map((item) => newer(item, nft)) } : list
  )
  queryClient.setQueriesData<RelatedNftsResponse>({ queryKey: ["nfts", "related"] }, (related) =>
    related ? { ...related, items: related.items.map((item) => newer(item, nft)) } : related
  )

  // Carrinho e cotação: o servidor é a referência dos valores — refaz as consultas.
  if (cartLines.length > 0) void queryClient.invalidateQueries({ queryKey: ["cart"] })

  const shortages = cartLines.flatMap((line) => {
    const edition = nft.editions.find((item) => item.id === line.editionId)
    return edition && edition.available < line.quantity
      ? [{ editionLabel: edition.label, available: edition.available, quantity: line.quantity }]
      : []
  })

  return { inCart: cartLines.length > 0, name: nft.name, previousPrice, currentPrice: nft.price, shortages }
}

/** Aplica order.updated: só avança a versão do pedido (estados terminais nunca regridem). */
export function applyOrderUpdated(queryClient: QueryClient, userId: string, order: Order) {
  const key = queryKeys.order(userId, order.id)
  const cached = queryClient.getQueryData<Order>(key)
  if (cached && (cached.version >= order.version || cached.status !== "pending")) return null
  queryClient.setQueryData(key, order)
  if (order.status !== "pending") void queryClient.invalidateQueries({ queryKey: ["cart"] })
  return { previous: cached?.status ?? null, order }
}

/** Após (re)conectar, reconcilia os recursos ativos com a API REST. */
export function reconcileWithRest(queryClient: QueryClient, userId: string | null) {
  void queryClient.invalidateQueries({ queryKey: ["nfts"] })
  void queryClient.invalidateQueries({ queryKey: ["cart"] })
  if (userId) void queryClient.invalidateQueries({ queryKey: [...queryKeys.user(userId), "orders"] })
}
