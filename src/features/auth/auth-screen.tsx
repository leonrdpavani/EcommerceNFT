import { Link, useNavigate } from "@tanstack/react-router"
import { cn } from "cn"

import { Logo } from "@/components/layout/logo"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { AuthSwitchLink, LoginForm, SignupForm, SocialSignIn } from "@/features/auth/auth-forms"
import { HomePage } from "@/features/home/home-page"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { DEFAULT_CATALOG_SEARCH } from "@/lib/catalog-search"

type AuthMode = "login" | "signup"

const COPY: Record<AuthMode, { title: string; mobileTitle: string; description: string }> = {
  login: {
    title: "Entrar",
    mobileTitle: "Entrar",
    description: "Entre para gerenciar sua carteira, coleção e perfil de criador.",
  },
  signup: {
    title: "Criar conta",
    mobileTitle: "Criar perfil de colecionador",
    description: "Crie seu perfil de colecionador e conecte uma carteira quando quiser.",
  },
}

/** Login e cadastro: modal sobre o início no desktop, tela própria no mobile (conforme o Figma). */
export function AuthScreen({ mode, redirect }: { mode: AuthMode; redirect?: string }) {
  usePageTitle(COPY[mode].title)
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()

  const leave = () => {
    if (redirect?.startsWith("/")) void navigate({ to: redirect })
    else void navigate({ to: "/" })
  }

  const form =
    mode === "login" ? (
      <LoginForm variant={isDesktop ? "dialog" : "page"} onSuccess={leave} />
    ) : (
      <SignupForm variant={isDesktop ? "dialog" : "page"} onSuccess={leave} />
    )

  if (!isDesktop) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-10 px-7 pt-20 pb-6">
        <div className="flex h-[136px] items-center justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="text-center text-xl leading-4 font-bold text-cream">{COPY[mode].mobileTitle}</h1>
        <p className="sr-only">{COPY[mode].description}</p>
        {form}
        <SocialSignIn variant="page" />
        <AuthSwitchLink mode={mode} redirect={redirect} />
      </div>
    )
  }

  return (
    <>
      <div aria-hidden="true" inert>
        <HomePage search={DEFAULT_CATALOG_SEARCH} onSearchChange={() => undefined} onReset={() => undefined} />
      </div>
      <Dialog open onOpenChange={(open) => !open && leave()}>
        <DialogContent className="w-[500px] max-w-[calc(100%-2rem)] p-0 sm:max-w-[500px]">
          <div className="flex flex-col items-center gap-10 px-12 pt-12">
            <nav aria-label="Acesso à conta" className="flex items-stretch gap-2 text-xl leading-4 font-medium">
              <AuthTab to="/entrar" active={mode === "login"} redirect={redirect}>
                Entrar
              </AuthTab>
              <span aria-hidden="true" className="w-px bg-coral" />
              <AuthTab to="/cadastro" active={mode === "signup"} redirect={redirect}>
                Criar conta
              </AuthTab>
            </nav>
            <DialogTitle className="sr-only">{COPY[mode].title}</DialogTitle>
            <DialogDescription className="text-center text-[13px] leading-4 text-cream">
              {COPY[mode].description}
            </DialogDescription>
          </div>
          <div className="px-20 pt-6">{form}</div>
          <div className="pt-6 pb-14">
            <SocialSignIn variant="dialog" />
          </div>
          <div aria-hidden="true" className="h-2.5 bg-brand" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function AuthTab({
  to,
  active,
  redirect,
  children,
}: {
  to: "/entrar" | "/cadastro"
  active: boolean
  redirect?: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      search={{ redirect }}
      replace
      aria-current={active ? "page" : undefined}
      className={cn("py-0.5 transition-colors hover:text-brand-text", active ? "text-brand-text" : "text-cream")}
    >
      {children}
    </Link>
  )
}
