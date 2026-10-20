import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { toast } from "sonner"

import type { FavoritesResponse } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { favoritesQuery, queryKeys } from "@/api/queries"
import { useSession } from "@/features/session/use-session"

const EMPTY = new Set<string>()

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({ ...favoritesQuery(user?.id ?? "anon"), enabled: Boolean(user) })
  return { ...query, ids: query.data ? new Set(query.data.nftIds) : EMPTY, signedIn: Boolean(user) }
}

/**
 * Favoritar com atualização otimista e rollback em caso de falha.
 * Visitantes são levados ao login e retornam para a mesma tela.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const { user } = useSession()

  const mutation = useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean; name: string }) =>
      favorite ? api.addFavorite(nftId) : api.removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      if (!user) return {}
      const key = queryKeys.favorites(user.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      const ids = new Set(previous?.nftIds ?? [])
      if (favorite) ids.add(nftId)
      else ids.delete(nftId)
      queryClient.setQueryData<FavoritesResponse>(key, { nftIds: [...ids] })
      return { previous, key }
    },
    onError: (_error, { name }, context) => {
      if (context?.key) queryClient.setQueryData(context.key, context.previous)
      toast.error(`Não foi possível atualizar os favoritos de ${name}. Tente novamente.`)
    },
    onSuccess: (data, { favorite, name }) => {
      if (user) queryClient.setQueryData(queryKeys.favorites(user.id), data)
      toast.success(favorite ? `${name} adicionado aos favoritos.` : `${name} removido dos favoritos.`)
    },
  })

  return {
    isPending: mutation.isPending,
    toggle(nftId: string, name: string, currentlyFavorite: boolean) {
      if (!user) {
        toast.info("Entre na sua conta para favoritar NFTs.")
        void navigate({ to: "/entrar", search: { redirect: href } })
        return
      }
      mutation.mutate({ nftId, favorite: !currentlyFavorite, name })
    },
  }
}
