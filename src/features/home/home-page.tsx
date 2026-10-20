import { SearchXIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "cn"

import { NftCard, NftCardSkeleton } from "@/components/nft/nft-card"
import { QueryError } from "@/components/feedback/query-error"
import { catalogQuery } from "@/api/queries"
import { useAddToCartAction } from "@/features/cart/use-add-to-cart-action"
import { useFavorites, useToggleFavorite } from "@/features/favorites/use-favorites"
import { defaultEdition } from "@/lib/editions"
import { Button } from "@/components/ui/button"
import { BlogSection } from "@/features/home/blog-section"
import { CatalogFilters, type CatalogPatch } from "@/features/home/catalog-filters"
import { CatalogSortSelect, CatalogTabs } from "@/features/home/catalog-toolbar"
import { FeaturedBanner } from "@/features/home/featured-banner"
import { HomeHero, MobileHomeHero } from "@/features/home/hero"
import { MobileCatalogControls } from "@/features/home/mobile-catalog-controls"
import { Pagination } from "@/features/home/pagination"
import { PromoCards } from "@/features/home/promo-cards"
import { useIsDesktop } from "@/hooks/use-media-query"
import type { CatalogSearch } from "@/lib/catalog-search"
import type { Nft } from "@/types/domain"

const EMPTY_FACETS = { categories: {}, networks: {} }

interface HomePageProps {
  search: CatalogSearch
  onSearchChange: (patch: CatalogPatch) => void
  onReset: () => void
}

export function HomePage({ search, onSearchChange, onReset }: HomePageProps) {
  const isDesktop = useIsDesktop()
  const catalog = useQuery(catalogQuery(search))
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const addToCart = useAddToCartAction()

  const result = catalog.data
  const facets = result?.facets ?? EMPTY_FACETS

  function handleFavorite(nft: Nft) {
    toggleFavorite.toggle(nft.id, nft.name, favorites.ids.has(nft.id))
  }

  function handleAddToCart(nft: Nft) {
    const edition = defaultEdition(nft)
    if (!edition) {
      toast.error(`Todas as edições de ${nft.name} estão esgotadas.`)
      return
    }
    addToCart.add({ nftId: nft.id, editionId: edition.id, quantity: 1, name: nft.name, editionLabel: edition.label })
  }

  const total = result?.total ?? 0
  const resultsLabel = catalog.isPending ? "Carregando NFTs…" : `${total} ${total === 1 ? "NFT encontrado" : "NFTs encontrados"}`

  const gridClass = cn(
    "grid transition-opacity",
    isDesktop
      ? "grid-cols-3 gap-x-[30px] gap-y-[72px]"
      : "grid-cols-2 gap-x-4 gap-y-6 pb-8 md:grid-cols-3 max-md:[&>li:nth-child(even)]:translate-y-8",
    catalog.isPlaceholderData && "opacity-60"
  )

  const grid = catalog.isPending ? (
    <ul className={gridClass} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <NftCardSkeleton variant={isDesktop ? "grid" : "mobile"} />
        </li>
      ))}
    </ul>
  ) : catalog.isError && !result ? (
    <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  ) : result && result.items.length > 0 ? (
    <ul className={gridClass} aria-busy={catalog.isFetching}>
      {result.items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard
            nft={nft}
            variant={isDesktop ? "grid" : "mobile"}
            favorite={favorites.ids.has(nft.id)}
            onToggleFavorite={handleFavorite}
            onAddToCart={handleAddToCart}
            priority={!isDesktop && index < 2}
          />
        </li>
      ))}
    </ul>
  ) : (
    <EmptyCatalog onReset={onReset} />
  )

  if (!isDesktop) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 pt-10">
        <MobileCatalogControls search={search} facets={facets} onChange={onSearchChange} onReset={onReset} />
        <MobileHomeHero />
        <section id="catalogo" aria-labelledby="catalog-title" className="flex scroll-mt-4 flex-col gap-4">
          <h2 id="catalog-title" className="sr-only">
            Catálogo de NFTs
          </h2>
          <CatalogTabs value={search.tab} onChange={(tab) => onSearchChange({ tab })} size="sm" />
          <p className="sr-only" aria-live="polite">
            {resultsLabel}
          </p>
          {grid}
          <Pagination page={result?.page ?? 1} pageCount={result?.pageCount ?? 1} className="flex justify-center pt-4" />
        </section>
        <div className="mt-12 flex flex-col gap-14">
          <PromoCards />
          <BlogSection />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page">
      <HomeHero />

      <section
        id="catalogo"
        aria-labelledby="catalog-title"
        className="mt-20 grid scroll-mt-6 grid-cols-[310px_minmax(0,1fr)] items-start gap-12"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <aside aria-label="Filtros do catálogo" className="flex flex-col gap-6">
          <CatalogFilters search={search} facets={facets} onChange={onSearchChange} onReset={onReset} />
          <FeaturedBanner nftId="sage-nomad-009" nftName="Sage Nomad #009" />
        </aside>

        <div className="flex flex-col items-end gap-[88px]">
          <div className="flex w-full flex-col gap-8">
            <div className="flex items-start justify-between gap-6">
              <CatalogTabs value={search.tab} onChange={(tab) => onSearchChange({ tab })} />
              <CatalogSortSelect value={search.sort} onChange={(sort) => onSearchChange({ sort })} />
            </div>
            <p className="sr-only" aria-live="polite">
              {resultsLabel}
            </p>
            {search.q ? (
              <p className="-mt-4 text-sm text-sand">
                Resultados para <strong className="text-cream">“{search.q}”</strong> — {resultsLabel}.{" "}
                <button
                  type="button"
                  className="cursor-pointer text-brand-text hover:underline"
                  onClick={() => onSearchChange({ q: undefined })}
                >
                  Limpar busca
                </button>
              </p>
            ) : null}
            {grid}
          </div>
          <Pagination page={result?.page ?? 1} pageCount={result?.pageCount ?? 1} />
        </div>
      </section>

      <div className="mt-20 flex flex-col gap-20">
        <PromoCards />
        <BlogSection />
      </div>
    </div>
  )
}

function EmptyCatalog({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-soft px-6 py-16 text-center">
      <SearchXIcon className="size-10 text-brand-text" aria-hidden="true" />
      <h3 className="text-lg font-bold text-cream">Nenhum NFT encontrado</h3>
      <p className="max-w-[40ch] text-sm leading-6 text-sand">
        Não há resultados para a combinação de busca e filtros atual. Ajuste os filtros ou comece de novo.
      </p>
      <Button variant="outline" onClick={onReset}>
        Limpar busca e filtros
      </Button>
    </div>
  )
}
