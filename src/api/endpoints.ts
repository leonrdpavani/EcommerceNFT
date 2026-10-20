/** Funções de transporte: cada uma mapeia um endpoint REST (todas passam pelo Axios). */
import type {
  AddCartItemRequest,
  AvatarUpdateRequest,
  Cart,
  CreateOrderRequest,
  FavoritesResponse,
  LoginRequest,
  NftDetailResponse,
  NftListResponse,
  Order,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  Quote,
  QuoteRequest,
  RelatedNftsResponse,
  SessionResponse,
  SignupRequest,
  User,
  Wallet,
  WalletInput,
  WalletConnection,
  WalletConnectRequest,
  WalletSlot,
  WalletsResponse,
} from "@/api/contracts"
import { clientStorage } from "@/api/client-storage"
import { http } from "@/api/http"
import type { CatalogSearch } from "@/lib/catalog-search"

type Signal = { signal?: AbortSignal }

/** Visitantes guardam o id do carrinho criado pelo servidor para mantê-lo após refresh. */
function rememberCart(cart: Cart) {
  if (!clientStorage.getSession()) clientStorage.setCartId(cart.id)
  return cart
}

export function catalogParams(search: CatalogSearch) {
  return {
    q: search.q || undefined,
    tab: search.tab,
    sort: search.sort,
    categories: search.categories.length ? search.categories.join(",") : undefined,
    networks: search.networks.length ? search.networks.join(",") : undefined,
    min: search.min,
    max: search.max,
    page: search.page,
  }
}

export const api = {
  // Catálogo
  listNfts: (search: CatalogSearch, { signal }: Signal = {}) =>
    http.get<NftListResponse>("/nfts", { params: catalogParams(search), signal }).then((res) => res.data),
  getNft: (id: string, { signal }: Signal = {}) => http.get<NftDetailResponse>(`/nfts/${encodeURIComponent(id)}`, { signal }).then((res) => res.data),
  getRelated: (id: string, { signal }: Signal = {}) =>
    http.get<RelatedNftsResponse>(`/nfts/${encodeURIComponent(id)}/related`, { signal }).then((res) => res.data),

  // Sessão e conta
  login: (body: LoginRequest) => http.post<SessionResponse>("/session", body).then((res) => res.data),
  signup: (body: SignupRequest) => http.post<SessionResponse>("/accounts", body).then((res) => res.data),
  getSession: ({ signal }: Signal = {}) => http.get<SessionResponse>("/session", { signal }).then((res) => res.data),
  logout: () => http.delete("/session").then(() => undefined),

  // Perfil
  getProfile: ({ signal }: Signal = {}) => http.get<User>("/profile", { signal }).then((res) => res.data),
  updateProfile: (body: ProfileUpdateRequest) => http.patch<User>("/profile", body).then((res) => res.data),
  changePassword: (body: PasswordChangeRequest) => http.post("/profile/password", body).then(() => undefined),
  updateAvatar: (body: AvatarUpdateRequest) => http.put<User>("/profile/avatar", body).then((res) => res.data),

  // Carteiras
  getWallets: ({ signal }: Signal = {}) => http.get<WalletsResponse>("/wallets", { signal }).then((res) => res.data),
  saveWallet: (slot: WalletSlot, body: WalletInput) => http.put<Wallet>(`/wallets/${slot}`, body).then((res) => res.data),

  // Favoritos
  getFavorites: ({ signal }: Signal = {}) => http.get<FavoritesResponse>("/favorites", { signal }).then((res) => res.data),
  addFavorite: (nftId: string) => http.put<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`).then((res) => res.data),
  removeFavorite: (nftId: string) => http.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`).then((res) => res.data),

  // Carrinho e cotação
  getCart: ({ signal }: Signal = {}) => http.get<Cart>("/cart", { signal }).then((res) => rememberCart(res.data)),
  addCartItem: (body: AddCartItemRequest) => http.post<Cart>("/cart/items", body).then((res) => rememberCart(res.data)),
  updateCartItem: (itemId: string, quantity: number) => http.patch<Cart>(`/cart/items/${itemId}`, { quantity }).then((res) => res.data),
  removeCartItem: (itemId: string) => http.delete<Cart>(`/cart/items/${itemId}`).then((res) => res.data),
  createQuote: (body: QuoteRequest, { signal }: Signal = {}) => http.post<Quote>("/quotes", body, { signal }).then((res) => res.data),

  // Carteira (simulação de conexão com a extensão)
  connectWallet: (body: WalletConnectRequest) => http.post<WalletConnection>("/wallet/connect", body).then((res) => res.data),

  // Pedidos
  createOrder: (body: CreateOrderRequest, idempotencyKey: string) =>
    http.post<Order>("/orders", body, { headers: { "Idempotency-Key": idempotencyKey } }).then((res) => res.data),
  getOrder: (id: string, { signal }: Signal = {}) => http.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal }).then((res) => res.data),
}
