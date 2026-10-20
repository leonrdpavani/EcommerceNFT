import { NftImage } from "@/components/nft/nft-image"
import { notifyUnavailable } from "@/lib/soon"
import type { ArtworkKey } from "@/types/domain"

const POSTS: { date: string; reading: string; title: string; excerpt: string; artwork: ArtworkKey }[] = [
  {
    date: "12 de setembro",
    reading: "Leitura de 6 min",
    title: "Como funciona a propriedade de NFTs",
    excerpt: "Aprenda a colecionar, negociar e verificar ativos digitais.",
    artwork: "ivory-baron",
  },
  {
    date: "13 de setembro",
    reading: "Leitura de 2 min",
    title: "10 artistas digitais para acompanhar",
    excerpt: "Conheça criadores que moldam a cultura digital.",
    artwork: "emerald-ape",
  },
  {
    date: "15 de setembro",
    reading: "Leitura de 3 min",
    title: "Raridade, atributos e procedência",
    excerpt: "Entenda raridade, procedência, direitos autorais e utilidade.",
    artwork: "sage-nomad",
  },
  {
    date: "15 de setembro",
    reading: "Leitura de 2 min",
    title: "Como proteger sua carteira",
    excerpt: "Proteja sua carteira, seus ativos e sua identidade.",
    artwork: "golden-beat",
  },
]

/** Seção editorial "Diário da Cunhagem" — artigos fora do escopo da entrega. */
export function BlogSection() {
  return (
    <section aria-labelledby="blog-title" className="flex flex-col items-center gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-title" className="text-[28px] font-bold text-paper">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-sand">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface">
              <NftImage
                artwork={post.artwork}
                sizes="(min-width: 64rem) 282px, (min-width: 40rem) 45vw, 90vw"
                alt=""
                className="aspect-auto h-[195px] w-full object-[50%_30%]"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-sand">
                  {post.date}
                  {"  |  "}
                  {post.reading}
                </p>
                <h3 className="text-base font-bold text-paper">{post.title}</h3>
                <p className="text-xs leading-4 font-medium text-sand">{post.excerpt}</p>
                <button
                  type="button"
                  onClick={() => notifyUnavailable("O Diário da Cunhagem")}
                  className="mt-auto flex w-fit cursor-pointer items-start gap-1 pt-1 text-xs text-brand-text hover:underline"
                  aria-label={`Ler mais: ${post.title}`}
                >
                  <span className="leading-[14px] font-bold">Ler mais</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
