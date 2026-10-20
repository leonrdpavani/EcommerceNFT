import { useQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { isApiError } from "@/api/http"
import { nftQuery } from "@/api/queries"
import { QueryError } from "@/components/feedback/query-error"
import { NftDetailPage } from "@/features/nft-detail/nft-detail-page"
import { NftDetailSkeleton } from "@/features/nft-detail/nft-detail-skeleton"
import { NotFoundPage } from "@/features/not-found/not-found-page"

export const Route = createFileRoute("/nft/$nftId")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(nftQuery(params.nftId))
    } catch (error) {
      if (isApiError(error) && error.code === "NOT_FOUND") throw notFound()
      throw error
    }
  },
  pendingComponent: NftDetailSkeleton,
  pendingMs: 150,
  component: NftDetailRoute,
  errorComponent: ({ error, reset }) => (
    <div className="container-page py-16">
      <QueryError message={error instanceof Error ? error.message : "Erro inesperado."} onRetry={reset} />
    </div>
  ),
  notFoundComponent: () => (
    <NotFoundPage
      title="NFT não encontrado"
      description="Este NFT não existe ou foi removido do mercado. Explore o catálogo para encontrar outras obras."
    />
  ),
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  const { data: nft } = useQuery(nftQuery(nftId))
  if (!nft) return <NftDetailSkeleton />
  // `key` reinicia edição/quantidade ao navegar entre NFTs.
  return <NftDetailPage key={nft.id} nft={nft} />
}
