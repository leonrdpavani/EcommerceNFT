import { useQueries } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { HeartIcon } from "lucide-react"
import { cn } from "cn"

import { nftQuery } from "@/api/queries"
import { QueryError } from "@/components/feedback/query-error"
import { MobileScreenHeader } from "@/components/layout/page-parts"
import { NftCard, NftCardSkeleton } from "@/components/nft/nft-card"
import { buttonVariants } from "@/components/ui/button"
import { useFavorites, useToggleFavorite } from "@/features/favorites/use-favorites"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import type { Nft } from "@/types/domain"

/** Lista de interesse. Sem frame no Figma: segue os padrões visuais do catálogo. */
export function FavoritesPage() {
  usePageTitle("Lista de interesse")
  const isDesktop = useIsDesktop()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const ids = favorites.data?.nftIds ?? []
  const nfts = useQueries({ queries: ids.map((id) => nftQuery(id)) })
  const items = nfts.flatMap((query) => (query.data ? [query.data] : []))
  const loading = favorites.isPending || nfts.some((query) => query.isPending)

  const variant = isDesktop ? "grid" : "mobile"

  return (
    <div className={isDesktop ? "container-page mt-8" : "mx-auto flex max-w-[720px] flex-col gap-6 px-6 pt-8"}>
      {isDesktop ? (
        <h1 className="border-b-[0.6px] border-line-soft pb-3 text-[17px] leading-4 font-bold text-brand-text">Lista de interesse</h1>
      ) : (
        <MobileScreenHeader title="Favoritos" />
      )}

      <div className="mt-8">
        {favorites.isError ? (
          <QueryError message={favorites.error.message} onRetry={() => void favorites.refetch()} />
        ) : loading ? (
          <ul className={cn("grid gap-x-6 gap-y-10", isDesktop ? "grid-cols-4" : "grid-cols-2")} aria-hidden="true">
            {Array.from({ length: Math.max(ids.length, 2) }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton variant={variant} />
              </li>
            ))}
          </ul>
        ) : items.length > 0 ? (
          <ul className={cn("grid gap-x-6 gap-y-10", isDesktop ? "grid-cols-4" : "grid-cols-2 gap-x-4")}>
            {items.map((nft: Nft) => (
              <li key={nft.id}>
                <NftCard nft={nft} variant={variant} favorite onToggleFavorite={() => toggle.toggle(nft.id, nft.name, true)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-soft px-6 py-16 text-center">
            <HeartIcon className="size-10 text-brand-text" aria-hidden="true" />
            <h2 className="text-lg font-bold text-cream">Nenhum favorito por aqui</h2>
            <p className="max-w-[40ch] text-sm leading-6 text-sand">
              Toque no coração de um NFT para guardá-lo na sua lista. Seus favoritos ficam salvos na sua conta.
            </p>
            <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
              Explorar o mercado
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
