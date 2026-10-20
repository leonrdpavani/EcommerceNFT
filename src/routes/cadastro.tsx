import { createFileRoute } from "@tanstack/react-router"

import { AuthScreen } from "@/features/auth/auth-screen"
import { authSearchSchema } from "@/features/auth/auth-search"

export const Route = createFileRoute("/cadastro")({
  validateSearch: authSearchSchema,
  component: SignupRoute,
})

function SignupRoute() {
  const { redirect } = Route.useSearch()
  return <AuthScreen mode="signup" redirect={redirect} />
}
