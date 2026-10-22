import { Link } from "@tanstack/react-router"
import { EyeIcon, HeartIcon, ShoppingCartIcon } from "lucide-react"
import { cn } from "cn"

import { NftImage } from "@/components/nft/nft-image"
import { Price } from "@/components/nft/price"
import { RareBadge } from "@/components/nft/rare-badge"
import type { Nft } from "@/types/domain"

type CardVariant = "grid" | "compact" | "mobile"

interface NftCardProps {
  nft: Nft
  variant?: CardVariant
  favorite?: boolean
  onToggleFavorite?: (nft: Nft) => void
  onAddToCart?: (nft: Nft) => void
  priority?: boolean
  className?: string
}

const SIZES: Record<CardVariant, string> = {
  grid: "(min-width: 64rem) 250px, (min-width: 48rem) 30vw, 45vw",
  compact: "(min-width: 64rem) 212px, 45vw",
  mobile: "(min-width: 48rem) 30vw, 45vw",
}

export function NftCard({
  nft,
  variant = "grid",
  favorite = false,
  onToggleFavorite,
  onAddToCart,
  priority,
  className,
}: NftCardProps) {
  const isMobile = variant === "mobile"
  // Desktop: ações aparecem no hover/foco. Telas menores: só o coração, sempre visível.
  const hasHoverActions = variant === "grid" || variant === "compact"
  const hasHeartButton = variant === "mobile" || variant === "compact"
  const titleId = `nft-card-${variant}-${nft.id}`

  return (
    <article aria-labelledby={titleId} className={cn("group relative flex flex-col", isMobile ? "gap-2" : "gap-3", className)}>
      {/* Sem `isolate`: os botões (z-10) precisam ficar acima do link esticado do título (::after). */}
      <div
        className={cn(
          "relative flex justify-center overflow-hidden",
          variant === "grid" && "bg-surface px-1 pt-6 pb-7",
          variant === "compact" && "bg-surface px-1 pt-4 pb-6",
          isMobile && "rounded-2xl bg-gradient-card px-1 pt-3 pb-5"
        )}
      >
        <NftImage
          artwork={nft.artwork}
          sizes={SIZES[variant]}
          priority={priority}
          className={cn(
            "w-full transition-transform duration-300 group-hover:scale-[1.02]",
            variant === "grid" && "rounded-xl",
            variant === "compact" && "rounded-[13px]",
            isMobile && "rounded-2xl"
          )}
        />

        {nft.badge === "raro" ? <RareBadge className="pointer-events-none absolute top-4 left-0 z-10" /> : null}

        {hasHeartButton && onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(nft)}
            aria-pressed={favorite}
            aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className={cn(
              "absolute top-5 right-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full bg-ink/80 text-brand-text ring-1 ring-brand/60 backdrop-blur-sm",
              variant === "compact" && "lg:hidden"
            )}
          >
            <HeartIcon className={cn("size-4", favorite && "fill-brand-text")} aria-hidden="true" />
          </button>
        ) : null}

        {hasHoverActions ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 z-10",
              variant === "grid" ? "bottom-9" : "bottom-8",
              "flex justify-center gap-2.5 opacity-0 transition-opacity duration-200 *:pointer-events-auto group-focus-within:opacity-100 group-hover:opacity-100 max-lg:hidden"
            )}
          >
            {onAddToCart ? (
              <CardAction label={`Adicionar ${nft.name} ao carrinho`} onClick={() => onAddToCart(nft)}>
                <ShoppingCartIcon aria-hidden="true" />
              </CardAction>
            ) : null}
            {onToggleFavorite ? (
              <CardAction
                label={favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
                pressed={favorite}
                onClick={() => onToggleFavorite(nft)}
              >
                <HeartIcon className={cn(favorite && "fill-brand-text text-brand-text")} aria-hidden="true" />
              </CardAction>
            ) : null}
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              tabIndex={-1}
              aria-hidden="true"
              className="flex size-[35px] items-center justify-center bg-surface text-cream transition-colors hover:text-brand-text [&_svg]:size-5"
            >
              <EyeIcon />
            </Link>
          </div>
        ) : null}
      </div>

      <div className={cn("flex flex-col", isMobile ? "pl-2" : "gap-1.5")}>
        <h3
          id={titleId}
          className={cn(
            "text-cream",
            variant === "grid" && "text-base leading-4",
            variant === "compact" && "text-[15px] leading-[18px]",
            isMobile && "text-[15px] leading-[18px]"
          )}
        >
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-brand-text"
          >
            {nft.name}
          </Link>
        </h3>
        <Price value={nft.price} compareAt={nft.compareAtPrice} className={cn(variant === "grid" ? "text-lg" : "text-base")} />
      </div>
    </article>
  )
}

function CardAction({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="relative z-10 flex size-[35px] cursor-pointer items-center justify-center bg-surface text-cream transition-colors hover:text-brand-text [&_svg]:size-5"
    >
      {children}
    </button>
  )
}

export function NftCardSkeleton({ variant = "grid" }: { variant?: CardVariant }) {
  const isMobile = variant === "mobile"
  return (
    <div className={cn("flex flex-col", isMobile ? "gap-2" : "gap-3")} aria-hidden="true">
      <div
        className={cn(
          "flex justify-center",
          variant === "grid" && "bg-surface px-1 pt-6 pb-7",
          variant === "compact" && "bg-surface px-1 pt-4 pb-6",
          isMobile && "rounded-2xl bg-surface px-1 pt-3 pb-5"
        )}
      >
        <div className={cn("aspect-square w-full", isMobile ? "rounded-2xl" : "rounded-xl")}>
          <SkeletonBlock className="size-full rounded-[inherit]" />
        </div>
      </div>
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-4 w-1/3" />
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xs bg-[linear-gradient(90deg,var(--kurio-surface-raised)_25%,var(--kurio-surface-dark)_50%,var(--kurio-surface-raised)_75%)] bg-[length:200%_100%]",
        className
      )}
    />
  )
}
