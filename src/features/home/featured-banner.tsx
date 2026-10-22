import { Link } from "@tanstack/react-router"

import { NftImage } from "@/components/nft/nft-image"

/** Banner "NFT em destaque" abaixo dos filtros (Figma: Featured NFT Banner). */
export function FeaturedBanner({ nftId, nftName }: { nftId: string; nftName: string }) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId }}
      className="group relative flex flex-col gap-4 overflow-hidden bg-gradient-featured pt-6 pb-1 transition-[filter] hover:brightness-110"
    >
      <span className="px-5 text-2xl leading-8 font-bold text-brand-text">NFT EM DESTAQUE</span>
      <span className="px-5 text-center text-[22px] leading-4 font-bold text-cream">
        OFERTA LIMITADA<span className="sr-only">: {nftName}</span>
      </span>
      <span className="relative block overflow-hidden rounded-[22px]">
        <NftImage artwork="sage-nomad" sizes="310px" alt="" className="h-[368px] w-full rounded-[22px]" />
        {/* Brilho de destaque: faixa de luz diagonal que atravessa a arte periodicamente. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-2/5 animate-shine bg-linear-to-r from-transparent via-white/60 to-transparent"
        />
      </span>
      <span
        aria-hidden="true"
        className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20"
      />
      <span
        aria-hidden="true"
        className="absolute top-[343px] left-[248px] size-[45px] rounded-[29px] bg-[linear-gradient(145deg,rgb(210_138_76/0.3)_46%,rgb(210_138_76/0)_103%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[105px] left-[38px] size-[15px] rounded-[29px] bg-[linear-gradient(145deg,rgb(210_138_76/0.3)_46%,rgb(210_138_76/0)_103%)]"
      />
    </Link>
  )
}
