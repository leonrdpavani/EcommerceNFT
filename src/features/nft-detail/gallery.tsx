import { SearchIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import { NftImage } from "@/components/nft/nft-image"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { Nft } from "@/types/domain"

/** Vistas da galeria: a arte completa e recortes ampliados de detalhes. */
export const GALLERY_VIEWS = [
  { id: "completa", label: "Arte completa", style: undefined },
  { id: "rosto", label: "Detalhe do rosto", style: { transform: "scale(1.6)", transformOrigin: "50% 32%" } },
  { id: "acessorio", label: "Detalhe do acessório", style: { transform: "scale(1.9)", transformOrigin: "56% 88%" } },
  { id: "textura", label: "Detalhe da textura", style: { transform: "scale(2.4)", transformOrigin: "18% 22%" } },
] as const

export type GalleryViewId = (typeof GALLERY_VIEWS)[number]["id"]

export function viewStyle(view: GalleryViewId) {
  return GALLERY_VIEWS.find((item) => item.id === view)?.style
}

export function DesktopGallery({ nft }: { nft: Nft }) {
  const [view, setView] = useState<GalleryViewId>("completa")
  const [zoomOpen, setZoomOpen] = useState(false)
  const current = GALLERY_VIEWS.find((item) => item.id === view)!

  return (
    <div className="flex w-[573px] shrink-0 items-start gap-7">
      <div role="group" aria-label="Vistas da arte" className="flex w-[100px] shrink-0 flex-col gap-4">
        {GALLERY_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            aria-pressed={view === item.id}
            aria-label={item.label}
            className={cn(
              "size-[100px] cursor-pointer overflow-hidden rounded-lg border bg-surface transition-colors",
              view === item.id ? "border-brand" : "border-transparent hover:border-line-soft"
            )}
          >
            <NftImage artwork={nft.artwork} sizes="100px" alt="" className="size-full" style={item.style} />
          </button>
        ))}
      </div>

      <div className="relative flex size-[444px] shrink-0 items-center justify-center rounded-md bg-surface p-4">
        <div className="size-full overflow-hidden rounded-3xl">
          <NftImage
            artwork={nft.artwork}
            sizes="404px"
            priority
            alt={`${nft.name} — ${current.label.toLowerCase()}`}
            className="size-full transition-transform duration-300"
            style={current.style}
          />
        </div>
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute top-[15px] right-3 flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-ink text-cream ring-1 ring-line-soft transition-colors hover:text-brand-text"
          aria-label="Ampliar imagem"
          aria-haspopup="dialog"
        >
          <SearchIcon className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="w-[min(90vw,90dvh)] max-w-none p-3 sm:max-w-none">
          <DialogTitle className="sr-only">{nft.name} ampliado</DialogTitle>
          <DialogDescription className="sr-only">Visualização ampliada da arte do NFT.</DialogDescription>
          <NftImage artwork={nft.artwork} sizes="90vw" className="w-full rounded-2xl" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
