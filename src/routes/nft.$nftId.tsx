import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { isApiError } from "@/api/http"
import { nftQuery } from "@/api/queries"
import { QueryError } from "@/components/feedback/query-error"
import { NftDetailPage } from "@/features/nft-detail/nft-detail-page"
import { NftDetailSkeleton } from "@/features/nft-detail/nft-detail-skeleton"
import { NotFoundPage } from "@/features/not-found/not-found-page"

export const Route = createFileRoute("/nft/$nftId")({
  // Pré-carrega sem bloquear a navegação: o skeleton aparece imediatamente.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftQuery(params.nftId))
  },
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  const nft = useQuery(nftQuery(nftId))

  if (nft.isPending) return <NftDetailSkeleton />
  if (nft.isError) {
    if (isApiError(nft.error) && nft.error.code === "NOT_FOUND") {
      return (
        <NotFoundPage
          title="NFT não encontrado"
          description="Este NFT não existe ou foi removido do mercado. Explore o catálogo para encontrar outras obras."
        />
      )
    }
    return (
      <div className="container-page py-16">
        <QueryError message={nft.error.message} onRetry={() => void nft.refetch()} />
      </div>
    )
  }
  // `key` reinicia edição/quantidade ao navegar entre NFTs.
  return <NftDetailPage key={nft.data.id} nft={nft.data} />
}
