import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { PasswordChangeRequest, ProfileUpdateRequest, SessionResponse, User, WalletInput, WalletSlot, WalletsResponse } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { profileQuery, queryKeys, walletsQuery } from "@/api/queries"

/** Mantém o usuário da sessão em sincronia com o perfil salvo (header, checkout…). */
function syncSessionUser(queryClient: ReturnType<typeof useQueryClient>, user: User) {
  queryClient.setQueryData<SessionResponse | null>(queryKeys.session, (session) => (session ? { ...session, user } : session))
  queryClient.setQueryData(queryKeys.profile(user.id), user)
}

export function useProfile(userId: string) {
  return useQuery(profileQuery(userId))
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileUpdateRequest) => api.updateProfile(body),
    onSuccess: (user) => syncSessionUser(queryClient, user),
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: (body: PasswordChangeRequest) => api.changePassword(body) })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataUrl: string | null) => api.updateAvatar({ dataUrl }),
    onSuccess: (user) => syncSessionUser(queryClient, user),
  })
}

export function useWallets(userId: string) {
  return useQuery(walletsQuery(userId))
}

export function useSaveWallet(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slot, body }: { slot: WalletSlot; body: WalletInput }) => api.saveWallet(slot, body),
    onSuccess: (wallet) => {
      queryClient.setQueryData<WalletsResponse>(queryKeys.wallets(userId), (current) => ({
        items: [...(current?.items ?? []).filter((item) => item.slot !== wallet.slot), wallet].sort((a) => (a.slot === "primary" ? -1 : 1)),
      }))
    },
  })
}
