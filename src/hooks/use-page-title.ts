import { useEffect } from "react"

const BRAND = "Kurio"

/** Atualiza o título do documento a cada rota (importante para leitores de tela e histórico). */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : `${BRAND} — Marketplace de NFTs`
  }, [title])
}
