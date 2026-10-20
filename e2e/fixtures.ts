import { test as base, expect, type Page } from "@playwright/test"

export const USERS = {
  ana: { email: "ana@kurio.dev", password: "Kurio2026", name: "Ana Colecionadora" },
  bruno: { email: "bruno@kurio.dev", password: "Kurio2026", name: "Bruno Criador" },
}

type MockConfig = { latency?: "none" | "normal" | "slow"; settleMs?: number; sessionMinutes?: number }

/**
 * Cada teste começa com: banco simulado no seed (contexto novo = localStorage vazio)
 * e rede sem latência artificial, para resultados determinísticos.
 */
export const test = base.extend<{ mockConfig: MockConfig; isMobile: boolean }>({
  mockConfig: [{ latency: "none", settleMs: 600 }, { option: true }],
  isMobile: async ({ viewport }, use) => {
    await use((viewport?.width ?? 1440) < 1024)
  },
  page: async ({ page, mockConfig }, use) => {
    await page.addInitScript((config) => {
      if (!sessionStorage.getItem("kurio:e2e-init")) {
        localStorage.setItem("kurio:mock-config", JSON.stringify(config))
        sessionStorage.setItem("kurio:e2e-init", "1")
      }
    }, mockConfig)
    await use(page)
  },
})

export { expect }

/** Faz login pela interface (modal no desktop, tela no mobile). */
export async function login(page: Page, user = USERS.ana, redirect?: string) {
  await page.goto(redirect ? `/entrar?redirect=${encodeURIComponent(redirect)}` : "/entrar")
  await page.getByPlaceholder("contato@email.com").fill(user.email)
  await page.getByPlaceholder("Senha", { exact: true }).fill(user.password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect(page.getByText(`Bem-vindo(a), ${user.name}!`)).toBeVisible()
}

/** Adiciona um NFT ao carrinho a partir da página de detalhe. */
export async function addToCartFromDetail(page: Page, nftId: string, { isMobile }: { isMobile: boolean }) {
  await page.goto(`/nft/${nftId}`)
  if (isMobile) await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  else await page.getByRole("button", { name: "COMPRAR", exact: true }).click()
  await expect(page.getByText(/adicionado ao carrinho/)).toBeVisible()
}

/** Itens do carrinho: tabela no desktop, lista no mobile (ambas nomeadas "Itens no carrinho"). */
export function cartItems(page: Page) {
  return page.getByRole("table", { name: "Itens no carrinho" }).or(page.getByRole("list", { name: "Itens no carrinho" }))
}
