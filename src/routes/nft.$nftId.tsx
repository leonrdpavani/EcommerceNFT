import { createFileRoute, notFound } from "@tanstack/react-router"

import { NftDetailPage } from "@/features/nft-detail/nft-detail-page"
import { NotFoundPage } from "@/features/not-found/not-found-page"
import { findNft } from "@/preview"

export const Route = createFileRoute("/nft/$nftId")({
  // Pré-visualização: na integração, o loader usa GET /nfts/:id (404 → notFound()).
  loader: ({ params }) => {
    const nft = findNft(params.nftId)
    if (!nft) throw notFound()
    return nft
  },
  component: NftDetailRoute,
  notFoundComponent: () => (
    <NotFoundPage
      title="NFT não encontrado"
      description="Este NFT não existe ou foi removido do mercado. Explore o catálogo para encontrar outras obras."
    />
  ),
})

function NftDetailRoute() {
  const nft = Route.useLoaderData()
  // `key` reinicia edição/quantidade ao navegar entre NFTs.
  return <NftDetailPage key={nft.id} nft={nft} />
}
