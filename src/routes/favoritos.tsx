import { createFileRoute } from "@tanstack/react-router"

import { FavoritesPage } from "@/features/favorites/favorites-page"
import { requireSession } from "@/features/session/require-auth"

export const Route = createFileRoute("/favoritos")({
  beforeLoad: requireSession,
  component: FavoritesPage,
})
