import { createFileRoute } from "@tanstack/react-router"

import { WalletsPage } from "@/features/account/wallets-page"

export const Route = createFileRoute("/conta/carteiras")({
  component: WalletsRoute,
})

function WalletsRoute() {
  const { session } = Route.useRouteContext()
  return <WalletsPage key={session.user.id} userId={session.user.id} />
}
