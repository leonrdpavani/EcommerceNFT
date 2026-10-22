import { cn } from "cn"

import { NftCard } from "@/components/nft/nft-card"
import { useNftCardActions } from "@/components/nft/use-nft-card-actions"
import { SectionHeading } from "@/components/layout/page-parts"
import { useSnapPager } from "@/hooks/use-snap-pager"
import type { Nft } from "@/types/domain"

interface NftCarouselProps {
  title: string
  nfts: Nft[]
  className?: string
}

/** Carrossel horizontal com scroll-snap e indicadores de página (Figma: "Mais desta coleção"). */
export function NftCarousel({ title, nfts, className }: NftCarouselProps) {
  const { trackRef, page, pageCount, goTo } = useSnapPager<HTMLUListElement>()
  const cardActions = useNftCardActions()
  const headingId = `carousel-${title.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-8", className)}>
      <SectionHeading id={headingId}>{title}</SectionHeading>
      <ul
        ref={trackRef}
        className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-1 lg:justify-between lg:gap-[26px]"
      >
        {nfts.map((nft) => (
          <li key={nft.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[219px]">
            <NftCard
              nft={nft}
              variant="compact"
              favorite={cardActions.isFavorite(nft)}
              onToggleFavorite={cardActions.toggleFavorite}
              onAddToCart={cardActions.addToCart}
            />
          </li>
        ))}
      </ul>
      {pageCount > 1 ? (
        <div className="flex justify-center gap-0.5" role="group" aria-label={`Páginas de ${title}`}>
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para a página ${index + 1}`}
              aria-current={index === page ? "true" : undefined}
              className="group flex size-6 cursor-pointer items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-3 rounded-full border border-brand transition-colors",
                  index === page ? "bg-brand" : "bg-transparent group-hover:bg-brand/40"
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
