import type { ArtworkKey, CatalogSort, CatalogTab, CategoryId, NetworkId, WalletOption } from "@/types/domain"

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "arte-digital", label: "Arte digital" },
  { id: "fotografia", label: "Fotografia" },
  { id: "musica", label: "Música" },
  { id: "arte-3d", label: "Arte 3D" },
  { id: "colecionaveis", label: "Colecionáveis" },
  { id: "generativa", label: "Generativa" },
  { id: "jogos", label: "Jogos" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "utilidade", label: "Utilidade" },
]

export const NETWORKS: { id: NetworkId; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
]

export const CATALOG_TABS: { id: CatalogTab; label: string }[] = [
  { id: "todos", label: "Todos os NFTs" },
  { id: "novos", label: "Novos lançamentos" },
  { id: "em-alta", label: "Em alta" },
]

export const SORT_OPTIONS: { id: CatalogSort; label: string }[] = [
  { id: "recentes", label: "Listados recentemente" },
  { id: "preco-asc", label: "Menor preço" },
  { id: "preco-desc", label: "Maior preço" },
  { id: "nome", label: "Nome (A–Z)" },
]

export const WALLET_OPTIONS: WalletOption[] = [
  { id: "walletconnect", name: "WalletConnect", monogram: "W" },
  { id: "metamask", name: "MetaMask", monogram: "M" },
  { id: "coinbase", name: "Coinbase Wallet", monogram: "C" },
]

export const PRICE_BOUNDS = { min: 0.02, max: 12.3 } as const

export const PAGE_SIZE = 9

/** Descrição textual de cada arte, usada como texto alternativo. */
export const ARTWORK_ALT: Record<ArtworkKey, string> = {
  "emerald-ape": "Ilustração de um macaco com óculos redondos verdes e jaqueta college verde com colar de esmeralda",
  "sage-nomad": "Ilustração de um gorila grisalho com chapéu bucket verde-claro e moletom lilás",
  "ivory-baron": "Ilustração de um gorila de pelo escuro com gola alta verde e blazer marfim",
  "golden-beat": "Ilustração de um macaco dourado com fones de ouvido verdes e jaqueta creme",
}

export function categoryLabel(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id
}

export function networkLabel(id: NetworkId) {
  return NETWORKS.find((network) => network.id === id)?.label ?? id
}
