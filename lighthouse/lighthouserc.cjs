/**
 * Configuração da auditoria Lighthouse (LHCI). Executada por `npm run lighthouse`,
 * que define LH_PROFILE (mobile | desktop) e LH_BASE_URL.
 *
 * - Build otimizado (`vite build`) servido por `vite preview`, com os mocks padrão (MSW).
 *   O script sobe e encerra o servidor (porta livre por perfil) e confere o build medido.
 * - Páginas: início e detalhe do NFT.
 * - 3 medições por página e perfil; a mediana de cada categoria é reportada.
 *
 * Uso direto (sem o script): suba `npx vite preview --port 4173` e rode
 * `LH_BASE_URL=http://localhost:4173 npx lhci collect --config=lighthouse/lighthouserc.cjs`.
 */
const profile = process.env.LH_PROFILE === "desktop" ? "desktop" : "mobile"
const base = process.env.LH_BASE_URL || "http://localhost:4173"

module.exports = {
  ci: {
    collect: {
      url: [`${base}/`, `${base}/nft/emerald-ape-042`],
      numberOfRuns: 3,
      settings: {
        // mobile: Moto G Power emulado, 4G lento simulado e CPU 4x (padrão do Lighthouse).
        // desktop: preset oficial "desktop" (1350×940, sem limitação de CPU, cabo).
        ...(profile === "desktop" ? { preset: "desktop" } : { formFactor: "mobile" }),
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        locale: "pt-BR",
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: `lighthouse/reports/${profile}`,
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
}
