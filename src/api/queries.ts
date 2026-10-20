/**
 * Query keys e queryOptions. Dados privados ficam sob ["user", userId, ...] para
 * isolamento por usuário e limpeza total no logout/troca de usuário.
 */
import { keepPreviousData, queryOptions } from "@tanstack/react-query"

import { api } from "@/api/endpoints"
import { clientStorage } from "@/api/client-storage"
import { isApiError } from "@/api/http"
import type { CatalogSearch } from "@/lib/catalog-search"

export const queryKeys = {
  nfts: ["nfts"] as const,
  nftList: (search: CatalogSearch) => ["nfts", "list", search] as const,
  nft: (id: string) => ["nfts", "detail", id] as const,
  related: (id: string) => ["nfts", "related", id] as const,
  session: ["session"] as const,
  user: (userId: string) => ["user", userId] as const,
  favorites: (userId: string) => ["user", userId, "favorites"] as const,
  profile: (userId: string) => ["user", userId, "profile"] as const,
  wallets: (userId: string) => ["user", userId, "wallets"] as const,
  order: (userId: string, orderId: string) => ["user", userId, "orders", orderId] as const,
  /** Carrinho do usuário ou do visitante (identificado pelo cartId). */
  cart: (owner: string) => ["cart", owner] as const,
  quote: (owner: string, cartVersion: number, coupon: string | null) => ["cart", owner, "quote", cartVersion, coupon] as const,
}

export function cartOwner(userId: string | null | undefined) {
  return userId ?? "visitor"
}

export const catalogQuery = (search: CatalogSearch) =>
  queryOptions({
    queryKey: queryKeys.nftList(search),
    queryFn: ({ signal }) => api.listNfts(search, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const nftQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nft(id),
    queryFn: ({ signal }) => api.getNft(id, { signal }),
    staleTime: 30_000,
  })

export const relatedQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.related(id),
    queryFn: ({ signal }) => api.getRelated(id, { signal }),
    staleTime: 60_000,
  })

/** Sessão atual: sem token salvo não há requisição; 401 vira "sem sessão". */
export const sessionQuery = () =>
  queryOptions({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      if (!clientStorage.getSession()) return null
      try {
        return await api.getSession({ signal })
      } catch (error) {
        if (isApiError(error) && error.isAuthError) {
          clientStorage.setSession(null)
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })

export const cartQuery = (owner: string) =>
  queryOptions({
    queryKey: queryKeys.cart(owner),
    queryFn: ({ signal }) => api.getCart({ signal }),
    staleTime: 15_000,
  })

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.favorites(userId),
    queryFn: ({ signal }) => api.getFavorites({ signal }),
    staleTime: 60_000,
  })

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => api.getProfile({ signal }),
  })

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => api.getWallets({ signal }),
  })
