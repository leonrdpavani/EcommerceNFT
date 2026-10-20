import { createFileRoute, stripSearchParams } from "@tanstack/react-router"

import { HomePage } from "@/features/home/home-page"
import { catalogSearchSchema, DEFAULT_CATALOG_SEARCH } from "@/lib/catalog-search"

export const Route = createFileRoute("/")({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  component: HomeRoute,
})

function HomeRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <HomePage
      search={search}
      onSearchChange={(patch) =>
        void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), resetScroll: false })
      }
      onReset={() => void navigate({ search: {}, resetScroll: false })}
    />
  )
}
