import { createFileRoute } from "@tanstack/react-router"

import { ProfilePage } from "@/features/account/profile-page"

export const Route = createFileRoute("/conta/perfil")({
  component: ProfileRoute,
})

function ProfileRoute() {
  const { session } = Route.useRouteContext()
  return <ProfilePage key={session.user.id} userId={session.user.id} />
}
