import { SearchXIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { NftCard } from "@/components/nft/nft-card"
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
import { queryCatalog } from "@/mocks/catalog-query"
import { NFT_FIXTURES } from "@/mocks/fixtures/nfts"
import type { Nft } from "@/types/domain"

interface HomePageProps {
  search: CatalogSearch
  onSearchChange: (patch: CatalogPatch) => void
  onReset: () => void
}

export function HomePage({ search, onSearchChange, onReset }: HomePageProps) {
  const isDesktop = useIsDesktop()
  // Pré-visualização: na integração, os resultados vêm de GET /nfts via TanStack Query.
  const result = useMemo(() => queryCatalog(NFT_FIXTURES, search), [search])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  function toggleFavorite(nft: Nft) {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(nft.id)) next.delete(nft.id)
      else next.add(nft.id)
      return next
    })
  }

  function addToCart(nft: Nft) {
    toast.info(`Pré-visualização: ${nft.name} ainda não é enviado ao carrinho nesta etapa.`)
  }

  const resultsLabel = `${result.total} ${result.total === 1 ? "NFT encontrado" : "NFTs encontrados"}`

  const grid =
    result.items.length > 0 ? (
      <ul
        className={cn(
          "grid",
          isDesktop
            ? "grid-cols-3 gap-x-[30px] gap-y-[72px]"
            : "grid-cols-2 gap-x-4 gap-y-6 pb-8 md:grid-cols-3 max-md:[&>li:nth-child(even)]:translate-y-8"
        )}
      >
        {result.items.map((nft, index) => (
          <li key={nft.id}>
            <NftCard
              nft={nft}
              variant={isDesktop ? "grid" : "mobile"}
              favorite={favorites.has(nft.id)}
              onToggleFavorite={toggleFavorite}
              onAddToCart={addToCart}
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
        <MobileCatalogControls search={search} facets={result.facets} onChange={onSearchChange} onReset={onReset} />
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
          <Pagination page={result.page} pageCount={result.pageCount} className="flex justify-center pt-4" />
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
          <CatalogFilters search={search} facets={result.facets} onChange={onSearchChange} onReset={onReset} />
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
          <Pagination page={result.page} pageCount={result.pageCount} />
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
