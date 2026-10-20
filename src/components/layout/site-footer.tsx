import { Link } from "@tanstack/react-router"
import { useId, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import facebookIcon from "@/assets/icons/social-facebook.svg"
import instagramIcon from "@/assets/icons/social-instagram.svg"
import linkedinIcon from "@/assets/icons/social-linkedin.svg"
import twitterIcon from "@/assets/icons/social-twitter.svg"
import youtubeIcon from "@/assets/icons/social-youtube.svg"
import { notifyUnavailable } from "@/lib/soon"

const FEATURES = [
  {
    monogram: "W",
    title: "Segurança da carteira",
    text: "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    monogram: "C",
    title: "Criadores em destaque",
    text: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    monogram: "D",
    title: "Alertas de lançamentos",
    text: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
]

const SOCIALS = [
  { label: "Facebook", icon: facebookIcon, href: "https://www.facebook.com" },
  { label: "Instagram", icon: instagramIcon, href: "https://www.instagram.com" },
  { label: "X (Twitter)", icon: twitterIcon, href: "https://x.com" },
  { label: "LinkedIn", icon: linkedinIcon, href: "https://www.linkedin.com" },
  { label: "YouTube", icon: youtubeIcon, href: "https://www.youtube.com" },
]

type FooterLink = { label: string } & ({ to: "/conta/perfil" | "/favoritos" | "/" } | { unavailable: string })

const LINK_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Meu perfil",
    links: [
      { label: "Meu perfil", to: "/conta/perfil" },
      { label: "Minha coleção", unavailable: "A coleção do colecionador" },
      { label: "Atividade", unavailable: "O histórico de atividade" },
      { label: "Estúdio do criador", unavailable: "O estúdio do criador" },
      { label: "Lista de interesse", to: "/favoritos" },
    ],
  },
  {
    title: "Central de ajuda",
    links: [
      { label: "Central de ajuda", unavailable: "A central de ajuda" },
      { label: "Como comprar NFTs", unavailable: "O guia de compra" },
      { label: "Carteira e segurança", unavailable: "O guia de segurança" },
      { label: "Política do mercado", unavailable: "A política do mercado" },
      { label: "Denunciar item", unavailable: "A denúncia de itens" },
    ],
  },
  {
    title: "Coleções",
    links: [
      { label: "Arte digital", to: "/" },
      { label: "Fotografia", to: "/" },
      { label: "Música", to: "/" },
      { label: "Arte 3D", to: "/" },
      { label: "Utilidade", to: "/" },
    ],
  },
]

const COLLECTION_FILTER: Record<string, "arte-digital" | "fotografia" | "musica" | "arte-3d" | "utilidade"> = {
  "Arte digital": "arte-digital",
  Fotografia: "fotografia",
  Música: "musica",
  "Arte 3D": "arte-3d",
  Utilidade: "utilidade",
}

export function WalletChips({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex h-[26px] items-center justify-center rounded-md border border-line-soft bg-surface-dark px-2 text-[9px] leading-none font-bold tracking-[0.1px] whitespace-pre text-brand-text",
        className
      )}
    >
      {"METAMASK  •  WALLETCONNECT  •  COINBASE"}
    </p>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("container-page pt-24 pb-1", className)}>
      <div className="bg-surface p-6 lg:p-8">
        <div className="grid gap-8 md:grid-cols-2 lg:flex lg:items-stretch lg:gap-0">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 lg:flex-1 lg:border-r lg:border-brand lg:px-4"
            >
              <span
                aria-hidden="true"
                className="flex size-[74px] items-center justify-center rounded-full bg-brand text-2xl font-bold text-ink"
              >
                {feature.monogram}
              </span>
              <h2 className="text-[17px] leading-4 font-bold text-cream">{feature.title}</h2>
              <p className="max-w-[204px] text-sm leading-[22px] text-sand">{feature.text}</p>
            </div>
          ))}
          <NewsletterForm />
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-surface-dark px-6 py-6 text-sm leading-[22px] text-cream md:flex-row md:items-center md:gap-8 lg:h-[88px] lg:px-8 lg:py-0">
        <p className="font-bold tracking-[1.4px] uppercase md:flex-1">Kurio</p>
        <p className="md:flex-1">
          Feito para colecionadores,
          <br className="max-md:hidden" /> criadores e cultura
        </p>
        <p className="md:flex-1">
          <a href="mailto:contato@email.com" className="hover:text-brand-text hover:underline">
            contato@email.com
          </a>
        </p>
        <p className="lg:w-[228px]">
          <a href="tel:+551140028922" className="hover:text-brand-text hover:underline">
            +55 11 4002 8922
          </a>
        </p>
      </div>

      <div className="grid gap-8 bg-surface p-6 sm:grid-cols-2 lg:flex lg:gap-[124px] lg:p-8">
        {LINK_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2 lg:flex-1">
            <h2 className="text-lg leading-4 font-bold text-cream">{column.title}</h2>
            <ul className="text-sm leading-[30px] text-cream">
              {column.links.map((link) => (
                <li key={link.label}>
                  {"to" in link ? (
                    <Link
                      to={link.to}
                      search={
                        COLLECTION_FILTER[link.label]
                          ? (prev: Record<string, unknown>) => ({ ...prev, categories: [COLLECTION_FILTER[link.label]], page: 1 })
                          : undefined
                      }
                      hash={COLLECTION_FILTER[link.label] ? "catalogo" : undefined}
                      className="transition-colors hover:text-brand-text"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="cursor-pointer transition-colors hover:text-brand-text"
                      onClick={() => notifyUnavailable(link.unavailable)}
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-8 lg:w-[228px]">
          <div className="flex flex-col gap-5">
            <h2 className="text-lg leading-4 font-bold text-cream">Redes sociais</h2>
            <ul className="flex items-center gap-2.5">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[5px] transition-opacity hover:opacity-80"
                    aria-label={`${social.label} (abre em nova aba)`}
                  >
                    <img src={social.icon} alt="" width={30} height={30} className="size-[30px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg leading-4 font-bold text-cream">Carteiras compatíveis</h2>
            <WalletChips />
          </div>
        </div>
      </div>

      <p className="py-1.5 text-center text-sm leading-[30px] text-cream">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

function NewsletterForm() {
  const inputId = useId()
  const hintId = useId()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.")
      return
    }
    setError(null)
    setEmail("")
    toast.info("A newsletter não está disponível nesta demonstração. Nenhum e-mail foi cadastrado.")
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 md:col-span-2 lg:w-[357px] lg:shrink-0 lg:px-4"
      aria-labelledby={`${inputId}-title`}
    >
      <h2 id={`${inputId}-title`} className="text-lg leading-4 font-bold text-cream">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="mt-1 flex h-10 rounded-md bg-surface-dark shadow-float">
        <label htmlFor={inputId} className="sr-only">
          E-mail para a newsletter
        </label>
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId}-error` : hintId}
          className="min-w-0 flex-1 bg-transparent pl-3 text-sm text-cream outline-none placeholder:text-taupe focus-visible:outline-none"
        />
        <button
          type="submit"
          className="h-10 w-[85px] cursor-pointer rounded-r-md bg-brand text-lg leading-4 font-bold text-ink transition-colors hover:bg-brand-text"
        >
          Enviar
        </button>
      </div>
      {error ? (
        <p id={`${hintId}-error`} className="text-[13px] text-coral" role="alert">
          {error}
        </p>
      ) : null}
      <p id={hintId} className="text-[13px] leading-[22px] text-sand">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}
