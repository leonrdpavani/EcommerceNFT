import type { QueryClient } from "@tanstack/react-query"
import { redirect, type ParsedLocation } from "@tanstack/react-router"

import { sessionQuery } from "@/api/queries"

/** Guard de rotas privadas: sem sessão, redireciona ao login com retorno ao fluxo anterior. */
export async function requireSession({ context, location }: { context: { queryClient: QueryClient }; location: ParsedLocation }) {
  const session = await context.queryClient.ensureQueryData(sessionQuery())
  if (!session) {
    throw redirect({ to: "/entrar", search: { redirect: location.href } })
  }
  return { session }
}
