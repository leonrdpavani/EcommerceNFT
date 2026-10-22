import { Link, useRouterState } from "@tanstack/react-router"
import { HeartIcon, HomeIcon, ScanSearchIcon, ShoppingCartIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import tabBarShape from "@/assets/decor/tabbar-shape.svg"
import { LazySearchDialog } from "@/components/layout/lazy-search-dialog"

/** Barra de navegação inferior do mobile (Figma: Mobile / Início › Tab Bar). */
export function MobileTabBar({ cartCount }: { cartCount: number }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto h-[96px] max-w-[640px] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <img
          src={tabBarShape}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -left-[7.25%] h-[calc(100%+60px)] w-[114.5%] max-w-none select-none"
        />
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar NFTs"
          className="absolute -top-[31px] left-1/2 flex size-[65px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4)_-17%,#d28a4c_109%)] text-ink shadow-float"
        >
          <ScanSearchIcon className="size-[26px]" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <ul className="relative grid h-full grid-cols-5 items-center px-6 pt-4">
          <TabItem to="/" label="Início" active={pathname === "/"}>
            <HomeIcon className="size-5" />
          </TabItem>
          <TabItem to="/favoritos" label="Favoritos" active={pathname.startsWith("/favoritos")}>
            <HeartIcon className="size-5" />
          </TabItem>
          <li aria-hidden="true" />
          <TabItem to="/carrinho" label="Carrinho" active={pathname.startsWith("/carrinho")} badge={cartCount}>
            <ShoppingCartIcon className="size-5" />
          </TabItem>
          <TabItem to="/conta/perfil" label="Perfil" active={pathname.startsWith("/conta")}>
            <UserIcon className="size-5" />
          </TabItem>
        </ul>
      </nav>
      <LazySearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}

function TabItem({
  to,
  label,
  active,
  badge,
  children,
}: {
  to: "/" | "/favoritos" | "/carrinho" | "/conta/perfil"
  label: string
  active: boolean
  badge?: number
  children: React.ReactNode
}) {
  return (
    <li className="flex justify-center">
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        aria-label={badge ? `${label}, ${badge} ${badge === 1 ? "item" : "itens"}` : label}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full transition-colors [&_svg]:fill-current",
          active ? "text-brand" : "text-sand hover:text-brand-text"
        )}
      >
        {children}
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-ink"
          >
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
