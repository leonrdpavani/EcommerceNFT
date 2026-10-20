import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import promoRings from "@/assets/decor/promo-rings.svg"
import { NftImage } from "@/components/nft/nft-image"
import { buttonVariants } from "@/components/ui/button"
import type { ArtworkKey, CatalogTab } from "@/types/domain"

const PROMOS: { title: [string, string]; text: string; artwork: ArtworkKey; tab: CatalogTab }[] = [
  {
    title: ["Lançamentos gênesis", "de edição limitada"],
    text: "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
    artwork: "emerald-ape",
    tab: "novos",
  },
  {
    title: ["Arte digital selecionada", "e muito mais"],
    text: "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
    artwork: "ivory-baron",
    tab: "em-alta",
  },
]

export function PromoCards() {
  return (
    <section aria-label="Destaques do mercado" className="grid gap-7 md:grid-cols-2">
      {PROMOS.map((promo) => (
        <article
          key={promo.title[0]}
          className="relative isolate flex min-h-[250px] overflow-hidden rounded-lg bg-surface"
        >
          <NftImage
            artwork={promo.artwork}
            sizes="(min-width: 64rem) 292px, 45vw"
            alt=""
            className="absolute top-0 -left-[5px] h-full w-[50%] max-w-[292px] rounded-[18px]"
          />
          <img
            src={promoRings}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-0 size-full select-none"
          />
          <div className="relative z-10 ml-auto flex w-[52%] flex-col items-end gap-4 py-9 pr-[30px] pl-2 text-right">
            <h2 className="text-lg leading-6 font-bold text-cream">
              {promo.title[0]}
              <br />
              {promo.title[1]}
            </h2>
            <p className="max-w-[263px] text-sm leading-6 text-sand">{promo.text}</p>
            <Link
              to="/"
              search={(prev) => ({ ...prev, tab: promo.tab, page: 1 })}
              hash="catalogo"
              className={buttonVariants({ className: "mt-auto h-10 w-[140px] gap-1 font-medium" })}
              aria-label={`Explorar ${promo.title.join(" ").toLowerCase()}`}
            >
              Explorar
              <ArrowRightIcon className="size-[18px]" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
