import { StarIcon } from "lucide-react"
import { cn } from "cn"

interface RatingStarsProps {
  rating: number
  reviewsCount: number
  className?: string
}

export function RatingStars({ rating, reviewsCount, className }: RatingStarsProps) {
  const filled = Math.round(rating)
  return (
    <p className={cn("flex items-center gap-1 text-[15px] text-cream", className)}>
      <span className="sr-only">Nota {rating.toFixed(1)} de 5. </span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            className={cn("size-[15px]", index < filled ? "fill-amber text-amber" : "fill-transparent text-sand/60")}
          />
        ))}
      </span>
      <span className="ml-1">{reviewsCount} avaliações de colecionadores</span>
    </p>
  )
}

export function RatingPill({ rating, reviewsCount, className }: RatingStarsProps) {
  return (
    <p
      className={cn(
        "inline-flex h-[27px] items-center gap-1.5 rounded-full border border-brand px-2.5 text-sm leading-4",
        className
      )}
    >
      <StarIcon className="size-3.5 fill-amber text-amber" aria-hidden="true" />
      <span className="font-medium text-cream">
        <span className="sr-only">Nota </span>
        {rating.toFixed(1)}
      </span>
      <span className="text-sand">
        ({reviewsCount}
        <span className="sr-only"> avaliações</span>)
      </span>
    </p>
  )
}
