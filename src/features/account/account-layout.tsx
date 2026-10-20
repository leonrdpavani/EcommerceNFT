import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  ActivityIcon,
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { MobileScreenHeader } from "@/components/layout/page-parts"
import { useLogout } from "@/features/session/use-session"
import { useIsDesktop } from "@/hooks/use-media-query"
import { notifyUnavailable } from "@/lib/soon"

type NavEntry =
  | { label: string; icon: React.ElementType; to: "/conta/perfil" | "/conta/carteiras" | "/favoritos" }
  | { label: string; icon: React.ElementType; unavailable: string }

const NAV: NavEntry[] = [
  { label: "Dados do perfil", icon: UserIcon, to: "/conta/perfil" },
  { label: "Carteiras", icon: MapPinIcon, to: "/conta/carteiras" },
  { label: "Atividade", icon: ShoppingCartIcon, unavailable: "O histórico de atividade" },
  { label: "Lista de interesse", icon: HeartIcon, to: "/favoritos" },
  { label: "Ofertas", icon: ActivityIcon, unavailable: "A área de ofertas" },
  { label: "Arquivos baixados", icon: DownloadIcon, unavailable: "A área de downloads" },
  { label: "Suporte", icon: TriangleAlertIcon, unavailable: "O suporte" },
]

export function AccountLayout() {
  const isDesktop = useIsDesktop()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()

  const logoutMutation = useLogout()

  function logout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.success("Você saiu da sua conta.")
        void navigate({ to: "/" })
      },
    })
  }

  if (!isDesktop) {
    const title = pathname.startsWith("/conta/carteiras") ? "Carteiras" : "Meu perfil"
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 pt-8">
        <MobileScreenHeader
          title={title}
          action={
            <button
              type="button"
              onClick={logout}
              aria-label="Sair da conta"
              className="flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface-raised text-brand-text"
            >
              <LogOutIcon className="size-4" aria-hidden="true" />
            </button>
          }
        />
        <nav aria-label="Conta" className="scrollbar-none -mx-6 overflow-x-auto px-6">
          <ul className="flex gap-2">
            {NAV.filter((entry): entry is Extract<NavEntry, { to: string }> => "to" in entry).map((entry) => (
              <li key={entry.label}>
                <Link
                  to={entry.to}
                  className="flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm whitespace-nowrap text-sand transition-colors aria-[current=page]:border-brand aria-[current=page]:text-brand-text"
                  activeProps={{ "aria-current": "page" }}
                >
                  <entry.icon className="size-4" aria-hidden="true" />
                  {entry.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Outlet />
      </div>
    )
  }

  return (
    <div className="container-page mt-8 flex items-start gap-7">
      <aside className="w-[310px] shrink-0 bg-surface py-2">
        <h2 className="p-2.5 text-lg leading-4 font-bold text-cream">Meu perfil</h2>
        <nav aria-label="Conta">
          <ul>
            {NAV.map((entry) => (
              <li key={entry.label}>
                {"to" in entry ? (
                  <Link
                    to={entry.to}
                    activeOptions={{ exact: true }}
                    className="flex items-center gap-3 border-l-[6px] border-transparent px-4 text-[15px] leading-[45px] text-brand-text transition-colors hover:bg-surface-raised aria-[current=page]:border-brand"
                  >
                    <entry.icon className="size-[18px] shrink-0" aria-hidden="true" />
                    {entry.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => notifyUnavailable(entry.unavailable)}
                    className="flex w-full cursor-pointer items-center gap-3 border-l-[6px] border-transparent px-4 text-left text-[15px] leading-[45px] text-brand-text transition-colors hover:bg-surface-raised"
                  >
                    <entry.icon className="size-[18px] shrink-0" aria-hidden="true" />
                    {entry.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className={cn("mt-0 border-t-[0.6px] border-line-soft")}>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 w-full cursor-pointer items-center gap-2 px-4 text-[15px] leading-[15px] font-bold text-brand-text transition-colors hover:bg-surface-raised"
          >
            <LogOutIcon className="size-5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
