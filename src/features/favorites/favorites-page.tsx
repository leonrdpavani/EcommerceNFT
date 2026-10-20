import { Link } from "@tanstack/react-router"
import { HeartIcon } from "lucide-react"

import { MobileScreenHeader } from "@/components/layout/page-parts"
import { buttonVariants } from "@/components/ui/button"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"

/** Lista de interesse. Sem frame no Figma: segue os padrões visuais do catálogo. */
export function FavoritesPage() {
  usePageTitle("Lista de interesse")
  const isDesktop = useIsDesktop()

  return (
    <div className={isDesktop ? "container-page mt-8" : "mx-auto flex max-w-[720px] flex-col gap-6 px-6 pt-8"}>
      {isDesktop ? (
        <h1 className="border-b-[0.6px] border-line-soft pb-3 text-[17px] leading-4 font-bold text-brand-text">
          Lista de interesse
        </h1>
      ) : (
        <MobileScreenHeader title="Favoritos" />
      )}
      <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-soft px-6 py-16 text-center">
        <HeartIcon className="size-10 text-brand-text" aria-hidden="true" />
        <h2 className="text-lg font-bold text-cream">Nenhum favorito por aqui</h2>
        <p className="max-w-[40ch] text-sm leading-6 text-sand">
          Toque no coração de um NFT para guardá-lo na sua lista. Seus favoritos ficam salvos na sua conta.
        </p>
        <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
          Explorar o mercado
        </Link>
      </div>
    </div>
  )
}
