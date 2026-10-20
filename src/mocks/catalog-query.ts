import Decimal from "decimal.js"

import { PAGE_SIZE } from "@/lib/catalog"
import type { CatalogSearch } from "@/lib/catalog-search"
import type { CategoryId, NetworkId, Nft } from "@/types/domain"

/**
 * Regras de busca/filtro/ordenação/paginação do catálogo.
 * Função pura reaproveitada pelo handler MSW de `GET /nfts` na fase de integração.
 */
export function queryCatalog(nfts: Nft[], search: CatalogSearch) {
  const term = search.q?.trim().toLowerCase() ?? ""

  const matchesBase = (nft: Nft) => {
    if (term && !`${nft.name} ${nft.collection}`.toLowerCase().includes(term)) return false
    if (search.tab === "novos" && !nft.isNewRelease) return false
    if (search.min !== undefined && new Decimal(nft.price).lessThan(search.min)) return false
    if (search.max !== undefined && new Decimal(nft.price).greaterThan(search.max)) return false
    return true
  }

  const inCategories = (nft: Nft) => search.categories.length === 0 || search.categories.includes(nft.category)
  const inNetworks = (nft: Nft) => search.networks.length === 0 || search.networks.includes(nft.network)

  const filtered = nfts.filter((nft) => matchesBase(nft) && inCategories(nft) && inNetworks(nft))

  const sorted = [...filtered].sort((a, b) => {
    switch (search.sort) {
      case "preco-asc":
        return new Decimal(a.price).comparedTo(b.price) || a.name.localeCompare(b.name)
      case "preco-desc":
        return new Decimal(b.price).comparedTo(a.price) || a.name.localeCompare(b.name)
      case "nome":
        return a.name.localeCompare(b.name, "pt-BR")
      default:
        if (search.tab === "em-alta") return b.trendingScore - a.trendingScore
        return b.listedAt.localeCompare(a.listedAt)
    }
  })

  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(Math.max(1, search.page), pageCount)
  const items = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Contagens de faceta: cada faceta considera os demais filtros ativos.
  const categoryCounts = {} as Record<CategoryId, number>
  const networkCounts = {} as Record<NetworkId, number>
  for (const nft of nfts) {
    if (!matchesBase(nft)) continue
    if (inNetworks(nft)) categoryCounts[nft.category] = (categoryCounts[nft.category] ?? 0) + 1
    if (inCategories(nft)) networkCounts[nft.network] = (networkCounts[nft.network] ?? 0) + 1
  }

  return { items, total, page, pageCount, pageSize: PAGE_SIZE, facets: { categories: categoryCounts, networks: networkCounts } }
}
