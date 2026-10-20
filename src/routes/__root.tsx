import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet, useRouterState } from "@tanstack/react-router"
import { cn } from "cn"

import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Toaster } from "@/components/ui/sonner"
import { useCart } from "@/features/cart/use-cart"
import { NotFoundPage } from "@/features/not-found/not-found-page"
import { SessionSync } from "@/features/session/session-sync"
import { useIsDesktop } from "@/hooks/use-media-query"

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
})

const DIVIDER_PATHS = ["/", "/entrar", "/cadastro"]
const TAB_BAR_PATHS = ["/favoritos", "/conta"]

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isDesktop = useIsDesktop()
  const cartCount = useCart().data?.itemCount ?? 0

  const showTabBar = !isDesktop && (pathname === "/" || TAB_BAR_PATHS.some((path) => pathname.startsWith(path)))
  const divider = DIVIDER_PATHS.includes(pathname) || pathname.startsWith("/conta")
  const showFooter = isDesktop && !pathname.startsWith("/pedido")

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-[60] rounded-md bg-brand px-4 py-2 font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <SessionSync />
      {isDesktop ? <SiteHeader cartCount={cartCount} divider={divider} /> : null}
      <main id="conteudo" tabIndex={-1} className={cn("outline-none", showTabBar && "pb-36")}>
        <Outlet />
      </main>
      {showFooter ? <SiteFooter /> : null}
      {showTabBar ? <MobileTabBar cartCount={cartCount} /> : null}
      <Toaster position={isDesktop ? "bottom-right" : "top-center"} />
    </>
  )
}
