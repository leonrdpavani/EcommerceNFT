import { Link, useCanGoBack, useRouter } from "@tanstack/react-router"
import { ChevronLeftIcon } from "lucide-react"
import { Fragment } from "react"
import { cn } from "cn"

type Crumb = { label: string; to?: "/" | "/carrinho"; hash?: string }

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Trilha de navegação" className={cn("text-[15px] leading-4 font-bold text-cream", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={item.label}>
              <li>
                {item.to && !last ? (
                  <Link to={item.to} hash={item.hash} className="transition-colors hover:text-brand-text">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>{item.label}</span>
                )}
              </li>
              {!last ? (
                <li aria-hidden="true" className="select-none">
                  /
                </li>
              ) : null}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/** Botão circular de voltar usado nos cabeçalhos mobile. */
export function BackButton({ fallback = "/", className }: { fallback?: "/" | "/carrinho"; className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: fallback }))}
      aria-label="Voltar"
      className={cn(
        "flex size-[35px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-raised text-cream transition-colors hover:border-brand hover:text-brand-text",
        className
      )}
    >
      <ChevronLeftIcon className="size-5" aria-hidden="true" />
    </button>
  )
}

export function MobileScreenHeader({
  title,
  fallback,
  action,
  className,
}: {
  title: string
  fallback?: "/" | "/carrinho"
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("grid h-11 items-center gap-3", action ? "grid-cols-[35px_1fr_35px]" : "grid-cols-[35px_1fr]", className)}>
      <BackButton fallback={fallback} />
      <h1 className="truncate text-center text-xl leading-4 font-bold text-cream">{title}</h1>
      {action ? <div className="flex justify-end">{action}</div> : null}
    </header>
  )
}

export function SectionHeading({
  children,
  id,
  className,
  as: Heading = "h2",
}: {
  children: React.ReactNode
  id?: string
  className?: string
  as?: "h2" | "h3"
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b-[0.6px] border-line-soft pb-3", className)}>
      <Heading id={id} className="text-[17px] leading-4 font-bold text-brand-text">
        {children}
      </Heading>
    </div>
  )
}
