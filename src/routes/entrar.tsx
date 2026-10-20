import { createFileRoute } from "@tanstack/react-router"
import { AuthScreen } from "@/features/auth/auth-screen"
import { authSearchSchema } from "@/features/auth/auth-search"

export const Route = createFileRoute("/entrar")({
  validateSearch: authSearchSchema,
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect } = Route.useSearch()
  return <AuthScreen mode="login" redirect={redirect} />
}
