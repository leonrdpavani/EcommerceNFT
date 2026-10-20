import { Link, useRouterState } from "@tanstack/react-router"
import { LogInIcon, SearchIcon, ShoppingCartIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import { Logo } from "@/components/layout/logo"
import { LazySearchDialog } from "@/components/layout/lazy-search-dialog"
import { useSession } from "@/features/session/use-session"
import { notifyUnavailable } from "@/lib/soon"

const MARKET_PATHS = ["/nft", "/carrinho", "/pagamento", "/pedido"]

interface SiteHeaderProps {
  cartCount: number
  /** Linha divisória sob o header (presente em Início, Perfil e Carteiras no Figma). */
  divider?: boolean
}

export function SiteHeader({ cartCount, divider = false }: SiteHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [searchOpen, setSearchOpen] = useState(false)
  const { user } = useSession()
  const active = MARKET_PATHS.some((path) => pathname.startsWith(path)) ? "market" : "home"

  return (
    <header className="container-page pt-6">
      <div className={cn("flex items-start justify-between", divider && "border-b-[0.6px] border-line-soft/80")}>
        <div className="flex h-[34px] w-40 items-center">
          <Logo />
        </div>

        <nav aria-label="Principal">
          <ul className="flex items-start gap-10">
            <NavItem to="/" label="Início" active={active === "home"} />
            <NavItem to="/" hash="catalogo" label="Mercado" active={active === "market"} />
            <li>
              <button
                type="button"
                className="cursor-pointer pb-6 text-base text-cream transition-colors hover:text-brand-text"
                onClick={() => notifyUnavailable("A página de criadores")}
              >
                Criadores
              </button>
            </li>
            <li>
              <button
                type="button"
                className="cursor-pointer pb-6 text-base text-cream transition-colors hover:text-brand-text"
                onClick={() => notifyUnavailable("A área Aprenda")}
              >
                Aprenda
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-7 pt-px">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-8 cursor-pointer items-center justify-center text-cream transition-colors hover:text-brand-text"
            aria-label="Buscar NFTs"
          >
            <SearchIcon className="size-[22px]" aria-hidden="true" />
          </button>

          <Link
            to="/carrinho"
            className="relative flex size-8 items-center justify-center text-cream transition-colors hover:text-brand-text"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
          >
            <ShoppingCartIcon className="size-6" aria-hidden="true" />
            {cartCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-brand px-0.5 text-[10px] leading-none font-medium text-ink box-content"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <Link
              to="/conta/perfil"
              className="flex h-[35px] max-w-[180px] items-center gap-2 rounded-md border border-brand px-2.5 text-sm font-medium text-brand-text transition-colors hover:bg-brand/10"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
              ) : (
                <UserIcon className="size-5" aria-hidden="true" />
              )}
              <span className="truncate">
                <span className="sr-only">Minha conta: </span>
                {user.displayName}
              </span>
            </Link>
          ) : (
            <Link
              to="/entrar"
              search={{ redirect: pathname === "/" ? undefined : pathname }}
              className="flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-brand text-base font-medium text-ink transition-colors hover:bg-brand-text"
            >
              <LogInIcon className="size-5" aria-hidden="true" />
              Entrar
            </Link>
          )}
        </div>
      </div>
      <LazySearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}

function NavItem({ to, hash, label, active }: { to: "/"; hash?: string; label: string; active: boolean }) {
  return (
    <li>
      <Link
        to={to}
        hash={hash}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative block pb-6 text-base transition-colors hover:text-brand-text",
          active
            ? "font-bold text-brand-text after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-brand"
            : "text-cream"
        )}
      >
        {label}
      </Link>
    </li>
  )
}
