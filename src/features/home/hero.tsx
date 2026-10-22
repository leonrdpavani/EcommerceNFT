import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { memo, useEffect, useState, type RefObject } from "react"
import { cn } from "cn"

import mobileHeroRings from "@/assets/decor/mobile-hero-rings.svg"
import { NftImage } from "@/components/nft/nft-image"
import { buttonVariants } from "@/components/ui/button"
import { useSnapPager } from "@/hooks/use-snap-pager"
import type { ArtworkKey, CatalogTab } from "@/types/domain"

interface HeroSlide {
  title: [string, string]
  mobileTitle: [string, string]
  text: string
  mobileText: string
  artwork: ArtworkKey
  alt: string
  /** Aba do catálogo aberta pelo "Explorar" (sem aba: catálogo como está). */
  tab?: CatalogTab
}

const SLIDES: HeroSlide[] = [
  {
    title: ["SEJA DONO DO FUTURO", "DA ARTE DIGITAL"],
    mobileTitle: ["SEJA DONO DA", "CULTURA DIGITAL"],
    text: "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.",
    mobileText: "Descubra NFTs selecionados de criadores do mundo todo.",
    artwork: "emerald-ape",
    alt: "Emerald Ape #042: macaco com óculos redondos verdes e jaqueta college verde, destaque da coleção",
  },
  {
    title: ["NOVOS LANÇAMENTOS", "TODA SEMANA"],
    mobileTitle: ["NOVOS", "LANÇAMENTOS"],
    text: "Edições recém-cunhadas chegam ao mercado toda semana. Garanta as primeiras unidades antes que se esgotem.",
    mobileText: "Edições recém-cunhadas toda semana.",
    artwork: "golden-beat",
    alt: "Golden Beat #207: macaco dourado com fones de ouvido verdes",
    tab: "novos",
  },
  {
    title: ["AS COLEÇÕES MAIS", "DESEJADAS DO MOMENTO"],
    mobileTitle: ["EM ALTA", "NA KURIO"],
    text: "Veja o que os colecionadores estão disputando agora: as obras com mais procura e as edições quase esgotadas.",
    mobileText: "As coleções mais disputadas agora.",
    artwork: "ivory-baron",
    alt: "Ivory Baron #088: macaco de pelo escuro com blazer marfim e gola alta verde",
    tab: "em-alta",
  },
]

/** Link "Explorar" de um slide: leva ao catálogo (na aba do slide, quando houver). */
function ExploreLink({ slide, className, children }: { slide: HeroSlide; className: string; children: React.ReactNode }) {
  const label = `Explorar ${slide.title.join(" ").toLowerCase()}`
  return slide.tab ? (
    <Link
      to="/"
      search={(prev) => ({ ...prev, tab: slide.tab, page: 1 })}
      hash="catalogo"
      className={className}
      aria-label={label}
    >
      {children}
    </Link>
  ) : (
    <Link to="/" hash="catalogo" className={className}>
      {children}
    </Link>
  )
}

/** Indicadores do carrossel: um botão por slide; o atual fica marcado (aria-current). */
function HeroDots({
  count,
  page,
  onSelect,
  className,
  dotClassName,
}: {
  count: number
  page: number
  onSelect: (index: number) => void
  className?: string
  dotClassName?: string
}) {
  return (
    <div className={className} role="group" aria-label="Escolher destaque">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Destaque ${index + 1} de ${count}`}
          aria-current={index === page ? "true" : undefined}
          className="group flex size-6 cursor-pointer items-center justify-center rounded-full"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full bg-brand transition-[opacity,width] duration-300",
              index === page ? "opacity-100" : "opacity-40 group-hover:opacity-70",
              dotClassName
            )}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Os slides fora da tela só são montados depois do carregamento (em tempo ocioso) ou na primeira
 * interação com o carrossel (arrastar, focar, usar os pontos): assim não disputam rede e CPU com a
 * primeira pintura. Medido no Lighthouse mobile: sem isso, a home perde ~5 pontos (TBT/Speed Index).
 */
function useDeferredSlides(trackRef: RefObject<HTMLElement | null>) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const show = () => setReady(true)
    const track = trackRef.current
    const events = ["pointerdown", "focusin", "scroll"] as const
    events.forEach((name) => track?.addEventListener(name, show, { once: true, passive: true }))

    const hasIdle = typeof window.requestIdleCallback === "function"
    let idle = 0
    const schedule = () => {
      idle = hasIdle ? window.requestIdleCallback(show, { timeout: 2000 }) : window.setTimeout(show, 1000)
    }
    if (document.readyState === "complete") schedule()
    else window.addEventListener("load", schedule, { once: true })

    return () => {
      events.forEach((name) => track?.removeEventListener(name, show))
      window.removeEventListener("load", schedule)
      if (hasIdle) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [ready, trackRef])

  return ready
}

/** Trilho horizontal com scroll-snap (CSS): arrastar/rolar troca o slide; os pontos navegam. */
const TRACK = "scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"

/**
 * Hero desktop em carrossel (Figma: Desktop / Início › Top › Hero). Memoizado: não depende do
 * catálogo, então não re-renderiza (nem recalcula os links) quando os dados da home chegam.
 */
export const HomeHero = memo(function HomeHero() {
  const { trackRef, page, goTo } = useSnapPager<HTMLDivElement>()
  const restReady = useDeferredSlides(trackRef)

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques da Kurio" className="relative mt-8">
      <div ref={trackRef} className={TRACK}>
        {SLIDES.map((slide, index) => {
          // Espaço reservado com a largura do slide: o trilho rola e os pontos funcionam desde o início.
          if (index > 0 && !restReady)
            return <div key={slide.artwork} className="w-full shrink-0 snap-start" aria-hidden="true" />
          const Heading = index === 0 ? "h1" : "h2"
          return (
            <div
              key={slide.artwork}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${SLIDES.length}`}
              className="flex min-h-[450px] w-full shrink-0 snap-start items-center justify-between gap-10 pl-10"
            >
              <div className="flex max-w-[600px] flex-1 flex-col items-end gap-11">
                <div className="flex w-full flex-col items-start gap-8">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-2 text-cream">
                      <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
                      <Heading className="text-[clamp(34px,3.6vw,43px)] leading-[70px] font-bold">
                        {slide.title[0]}
                        <br />
                        {slide.title[1]}
                      </Heading>
                    </div>
                    <p className="max-w-[557px] text-sm leading-6 text-sand">{slide.text}</p>
                  </div>
                  <ExploreLink slide={slide} className={buttonVariants({ className: "h-10 w-[140px] text-base" })}>
                    EXPLORAR
                  </ExploreLink>
                </div>
                {/* Reserva o espaço dos indicadores (sobrepostos abaixo), como no Figma. */}
                <div className="h-6 w-[72px]" aria-hidden="true" />
              </div>
              <div className="size-[min(450px,40vw)] shrink-0 overflow-hidden rounded-3xl">
                <NftImage
                  artwork={slide.artwork}
                  sizes="(min-width: 64rem) 450px, 40vw"
                  priority={index === 0}
                  alt={slide.alt}
                  className="size-full"
                />
              </div>
            </div>
          )
        })}
      </div>
      {/*
        Indicadores sobrepostos ao trilho, na mesma grade do slide: uma cópia invisível do texto
        do 1º slide reproduz a altura da coluna e deixa os pontos onde o Figma os posiciona.
      */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between gap-10 pl-10">
        <div className="flex max-w-[600px] flex-1 flex-col items-end gap-11">
          <div className="invisible flex w-full flex-col items-start gap-8" aria-hidden="true">
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-2">
                <p className="text-sm leading-4 font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
                <p className="text-[clamp(34px,3.6vw,43px)] leading-[70px] font-bold">
                  {SLIDES[0].title[0]}
                  <br />
                  {SLIDES[0].title[1]}
                </p>
              </div>
              <p className="max-w-[557px] text-sm leading-6">{SLIDES[0].text}</p>
            </div>
            <span className="h-10" />
          </div>
          <HeroDots count={SLIDES.length} page={page} onSelect={goTo} className="pointer-events-auto flex h-6" />
        </div>
        <div className="size-[min(450px,40vw)] shrink-0" />
      </div>
    </section>
  )
})

/** Banner do hero no mobile, em carrossel (Figma: Mobile / Início › Hero Banner). Memoizado, como o desktop. */
export const MobileHomeHero = memo(function MobileHomeHero() {
  const { trackRef, page, goTo } = useSnapPager<HTMLDivElement>()
  const restReady = useDeferredSlides(trackRef)

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da Kurio"
      className="relative flex flex-col items-center gap-2 overflow-hidden rounded-[30px] py-4"
    >
      <img
        src={mobileHeroRings}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover select-none"
      />
      <div ref={trackRef} className={cn(TRACK, "relative w-full")}>
        {SLIDES.map((slide, index) => {
          // Espaço reservado com a largura do slide: o trilho rola e os pontos funcionam desde o início.
          if (index > 0 && !restReady)
            return <div key={slide.artwork} className="w-full shrink-0 snap-start" aria-hidden="true" />
          const Heading = index === 0 ? "h1" : "h2"
          return (
            <div
              key={slide.artwork}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${SLIDES.length}`}
              className="flex w-full shrink-0 snap-start items-center gap-2 px-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-xs leading-4 font-medium text-cream">Bem-vindo à Kurio</p>
                <Heading className="text-lg leading-[29px] font-bold text-cream">
                  {slide.mobileTitle[0]}
                  <br />
                  {slide.mobileTitle[1]}
                </Heading>
                <p className="text-xs leading-[18px] text-sand">{slide.mobileText}</p>
                <ExploreLink
                  slide={slide}
                  className="mt-1 inline-flex w-fit items-center gap-2 py-1 text-xs leading-[14px] font-bold text-brand-text"
                >
                  EXPLORAR
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </ExploreLink>
              </div>
              <div className="relative size-[clamp(112px,36vw,138px)] shrink-0">
                <NftImage
                  artwork={slide.artwork}
                  sizes="138px"
                  priority={index === 0}
                  alt={index === 0 ? "Emerald Ape #042 em destaque" : slide.alt}
                  className="size-full rounded-2xl"
                />
                {index === 0 ? (
                  <NftImage
                    artwork="sage-nomad"
                    sizes="58px"
                    alt=""
                    className="absolute bottom-0 left-3.5 size-[42%] rounded-2xl ring-2 ring-surface"
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <HeroDots count={SLIDES.length} page={page} onSelect={goTo} className="relative flex" dotClassName="size-[7px]" />
    </section>
  )
})
