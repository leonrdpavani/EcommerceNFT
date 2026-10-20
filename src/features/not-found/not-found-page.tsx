import { Link } from "@tanstack/react-router"

import { buttonVariants } from "@/components/ui/button"

interface NotFoundPageProps {
  title?: string
  description?: string
}

export function NotFoundPage({
  title = "Página não encontrada",
  description = "O endereço acessado não existe ou foi movido. Que tal voltar ao mercado e explorar novas coleções?",
}: NotFoundPageProps) {
  return (
    <section className="container-page flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="text-[64px] leading-none font-bold tracking-[6px] text-brand-text lg:text-[96px]" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold text-cream lg:text-[28px]">{title}</h1>
      <p className="max-w-[46ch] text-sm leading-6 text-sand">{description}</p>
      <Link to="/" className={buttonVariants({ size: "lg" })}>
        Voltar ao início
      </Link>
    </section>
  )
}
