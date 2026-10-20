import { cn } from "cn"

import { ARTWORK_ALT } from "@/lib/catalog"
import type { ArtworkKey } from "@/types/domain"

const WIDTHS = [160, 320, 640, 960] as const

interface NftImageProps {
  artwork: ArtworkKey
  /** Atributo `sizes` do srcset — descreve a largura renderizada da imagem. */
  sizes: string
  /** Texto alternativo; por padrão descreve a arte. Use "" quando a imagem for decorativa. */
  alt?: string
  priority?: boolean
  className?: string
  style?: React.CSSProperties
}

export function NftImage({ artwork, sizes, alt, priority = false, className, style }: NftImageProps) {
  return (
    <img
      src={`/images/nfts/${artwork}-640.webp`}
      srcSet={WIDTHS.map((width) => `/images/nfts/${artwork}-${width}.webp ${width}w`).join(", ")}
      sizes={sizes}
      width={640}
      height={640}
      alt={alt ?? ARTWORK_ALT[artwork]}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      style={style}
      className={cn("aspect-square bg-surface-raised object-cover", className)}
    />
  )
}
