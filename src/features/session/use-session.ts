import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

import { clientStorage } from "@/api/client-storage"
import type { LoginRequest, SessionResponse, SignupRequest } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { queryKeys, sessionQuery } from "@/api/queries"

export function useSession() {
  const query = useQuery(sessionQuery())
  return {
    session: query.data ?? null,
    user: query.data?.user ?? null,
    isPending: query.isPending,
  }
}

/** Grava a sessão e descarta dados do carrinho de visitante (o servidor já os mesclou). */
export function establishSession(queryClient: QueryClient, session: SessionResponse) {
  clientStorage.setSession({ token: session.token, userId: session.user.id, expiresAt: session.expiresAt })
  clientStorage.setCartId(null)
  queryClient.removeQueries({ queryKey: ["cart"] })
  queryClient.setQueryData(queryKeys.session, session)
}

/**
 * Limpa sessão e todos os dados privados em cache (logout, expiração, troca de usuário).
 * Na expiração, o rascunho do checkout (por usuário) é mantido para a retomada após o login.
 */
export function clearSession(queryClient: QueryClient, { keepDrafts = false } = {}) {
  clientStorage.setSession(null)
  if (!keepDrafts) clientStorage.clearPrivateDrafts()
  clientStorage.setCartId(null)
  queryClient.removeQueries({ queryKey: ["user"] })
  queryClient.removeQueries({ queryKey: ["cart"] })
  queryClient.setQueryData(queryKeys.session, null)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => api.login(body),
    onSuccess: (session) => {
      const previous = clientStorage.getSession()
      if (previous && previous.userId !== session.user.id) clearSession(queryClient)
      establishSession(queryClient, session)
    },
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SignupRequest) => api.signup(body),
    onSuccess: (session) => establishSession(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.logout().catch(() => undefined),
    onSettled: () => clearSession(queryClient),
  })
}
