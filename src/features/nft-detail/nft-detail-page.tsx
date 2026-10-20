import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { HeartIcon, ShoppingCartIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import shareLinkedin from "@/assets/icons/share-linkedin.svg"
import shareMail from "@/assets/icons/share-mail.svg"
import shareTwitter from "@/assets/icons/share-twitter.svg"
import { BackButton, Breadcrumb } from "@/components/layout/page-parts"
import { EditionPicker } from "@/components/nft/edition-picker"
import { NftCarousel } from "@/components/nft/nft-carousel"
import { NftImage } from "@/components/nft/nft-image"
import { QuantityStepper } from "@/components/nft/quantity-stepper"
import { RatingPill, RatingStars } from "@/components/nft/rating"
import { Button } from "@/components/ui/button"
import { DesktopGallery, GALLERY_VIEWS, type GalleryViewId } from "@/features/nft-detail/gallery"
import { DetailTabs } from "@/features/nft-detail/detail-tabs"
import { usePurchaseOptions } from "@/features/nft-detail/use-purchase-options"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { formatEth, multiplyEth } from "@/lib/format"
import { relatedQuery } from "@/api/queries"
import { useAddToCartAction } from "@/features/cart/use-add-to-cart-action"
import { useFavorites, useToggleFavorite } from "@/features/favorites/use-favorites"
import type { Nft } from "@/types/domain"

type PurchaseOptions = ReturnType<typeof usePurchaseOptions>

export function NftDetailPage({ nft }: { nft: Nft }) {
  usePageTitle(nft.name)
  const isDesktop = useIsDesktop()
  const favorites = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const options = usePurchaseOptions(nft, {
    favorite: favorites.ids.has(nft.id),
    onToggleFavorite: () => toggleFavorite.toggle(nft.id, nft.name, favorites.ids.has(nft.id)),
  })
  const navigate = useNavigate()
  const cartAction = useAddToCartAction()
  const related = useQuery(relatedQuery(nft.id))

  function addToCart(goToCart = false) {
    cartAction.add(
      { nftId: nft.id, editionId: options.edition.id, quantity: options.quantity, name: nft.name, editionLabel: options.edition.label },
      { onSuccess: goToCart ? () => void navigate({ to: "/carrinho" }) : undefined }
    )
  }

  const buyNow = () => addToCart(true)
  const relatedItems = related.data?.items ?? []

  return isDesktop ? (
    <DesktopDetail nft={nft} options={options} onBuy={buyNow} busy={cartAction.isPending} related={relatedItems} />
  ) : (
    <MobileDetail nft={nft} options={options} onBuy={buyNow} onAddToCart={() => addToCart()} busy={cartAction.isPending} />
  )
}

function DesktopDetail({
  nft,
  options,
  onBuy,
  busy,
  related,
}: {
  nft: Nft
  options: PurchaseOptions
  onBuy: () => void
  busy: boolean
  related: Nft[]
}) {
  return (
    <div className="container-page mt-8">
      <Breadcrumb
        items={[
          { label: "Início", to: "/" },
          { label: "Mercado", to: "/", hash: "catalogo" },
        ]}
      />

      <div className="mt-3 flex items-start gap-8">
        <DesktopGallery nft={nft} />

        <section aria-labelledby="nft-title" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3 border-b-[0.6px] border-line-soft pb-3">
            <h1 id="nft-title" className="text-[28px] font-bold text-cream">
              {nft.name}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[22px] leading-4 font-bold text-brand-text">
                <span className="sr-only">Preço unitário: </span>
                {formatEth(nft.price)}
              </p>
              <RatingStars rating={nft.rating} reviewsCount={nft.reviewsCount} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[15px] leading-4 font-bold text-cream">Sobre este NFT:</h2>
            <p className="text-sm leading-6 text-sand">{nft.summary}</p>
          </div>

          <EditionPicker editions={nft.editions} value={options.editionId} onChange={options.selectEdition} />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <QuantityStepper
              size="lg"
              value={options.quantity}
              onChange={options.setQuantity}
              max={options.maxQuantity}
              itemName={nft.name}
            />
            <div className="flex gap-2">
              <Button className="w-[130px] font-bold" disabled={options.soldOut || busy} aria-busy={busy} onClick={onBuy}>
                COMPRAR
              </Button>
              <Button
                variant="outline"
                className="w-[130px]"
                aria-pressed={options.favorite}
                onClick={options.toggleFavorite}
              >
                <HeartIcon className={cn(options.favorite && "fill-brand-text")} aria-hidden="true" />
                {options.favorite ? "Favorito" : "Favoritar"}
              </Button>
            </div>
          </div>

          <AvailabilityNote options={options} />

          <TokenInfo nft={nft} />
          <ShareLinks nft={nft} />
        </section>
      </div>

      <div className="mt-24">
        <DetailTabs nft={nft} />
      </div>

      {related.length > 0 ? <NftCarousel title="Mais desta coleção" nfts={related} className="mt-24" /> : null}
    </div>
  )
}

function MobileDetail({
  nft,
  options,
  onBuy,
  onAddToCart,
  busy,
}: {
  nft: Nft
  options: PurchaseOptions
  onBuy: () => void
  onAddToCart: () => void
  busy: boolean
}) {
  const [view, setView] = useState<GalleryViewId>("completa")
  const current = GALLERY_VIEWS.find((item) => item.id === view)!

  return (
    <div className="relative mx-auto min-h-dvh max-w-[720px] bg-surface pb-[188px]">
      <div className="bg-gradient-card px-7 pt-6 pb-[134px]">
        <div className="flex items-center justify-between">
          <BackButton />
          <button
            type="button"
            onClick={options.toggleFavorite}
            aria-pressed={options.favorite}
            aria-label={options.favorite ? "Remover dos favoritos" : "Favoritar"}
            className="flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface-raised text-amber"
          >
            <HeartIcon className={cn("size-4", options.favorite && "fill-amber")} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2 overflow-hidden rounded-3xl">
          <NftImage
            artwork={nft.artwork}
            sizes="(min-width: 48rem) 660px, 100vw"
            priority
            alt={`${nft.name} — ${current.label.toLowerCase()}`}
            className="aspect-[361/356] w-full transition-transform duration-300"
            style={current.style}
          />
        </div>
        <div role="group" aria-label="Vistas da arte" className="mt-2 flex justify-center gap-1">
          {GALLERY_VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
              aria-label={item.label}
              className="flex h-6 w-5 cursor-pointer items-center justify-center"
            >
              <span
                className={cn(
                  "h-[7px] rounded-full transition-all",
                  view === item.id ? "w-[18px] bg-brand" : "w-[7px] bg-sand/50"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <section
        aria-labelledby="nft-title"
        className="relative -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-surface px-6 pt-8 pb-10"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 id="nft-title" className="text-xl leading-6 font-bold text-cream">
            {nft.name}
          </h1>
          <RatingPill rating={nft.rating} reviewsCount={nft.reviewsCount} className="shrink-0" />
        </div>
        <p className="text-sm leading-6 text-sand">{nft.summary}</p>
        <EditionPicker editions={nft.editions} value={options.editionId} onChange={options.selectEdition} />
        <AvailabilityNote options={options} />
        <TokenInfo nft={nft} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[720px] rounded-t-[40px] bg-surface px-6 pt-5 pb-[max(36px,env(safe-area-inset-bottom))] shadow-float">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] leading-4 font-medium text-sand" aria-hidden="true">
                Qtd.
              </span>
              <QuantityStepper
                value={options.quantity}
                onChange={options.setQuantity}
                max={options.maxQuantity}
                itemName={nft.name}
              />
            </div>
            <p className="text-xl leading-4 font-bold text-brand-text" aria-live="polite">
              <span className="sr-only">Total: </span>
              {formatEth(multiplyEth(nft.price, options.quantity))}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="cta" size="xl" className="flex-1 sm:max-w-[196px]" disabled={options.soldOut || busy} aria-busy={busy} onClick={onBuy}>
              Comprar NFT
            </Button>
            <button
              type="button"
              onClick={onAddToCart}
              disabled={options.soldOut || busy}
              aria-label="Adicionar ao carrinho"
              className="flex size-[60px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-raised text-amber transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCartIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AvailabilityNote({ options }: { options: PurchaseOptions }) {
  const { edition, soldOut } = options
  return (
    <p className={cn("text-sm", soldOut ? "text-coral" : "text-sand")} aria-live="polite">
      {soldOut
        ? `A edição ${edition.label} está esgotada. Escolha outra edição.`
        : edition.supply === null
          ? "Edição aberta — até 10 unidades por pedido."
          : `${edition.available} de ${edition.supply} disponíveis nesta edição.`}
    </p>
  )
}

function TokenInfo({ nft }: { nft: Nft }) {
  return (
    <dl className="flex flex-col gap-3 text-[15px] text-taupe">
      <div className="flex gap-1.5">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt>Coleção:</dt>
        <dd>{nft.collection}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.join(", ")}</dd>
      </div>
    </dl>
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = typeof window === "undefined" ? "" : window.location.href
  const text = `Confira ${nft.name} na Kurio`
  const links = [
    {
      label: "LinkedIn",
      icon: shareLinkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      size: "h-[14px] w-[15px]",
    },
    {
      label: "e-mail",
      icon: shareMail,
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      size: "size-[18px]",
    },
    {
      label: "X (Twitter)",
      icon: shareTwitter,
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      size: "h-3 w-4",
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] leading-4 font-bold text-cream">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-1">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${link.label}`}
              className="flex size-7 items-center justify-center rounded-xs transition-opacity hover:opacity-75"
            >
              <img src={link.icon} alt="" className={link.size} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
