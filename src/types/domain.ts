/** Valores em ETH trafegam sempre como string decimal (ex.: "1.19"). */
export type EthAmount = string

export type ArtworkKey = "emerald-ape" | "sage-nomad" | "ivory-baron" | "golden-beat"

export type NetworkId = "ethereum" | "polygon" | "solana"

export type CategoryId =
  | "arte-digital"
  | "fotografia"
  | "musica"
  | "arte-3d"
  | "colecionaveis"
  | "generativa"
  | "jogos"
  | "assinaturas"
  | "utilidade"

export type CatalogTab = "todos" | "novos" | "em-alta"

export type CatalogSort = "recentes" | "preco-asc" | "preco-desc" | "nome"

export interface Edition {
  id: string
  /** Rótulo exibido: "1/1", "1/10", "1/50", "ABERTA". */
  label: string
  /** Tiragem total; `null` para edição aberta. */
  supply: number | null
  available: number
}

export interface Nft {
  id: string
  tokenId: string
  name: string
  artwork: ArtworkKey
  collection: string
  category: CategoryId
  network: NetworkId
  price: EthAmount
  /** Preço anterior quando o NFT está em promoção. */
  compareAtPrice?: EthAmount
  badge?: "raro"
  rating: number
  reviewsCount: number
  summary: string
  description: string[]
  attributes: string[]
  contract: string
  editions: Edition[]
  isNewRelease: boolean
  trendingScore: number
  listedAt: string
  version: number
}

export interface CartLine {
  nftId: string
  editionId: string
  quantity: number
}

export interface WalletOption {
  id: "walletconnect" | "metamask" | "coinbase"
  name: string
  monogram: string
}

export interface SavedWallet {
  id: string
  label: string
  address: string
  network: NetworkId
}
