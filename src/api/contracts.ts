/**
 * Contratos REST compartilhados entre transporte (Axios), mocks (MSW) e interface.
 * Valores em ETH são sempre strings decimais; quantidades são inteiras.
 */
import type { CategoryId, EthAmount, NetworkId, Nft } from "@/types/domain"

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | "VALIDATION_ERROR" // 400/422 — campos inválidos
  | "UNAUTHENTICATED" // 401 — sem sessão ou credenciais inválidas
  | "SESSION_EXPIRED" // 401 — sessão expirada
  | "FORBIDDEN" // 403 — sem permissão para o recurso
  | "NOT_FOUND" // 404 — recurso inexistente
  | "CONFLICT" // 409 — conflito genérico (ex.: e-mail já cadastrado)
  | "AVAILABILITY_CONFLICT" // 409 — edição esgotada / quantidade acima do disponível
  | "QUOTE_OUTDATED" // 409 — preço, disponibilidade ou taxa mudaram desde a cotação
  | "IDEMPOTENCY_CONFLICT" // 409 — chave reutilizada com conteúdo diferente
  | "COUPON_INVALID" // 422 — cupom inexistente
  | "COUPON_EXPIRED" // 422 — cupom expirado
  | "WALLET_REJECTED" // 403 — o usuário recusou a conexão/assinatura na carteira
  | "WALLET_DISCONNECTED" // 409 — a carteira desconectou antes do envio
  | "TRANSIENT" // 503 — falha temporária, pode tentar novamente
  | "INTERNAL" // 500 — erro inesperado

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    /** Erros por campo (validação de formulários). */
    fields?: Record<string, string>
  }
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/** GET /api/nfts — query: q, tab, sort, categories (csv), networks (csv), min, max, page */
export interface NftListResponse {
  items: Nft[]
  page: number
  pageSize: number
  pageCount: number
  total: number
  facets: {
    categories: Partial<Record<CategoryId, number>>
    networks: Partial<Record<NetworkId, number>>
  }
}

/** GET /api/nfts/:id */
export type NftDetailResponse = Nft

/** GET /api/nfts/:id/related */
export interface RelatedNftsResponse {
  items: Nft[]
}

// ---------------------------------------------------------------------------
// Sessão e conta
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
}

/** POST /api/session  •  POST /api/accounts  •  GET /api/session */
export interface SessionResponse {
  user: User
  token: string
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

/** PATCH /api/profile */
export interface ProfileUpdateRequest {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}

/** POST /api/profile/password */
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

/** PUT /api/profile/avatar — imagem como data URL (simulação) */
export interface AvatarUpdateRequest {
  dataUrl: string | null
}

// ---------------------------------------------------------------------------
// Carteiras
// ---------------------------------------------------------------------------

export type WalletSlot = "primary" | "secondary"
export type WalletType = "walletconnect" | "metamask" | "coinbase"

export interface Wallet {
  slot: WalletSlot
  displayName: string
  walletNickname: string
  network: NetworkId
  profileName: string
  address: string
  secondaryAddress: string
  walletType: WalletType
  referralCode: string
  email: string
  ensName: string
  updatedAt: string
}

export type WalletInput = Omit<Wallet, "slot" | "updatedAt">

/** GET /api/wallets */
export interface WalletsResponse {
  items: Wallet[]
}

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------

/** GET /api/favorites  •  PUT/DELETE /api/favorites/:nftId */
export interface FavoritesResponse {
  nftIds: string[]
}

// ---------------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------------

export interface CartItem {
  id: string
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  artwork: Nft["artwork"]
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
  /** Unidades disponíveis na edição neste momento. */
  available: number
  nftVersion: number
}

/** GET /api/cart — visitante identificado pelo header X-Cart-Id; autenticado, pelo usuário. */
export interface Cart {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: EthAmount
  version: number
  updatedAt: string
}

/** POST /api/cart/items */
export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

/** PATCH /api/cart/items/:itemId */
export interface UpdateCartItemRequest {
  quantity: number
}

// ---------------------------------------------------------------------------
// Cotação
// ---------------------------------------------------------------------------

export interface QuoteLine {
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  artwork: Nft["artwork"]
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

export type QuoteIssue =
  | { type: "PRICE_CHANGED"; nftId: string; editionId: string; previousPrice: EthAmount; currentPrice: EthAmount }
  | { type: "INSUFFICIENT_AVAILABILITY"; nftId: string; editionId: string; requested: number; available: number }

/** POST /api/quotes */
export interface QuoteRequest {
  couponCode?: string
}

export interface Quote {
  id: string
  cartId: string
  cartVersion: number
  items: QuoteLine[]
  coupon: { code: string; description: string } | null
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  currency: "ETH"
  issues: QuoteIssue[]
  createdAt: string
  expiresAt: string
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export type OrderStatus = "pending" | "confirmed" | "declined"

export interface CollectorDetails {
  displayName: string
  username: string
  profileName: string
  email: string
  walletAddress: string
  secondaryWallet: string
  referralCode: string
  ensName: string
  note: string
}

/** POST /api/orders — header obrigatório: Idempotency-Key */
export interface CreateOrderRequest {
  quoteId: string
  network: NetworkId
  walletType: WalletType
  /** Sessão obtida em POST /api/wallet/connect (simulação da extensão da carteira). */
  walletSessionId: string
  collector: CollectorDetails
}

/** Snapshot imutável do pedido — alterações posteriores no catálogo não o afetam. */
export interface Order {
  id: string
  status: OrderStatus
  version: number
  idempotencyKey: string
  items: QuoteLine[]
  coupon: Quote["coupon"]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  network: NetworkId
  walletType: WalletType
  transactionHash: string | null
  explorerUrl: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Conexão de carteira (simulada)
// ---------------------------------------------------------------------------

/** POST /api/wallet/connect */
export interface WalletConnectRequest {
  walletType: WalletType
  network: NetworkId
  address: string
}

export interface WalletConnection {
  sessionId: string
  walletType: WalletType
  network: NetworkId
  address: string
  connectedAt: string
}

// ---------------------------------------------------------------------------
// Tempo real (Socket.IO)
// ---------------------------------------------------------------------------

/**
 * Envelope de todos os eventos: identidade estável (id), recurso afetado e versão.
 * O cliente descarta duplicatas (mesmo id) e eventos antigos (versão menor ou igual à conhecida).
 */
export interface RealtimeEvent<TType extends string, TData> {
  id: string
  type: TType
  resource: { type: "nft" | "order"; id: string }
  version: number
  occurredAt: string
  /** Presente em eventos privados: o cliente ignora eventos de outro usuário. */
  userId?: string
  data: TData
}

export type NftUpdatedEvent = RealtimeEvent<"nft.updated", Nft>
export type OrderUpdatedEvent = RealtimeEvent<"order.updated", Order>

export interface RealtimeServerEvents {
  "nft.updated": (event: NftUpdatedEvent) => void
  "order.updated": (event: OrderUpdatedEvent) => void
}
