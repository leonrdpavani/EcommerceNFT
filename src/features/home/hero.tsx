import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import mobileHeroRings from "@/assets/decor/mobile-hero-rings.svg"
import { NftImage } from "@/components/nft/nft-image"
import { buttonVariants } from "@/components/ui/button"

function HeroDots({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="size-2 rounded-full bg-brand" />
      ))}
    </div>
  )
}

/** Hero desktop (Figma: Desktop / Início › Top › Hero). */
export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="mt-8 flex min-h-[450px] items-center justify-between gap-10 pl-10">
      <div className="flex max-w-[600px] flex-1 flex-col items-end gap-11">
        <div className="flex w-full flex-col items-start gap-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2 text-cream">
              <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
              <h1 id="hero-title" className="text-[clamp(34px,3.6vw,43px)] leading-[70px] font-bold">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
            </div>
            <p className="max-w-[557px] text-sm leading-6 text-sand">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
              artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Link to="/" hash="catalogo" className={buttonVariants({ className: "h-10 w-[140px] text-base" })}>
            EXPLORAR
          </Link>
        </div>
        <HeroDots className="flex w-10 justify-between" />
      </div>
      <div className="size-[min(450px,40vw)] shrink-0 overflow-hidden rounded-3xl">
        <NftImage
          artwork="emerald-ape"
          sizes="(min-width: 64rem) 450px, 40vw"
          priority
          alt="Emerald Ape #042: macaco com óculos redondos verdes e jaqueta college verde, destaque da coleção"
          className="size-full"
        />
      </div>
    </section>
  )
}

/** Banner do hero no mobile (Figma: Mobile / Início › Hero Banner). */
export function MobileHomeHero() {
  return (
    <section
      aria-labelledby="mobile-hero-title"
      className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[30px] p-4"
    >
      <img
        src={mobileHeroRings}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover select-none"
      />
      <div className="relative flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-xs leading-4 font-medium text-cream">Bem-vindo à Kurio</p>
          <h1 id="mobile-hero-title" className="text-lg leading-[29px] font-bold text-cream">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </h1>
          <p className="text-xs leading-[18px] text-sand">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <Link
            to="/"
            hash="catalogo"
            className="mt-1 inline-flex w-fit items-center gap-2 py-1 text-xs leading-[14px] font-bold text-brand-text"
          >
            EXPLORAR
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative size-[clamp(112px,36vw,138px)] shrink-0">
          <NftImage
            artwork="emerald-ape"
            sizes="138px"
            priority
            alt="Emerald Ape #042 em destaque"
            className="size-full rounded-2xl"
          />
          <NftImage
            artwork="sage-nomad"
            sizes="58px"
            alt=""
            className="absolute bottom-0 left-3.5 size-[42%] rounded-2xl ring-2 ring-surface"
          />
        </div>
      </div>
      <HeroDots className="relative flex w-[33px] justify-between [&>span]:size-[7px]" />
    </section>
  )
}
