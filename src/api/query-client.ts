import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { isApiError } from "@/api/http"

/**
 * Política de cache e retries (documentada no ARCHITECTURE.md):
 * - consultas: staleTime por recurso; refetch ao focar a janela e ao reconectar;
 * - retries só para falhas transitórias (rede, timeout, 5xx), até 2 tentativas com backoff;
 * - mutations nunca repetem automaticamente (evita duplicar operações).
 */
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => isApiError(error) && error.isTransient && failureCount < 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}
